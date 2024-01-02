/**
 * This file acts as a bridge so that content scripts call the chrome extension API's
 *
 * It's also used to implement blocking of certain image requests so that users can use
 * Streak's email tracking features.
 * For more info about this feature, see: https://www.streak.com/email-tracking-in-gmail
 */

'use strict';

var connectionsByTabId = {};
var globalImageURLwhitelist = [];
var globalImageURLblockers = [];
var extensionData = {};
var resultPromises = {};
var tabIdToLastSeenUrl = {};

var EMPTY_IMAGE = {
  redirectUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
};

function setupTabInterceptor() {
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    handleDeepLink(tabId, tab);
  });

  chrome.tabs.query(
    {
      currentWindow: true
    },
    function (tabs) {
      for (var ii = 0; ii < tabs.length; ii++) {
        var tab = tabs[ii];
        handleDeepLink(tab.id, tab);
      }
    }
  );
}

function handleDeepLink(tabId, tab) {
  var lastSeenUrl = tabIdToLastSeenUrl[tabId] || '';
  var newUrl = tab.url;
  var deepLinkOptions;

  tabIdToLastSeenUrl[tabId] = newUrl;

  if (!newUrl || newUrl === lastSeenUrl) return;

  var urlToGoTo;
  var parts;
  var clientType;

  if (newUrl.match(/^https:\/\/www\.streak\.com\/a\//)) {
    var appPath = newUrl.split('/a/')[1];
    parts = appPath.split('/');
    deepLinkOptions = {
      appPath: appPath,
      version: 2
    };

    switch (parts[0]) {
      case 'boxes':
      case 'box':
        clientType = 'box';
        break;
      case 'pipeline':
      case 'pipelines':
        clientType = 'pipeline';
        break;
    }

    if (clientType) {
      urlToGoTo =
        'https://mail.google.com/#' +
        clientType +
        '/' +
        parts[1] +
        (parts[2] ? '/' + parts[2] : '');
    }
  } else if (
    newUrl.match(/^https:\/\/mail.google.com\//) &&
    !lastSeenUrl.match(/^https:\/\/mail.google.com\//)
  ) {
    var everythingAfterHash = newUrl.split('#')[1];
    if (!everythingAfterHash) return; // there is no hash
    parts = everythingAfterHash.split('/');

    switch (parts[0]) {
      case 'box':
        clientType = 'box';
        break;

      case 'pipeline':
        clientType = 'pipeline';
        break;
    }

    if (clientType) {
      deepLinkOptions = {
        type: clientType,
        key: parts[1],
        subKey: parts[2],
        version: 2
      };

      urlToGoTo =
        'https://mail.google.com/#' +
        clientType +
        '/' +
        parts[1] +
        (parts[2] ? '/' + parts[2] : '');
    }
  }

  if (!deepLinkOptions) return;

  trackEvent('deepLink.click', {
    fullHref: newUrl
  });

  //we map to parseInt because keys returns tabIds as strings
  //and the chrome.tabs API requires tabIds to be numbers
  var tabIds = Object.keys(connectionsByTabId).map(function (id) {
    return parseInt(id);
  });

  tryToDeepLink(deepLinkOptions, tabIds).then(function (response) {
    if (response) {
      var tabIdWithData = response.tabId;

      if (tabIdWithData != null) {
        chrome.tabs.remove(tabId);
        chrome.tabs.update(tabIdWithData, {
          active: true
        });
      } else {
        chrome.tabs.update(tabId, {
          url: response.setNewTabUrl
        });
      }
    } else {
      if (urlToGoTo) {
        chrome.tabs.update(tabId, {
          url: urlToGoTo
        });
      }
    }
  });
}

function tryToDeepLink(linkDetails, tabIds) {
  if (tabIds.length === 0) return Promise.resolve(null);

  var tabId = tabIds.shift();

  return callIntoContentScript(tabId, linkDetails, 'goTo')
    .catch(function () {
      return null;
    })
    .then(function (response) {
      if (response) {
        if (response.found) return {tabId: tabId};
        else if (tabIds.length === 0) return {setNewTabUrl: response.setNewTabUrl};
      }
      return tryToDeepLink(linkDetails, tabIds);
    });
}

function callIntoContentScript(tabId, data, op) {
  return new Promise(function (resolve, reject) {
    var connection = connectionsByTabId[tabId];
    if (connection) {
      var exchangeId = Math.random() + '.' + Date.now();
      resultPromises[exchangeId] = {resolve: resolve, reject: reject};

      connection.port.postMessage({
        data: data,
        op: op,
        exchangeId: exchangeId,
        isFromBackgroundPage: true
      });
    } else {
      reject(new Error('No connection for tab'));
    }
  });
}

function responseToBackgroundPageInitiatedEvent(data, connection, exchangeId, error) {
  var promiseCallbacks = resultPromises[exchangeId];
  if (promiseCallbacks) {
    delete resultPromises[exchangeId];
    var resolve = promiseCallbacks.resolve;
    var reject = promiseCallbacks.reject;

    if (error) {
      reject(error);
    } else {
      resolve(data);
    }
  }
}

function setupRequestInterceptor() {
  chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
      // This is so Streak can block email tracking images that were sent by
      // the local user, so that we don't track the user's views of their own
      // emails.

      if (details.method !== 'GET') {
        return;
      }

      var connection = connectionsByTabId[details.tabId];

      var imageURLwhitelist = globalImageURLwhitelist.concat(
        connection ? connection.imageURLwhitelist : []
      );
      var imageURLblockers = globalImageURLblockers.concat(
        connection ? connection.imageURLblockers : []
      );

      var shouldBlock =
        !imageURLwhitelist.some(function (regex) {
          return regex.test(details.url);
        }) &&
        imageURLblockers.some(function (regex) {
          return regex.test(details.url);
        });

      if (!shouldBlock) {
        return;
      }

      if (connection) {
        connection.port.postMessage({
          op: 'blockedImage',
          data: {
            url: details.url
          }
        });
      }

      return EMPTY_IMAGE;
    },
    {
      urls: ['*://*.googleusercontent.com/*', '*://*.mailfoogae.appspot.com/*'],
      types: ['image']
    },
    ['blocking']
  );
}

function deserializeRegExpList(serialized) {
  return serialized.map(function (item) {
    return new RegExp(item.source, item.flags);
  });
}

function loadGlobalBlockers() {
  try {
    var serialized = window.localStorage.getItem('globalBlockers');
    if (!serialized) {
      return;
    }
    var parsed = JSON.parse(serialized);
    globalImageURLwhitelist = deserializeRegExpList(parsed.whitelist);
    globalImageURLblockers = deserializeRegExpList(parsed.blockers);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error loading blockers', err);
  }
}

function saveGlobalBlockers(serializedWhitelist, serializedBlockers) {
  try {
    window.localStorage.setItem(
      'globalBlockers',
      JSON.stringify({
        timestamp: Date.now(),
        whitelist: serializedWhitelist,
        blockers: serializedBlockers
      })
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error saving blockers', err);
  }
}

var portResponders = {
  // transient data storage that lasts for a single background page instance
  setData: {
    handler: function (packet) {
      return new Promise(function (resolve) {
        if (extensionData[packet.key]) {
          clearTimeout(extensionData[packet.key].timeoutHandle);
        }

        extensionData[packet.key] = packet;

        var expiration = packet.expiration === -1 ? -1 : packet.expiration || 30 * 1000; //30 seconds;
        if (expiration === -1) return;

        extensionData[packet.key].timeoutHandle = setTimeout(function () {
          delete extensionData[packet.key];
        }, expiration);
      });
    }
  },
  getData: {
    handler: function (packet) {
      return new Promise(function (resolve) {
        if (!extensionData[packet.key]) {
          resolve();
          return;
        }

        var value = extensionData[packet.key].value;
        if (packet.shouldClear) {
          clearTimeout(extensionData[packet.key].timeoutHandle);
          delete extensionData[packet.key];
        }
        resolve(value);
      });
    }
  },

  // persistent data storage
  setLocalStorageItem: {
    handler: function (packet) {
      var key = packet.key;
      var value = packet.value;

      localStorage.setItem(key, value);
    }
  },
  getLocalStorageItem: {
    handler: function (packet) {
      var key = packet.key;

      return localStorage.getItem(key);
    }
  },
  removeLocalStorageItem: {
    handler: function (packet) {
      var key = packet.key;

      localStorage.removeItem(key);
    }
  },
  getLocalStorageKeys: {
    handler: function (packet) {
      var keys = [];
      for (var i = 0, len = localStorage.length; i < len; i++) {
        keys.push(localStorage.key(i));
      }
      return keys;
    }
  },

  extensionListRequest: {
    legacyResponseName: 'extensionListResponse',
    handler: function () {
      return new Promise(function (resolve, reject) {
        chrome.management.getAll(function (list) {
          resolve(list);
        });
      });
    }
  },
  backgroundFunction: {
    legacyResponseName: 'backgroundFunctionResponse',
    handler: function (data) {
      return new Promise(function (resolve, reject) {
        if (data && data.functionPath) {
          callBackgroundFunction(
            data.functionPath,
            (data.args || []).concat(function (result) {
              resolve({
                functionPath: data.functionPath,
                args: data.args,
                result: result
              });
            })
          );
        } else {
          reject(new Error('Bad arguments'));
        }
      });
    }
  },
  backgroundFunctionWithNoResponse: {
    handler: function (data) {
      if (data && data.functionPath) {
        callBackgroundFunction(data.functionPath, data.args || []);
      } else {
        throw new Error('Bad arguments');
      }
    }
  },
  setImageURLblockers: {
    handler: function (data, connection) {
      if (data.whitelist) {
        connection.imageURLwhitelist = deserializeRegExpList(data.whitelist);
      }
      if (data.blockers) {
        connection.imageURLblockers = deserializeRegExpList(data.blockers);
      }
      if (data.globalWhitelist && data.globalBlockers) {
        // The global blockers are more picky in what they block than the
        // connection-specific blockers, because there's no guarantee that the
        // page will be able to undo the block.
        globalImageURLwhitelist = deserializeRegExpList(data.globalWhitelist);
        globalImageURLblockers = deserializeRegExpList(data.globalBlockers);
        saveGlobalBlockers(data.globalWhitelist, data.globalBlockers);
      }
    }
  },
  openUrlInExistingTabIfPossible: {
    handler: function (data, connection) {
      var url = new URL(data);

      chrome.tabs.query(
        {
          url: '*://' + url.host + '/*'
        },
        function (tabs) {
          if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {
              active: true,
              url: data
            });
          } else {
            chrome.tabs.create({
              url: data,
              active: true
            });
          }
        }
      );
    }
  },
  default: {
    handler: function () {
      throw new Error('Unknown op');
    }
  }
};

function callBackgroundFunction(functionPath, args) {
  var path = functionPath.split('.');

  var curr = chrome;
  var prevCurr = null;
  for (var ii = 0; ii < path.length; ii++) {
    prevCurr = curr;
    curr = curr[path[ii]];

    if (!curr) {
      throw new Error('Failed to find path');
    }
  }

  curr.apply(prevCurr, args);
}

function setupPort(port) {
  if (port.name && port.name !== 'main') {
    return;
  }

  var connection = {
    port: port,
    imageURLwhitelist: [],
    imageURLblockers: []
  };
  if (connectionsByTabId[port.sender.tab.id]) {
    // eslint-disable-next-line no-console
    console.error('tab already has an open connection!');
  }
  connectionsByTabId[port.sender.tab.id] = connection;

  port.onMessage.addListener(function (request) {
    if (request.op === 'responseToBackgroundPageInitiatedEvent') {
      responseToBackgroundPageInitiatedEvent(
        request.data,
        connection,
        request.exchangeId,
        request.error
      );
      return;
    }

    var responder = Object.prototype.hasOwnProperty.call(portResponders, request.op)
      ? request.op
      : 'default';

    Promise.resolve()
      .then(function () {
        return portResponders[responder].handler(request.data, connection);
      })
      .then(
        function (response) {
          var message = {id: request.id, data: response};
          if (portResponders[responder].legacyResponseName) {
            // Eventually the combined.js code should just find the response by id,
            // instead of relying on this.
            message.op = portResponders[responder].legacyResponseName;
          }
          port.postMessage(message);
        },
        function (error) {
          // eslint-disable-next-line no-console
          console.error('Error in portResponder:', error);
          port.postMessage({
            id: request.id,
            error: true,
            message: error && error.message,
            stack: error && error.stack
          });
        }
      );
  });

  port.onDisconnect.addListener(function () {
    connection = null;
    delete connectionsByTabId[port.sender.tab.id];
  });

  queuedEvents.slice().forEach(event => {
    callIntoContentScript(port.sender.tab.id, event, 'trackEvent').then(response => {
      if (response) {
        // remove event from queuedEvents if the tab accepted the trackEvent message
        var idx = queuedEvents.indexOf(event);
        if (idx >= 0) {
          queuedEvents.splice(idx, 1);
        }
      }
    });
  });
}

function setupOneTimeMessageHandling() {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var responder = Object.prototype.hasOwnProperty.call(portResponders, request.op)
      ? request.op
      : 'default';

    Promise.resolve()
      .then(function () {
        return portResponders[responder].handler(request.data);
      })
      .then(function (response) {
        var message = {id: request.id, data: response};
        sendResponse(message);
      })
      .catch(function (err) {
        // eslint-disable-next-line no-console
        console.error('Error in setupOneTimeMessageHandling', err);
        sendResponse({
          id: request.id,
          error: true,
          message: err && err.message,
          stack: err && err.stack
        });
      });

    if (sendResponse) {
      return true;
    }
  });
}

let queuedEvents = [];
function trackEvent(eventName, extra) {
  // go through open tabs and try to find one to send the event to.
  // otherwise queue it up for a future tab.

  const event = {eventName, extra};

  var tabIds = Object.keys(connectionsByTabId).map(function (id) {
    return parseInt(id);
  });

  function attemptTrackInNextTab() {
    // returns Promise<boolean>
    if (tabIds.length === 0) return Promise.resolve(false);

    var tabId = tabIds.shift();

    return callIntoContentScript(tabId, event, 'trackEvent')
      .catch(function () {
        return null;
      })
      .then(function (response) {
        if (response) {
          return true;
        } else {
          return attemptTrackInNextTab();
        }
      });
  }

  attemptTrackInNextTab().then(success => {
    if (!success) {
      queuedEvents.push(event);
    }
  });
}

function setupOneTimeOnInstallHandling() {
  chrome.runtime.onInstalled.addListener(function () {
    chrome.tabs.query({url: 'https://www.streak.com/*'}, function (tabs) {
      var tab;

      for (var i = 0; i < tabs.length; i++) {
        tab = tabs[i];
        chrome.tabs.executeScript(tab.id, {
          code: `window.dispatchEvent(new CustomEvent('onStreakInstall'))`
        });
      }

      if (tab) {
        chrome.tabs.update(tab.id, {active: true});
      }
    });
  });
}

chrome.extension.onConnect.addListener(setupPort);
loadGlobalBlockers();
setupRequestInterceptor();
setupTabInterceptor();
setupOneTimeMessageHandling();
setupOneTimeOnInstallHandling();
