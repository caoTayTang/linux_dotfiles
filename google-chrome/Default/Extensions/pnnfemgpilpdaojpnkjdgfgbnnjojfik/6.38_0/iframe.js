/**
 * This file is used to embed an iFrame into Gmail to show content on other
 * sites that the user has requested.
 *
 * This is for working around the Chrome/WebKit bug listed here:
 * https://code.google.com/p/chromium/issues/detail?id=408932
 */
'use strict';

var messageId;
var parentOrigin;

var iframe;

window.addEventListener('message', function (event) {
  if (iframe && event.source === iframe.contentWindow) {
    var newData = {
      data: event.data,
      senderId: messageId
    };
    window.parent.postMessage(newData, parentOrigin, event.data.transferableList);
  } else if (
    event.origin.match(/^https:\/\/\w+\.google\.com$/) ||
    event.origin.match(/^https:\/\/dev\.streak\.com(:|$)/)
  ) {
    if (event.data && event.data.id && event.data.eventName === 'init') {
      messageId = event.data.id;
      parentOrigin = event.origin;

      window.parent.postMessage(
        {
          internal: {
            eventName: 'iframeBridgeFeatures',
            features: {
              supportsTransferables: true
            }
          },
          senderId: messageId
        },
        parentOrigin
      );

      setupIFrame(event.data.iframeSrc);
    } else {
      iframe.contentWindow.postMessage(event.data, '*', event.data.transferableList);
    }
  } else {
    throw new Error('Message from unknown source');
  }
});

function setupIFrame(src) {
  iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.setAttribute('style', 'height: 100%; width: 100%; border: 0');
  iframe.addEventListener(
    'load',
    function () {
      window.parent.postMessage(
        {
          internal: {
            eventName: 'iframeLoaded'
          }
        },
        parentOrigin
      );
    },
    false
  );
  document.body.appendChild(iframe);
}
