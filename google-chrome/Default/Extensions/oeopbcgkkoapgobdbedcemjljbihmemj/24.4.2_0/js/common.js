// Copyright Jason Savard
"use strict";

// optional callback
function docReady(fn) {
    return new Promise((resolve, reject) => {
        fn ||= resolve;
        if (document.readyState === "interactive" || document.readyState === "complete") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                fn();
            });
        }
    });
}

const htmlElement = globalThis.document?.documentElement;

function createBR() {
    return document.createElement("br");
}

function emptyNode(target) {
    parseTarget(target, el => {
        while(el.firstChild) el.removeChild(el.firstChild);
    });
}

function emptyAppend(target, ...node) {
    emptyNode(target);
    parseTarget(target, el => {
        el.append(...node);
    });
}

function removeAllNodes(target) {
    parseTarget(target, el => {
        el.remove();
    });
}

function byId(id) {
    return document.getElementById(id);
}

function css(target, styles) {
    parseTarget(target, element => {
        Object.assign(element.style, styles);
    });
}

function selector(selector) {
    return document.querySelector(selector);
}

function selectorAll(targets) {
    if (typeof targets === "string") {
        targets = document.querySelectorAll(targets);
    }

    if (!targets.forEach) {
        targets = [targets];
    }

    return targets;
}

function parseTarget(target, handleElement) {
    if (!target) {
        return [];
    }

    target = selectorAll(target);

    target.forEach(e => {
        handleElement(e);
    });
}

function getDefaultDisplay( elem ) {
    globalThis.defaultDisplayMap ||= {};

	var temp,
		doc = elem.ownerDocument,
		nodeName = elem.nodeName,
        display = globalThis.defaultDisplayMap[ nodeName ];

    if ( display ) {
        return display;
    }

    // hard code some known ones because if polymer code loads only after this then we will always get the default display ie. inline whereas it polymer could set it to inline-display for paper- elements
    if (nodeName == "PAPER-ICON-BUTTON") {
        display = "inline-block";
    } else {
	    temp = doc.body.appendChild( doc.createElement( nodeName ) );
	    display = getComputedStyle(temp).display;
	    temp.parentNode.removeChild( temp );
    }

	if ( display === "none" ) {
		display = "block";
	}

    globalThis.defaultDisplayMap[ nodeName ] = display;

	return display;
}

function isHiddenWithTree(el) {
    return el.style.display === "none" ||
		el.style.display === "" &&
		getComputedStyle(el).display === "none";
}

function show(target) {
    parseTarget(target, element => {
        if (element.hidden) {
            element.hidden = false;
        }

        if (element.style.display == "none") {
            element.style.display = "";
        }
        if (element.style.display === "" && isHiddenWithTree(element)) {
            element.style.display = getDefaultDisplay(element);
        }
    });
}

function hide(target) {
    parseTarget(target, element => {
        element.hidden = true;

        if (getComputedStyle(element).display !== "none") {
            element.style.display = "none";
        }
    });
}

// targets is optional
const getNodeIndex = (el, targets) => {
	if (targets) {
  	    return Array.from(selectorAll(targets)).findIndex(relativeEl => relativeEl === el);
    } else {
  	    return [...el.parentNode.children].indexOf(el);
    }
}

/* SLIDE UP */
var slideUp = (targets, duration=500) => {
    if (duration == "fast") {
        duration = 200;
    } else if (duration == "slow") {
        duration = 600;
    }

    return new Promise((resolve, reject) => {
        parseTarget(targets, target => {
            target.style.transitionProperty = 'height, margin, padding, opacity';
            target.style.transitionDuration = duration + 'ms';

            const prevBoxsizing = target.style.boxSizing;
            target.style.boxSizing = 'border-box';

            target.style.height = target.offsetHeight + 'px';

            target.offsetHeight;

            const prevOverflow = target.style.overflow;
            target.style.overflow = 'hidden';

            target.style.height = 0;

            const previousPT = target.style.paddingTop;
            target.style.paddingTop = 0;

            const previousPB = target.style.paddingBottom;
            target.style.paddingBottom = 0;

            const previousMT = target.style.marginTop
            target.style.marginTop = 0;

            const previousMB = target.style.marginBottom;
            target.style.marginBottom = 0;

            window.setTimeout( () => {
                target.style.display = 'none';
                target.style.removeProperty('height');

                target.style.boxSizing = prevBoxsizing;
                target.style.overflow = prevOverflow;

                target.style.paddingTop = previousPT;
                target.style.paddingBottom = previousPB;
                target.style.marginTop = previousMT;
                target.style.marginBottom = previousMB;

                target.style.removeProperty('transition-duration');
                target.style.removeProperty('transition-property');
            }, duration);
        });

        setTimeout(() => {
            resolve();
        }, duration);
    });
}

/* SLIDE DOWN */
var slideDown = (targets, duration=500) => {
    if (duration == "fast") {
        duration = 200;
    } else if (duration == "slow") {
        duration = 600;
    }

    return new Promise((resolve, reject) => {
        parseTarget(targets, target => {
            const currentHeight = target.clientHeight;
            target.style.removeProperty('display');
            target.hidden = false;
            let display = window.getComputedStyle(target).display;
            if (display === 'none') display = 'block';
            target.style.display = display;

            if (!currentHeight) {

                const prevOverflow = target.style.overflow;
                target.style.overflow = 'hidden';

                target.style.height = "auto"
                let height = target.clientHeight + "px";
                target.style.height = 0;

                //target.style.paddingTop = 0;
                //target.style.paddingBottom = 0;
                //target.style.marginTop = 0;
                //target.style.marginBottom = 0;

                target.offsetHeight;

                const prevBoxsizing = target.style.boxSizing;
                target.style.boxSizing = 'border-box';

                target.style.transitionProperty = "height";
                target.style.transitionDuration = duration + 'ms';
            
                /** Do this after the 0px has applied. */
                /** It's like a delay or something. MAGIC! */
                setTimeout(() => {
                    target.style.height = height
                }, 0) 
            
                //target.style.removeProperty('padding-top');
                //target.style.removeProperty('padding-bottom');
                //target.style.removeProperty('margin-top');
                //target.style.removeProperty('margin-bottom');
                window.setTimeout( () => {
                    target.style.removeProperty('height');

                    target.style.overflow = prevOverflow;
                    target.style.boxSizing = prevBoxsizing;

                    target.style.removeProperty('transition-duration');
                    target.style.removeProperty('transition-property');
                }, duration);
            }
        });

        setTimeout(() => {
            resolve();
        }, duration);
    });
}

var slideToggle = (targets, duration = 500) => {
    if (duration == "fast") {
        duration = 200;
    } else if (duration == "slow") {
        duration = 600;
    }

    return new Promise((resolve, reject) => {
        parseTarget(targets, target => {
            if (window.getComputedStyle(target).display === 'none') {
                return slideDown(target, duration);
            } else {
                return slideUp(target, duration);
            }
        });

        setTimeout(() => {
            resolve();
        }, duration);
    });
}

var fadeIn = (targets, duration=500) => {
    if (duration == "fast") {
        duration = 200;
    } else if (duration == "slow") {
        duration = 600;
    }

    return new Promise((resolve, reject) => {
        parseTarget(targets, target => {
            if (!isVisible(target) || window.getComputedStyle(target).opacity == "0") {
                target.style.opacity = "0";
                show(target);

                target.style.transitionProperty += ",opacity";
                target.style.transitionDuration = duration + 'ms';

                /** Do this after the 0px has applied. */
                /** It's like a delay or something. MAGIC! */
                setTimeout(() => {
                    target.style.opacity = "1";
                }, 0) 
            
                window.setTimeout( () => {
                    target.style.removeProperty('transition-duration');
                    target.style.removeProperty('transition-property');
                }, duration);
            }
        });

        setTimeout(() => {
            resolve();
        }, duration);
    });
}

var fadeOut = (targets, duration=500) => {
    if (duration == "fast") {
        duration = 200;
    } else if (duration == "slow") {
        duration = 600;
    }

    return new Promise((resolve, reject) => {
        parseTarget(targets, target => {
            if (isVisible(target) || window.getComputedStyle(target).opacity == "1") {
                //target.style.transitionProperty = "opacity";
                target.style.transitionDuration = duration + 'ms';

                /** Do this after the 0px has applied. */
                /** It's like a delay or something. MAGIC! */
                setTimeout(() => {
                    target.style.opacity = "0";
                }, 0);

                setTimeout(() => {
                    hide(target);
                }, duration);
            
                window.setTimeout( () => {
                    target.style.removeProperty('transition-duration');
                    target.style.removeProperty('transition-property');
                }, duration);
            }
        });

        setTimeout(() => {
            resolve();
        }, duration);
    });
}

function isVisible(target) {
    if (typeof target === "string") {
        target = document.querySelector(target);
    }

    //return (target.offsetParent !== null) // didn't work for fixed elements like dialog boxes
    return !!( target.offsetWidth || target.offsetHeight || target.getClientRects().length );
}

function importTemplateNode(target, allFlag) {
    let nodes = null;
    parseTarget(target, el => {
        if (nodes) {
            return;
        } else {
            const fragment = document.importNode(el.content, true);
            if (allFlag) {
                nodes = Array.from(fragment.children);
            } else {
                nodes = fragment.firstElementChild;
            }
        }
    })
    return nodes;
}

function addEventListeners(target, type, fn, namespace, listenerOptions) {
    parseTarget(target, el => {
       	let thisListenerOptions = false;
        if (namespace) {
        	const abortControllerFnName = `_myAbortController_${namespace}_${type}`;
        	if (el[abortControllerFnName]) {
          	    console.log("abort")
          	    el[abortControllerFnName].abort();
            }
            el[abortControllerFnName] = new AbortController();
          
            if (listenerOptions === true) {
                thisListenerOptions = {
                	capture: true,
                    signal: el[abortControllerFnName].signal
                }
            } else if (typeof listenerOptions === 'object') {
                thisListenerOptions = Object.assign({}, listenerOptions);
                thisListenerOptions.signal = el[abortControllerFnName].signal;
            } else {
              	thisListenerOptions = {
                	signal: el[abortControllerFnName].signal
                }
            }
        }
        el.addEventListener(type, fn, thisListenerOptions);
    });
};

function replaceEventListeners(target, type, fn, namespace = "default", listenerOptions) {
	addEventListeners(target, type, fn, namespace, listenerOptions);
}

function onClick(target, fn, namespace, listenerOptions = false) {
    addEventListeners(target, "click", fn, namespace, listenerOptions);
}

function onClickReplace(target, fn, namespace = "default", listenerOptions = false) {
    onClick(target, fn, namespace, listenerOptions);
}

function onDelegate(node, type, selector, fn, listenerOptions = false) {
    node.addEventListener(type, function(e) {
        for (var target=e.target; target && target!=this; target=target.parentNode) {
            // loop parent nodes from the target to the delegation node
            if (target.matches(selector)) {
                fn.call(target, e);
                break;
            }
        }
    }, listenerOptions);
}

function toggleAttr(target, attr, value) {
    parseTarget(target, el => {
        if (value === false) {
            el.removeAttribute(attr);
        } else {
            if (el.getAttribute(attr) == undefined || value === true) {
                el.setAttribute(attr, "");
            } else {
                el.removeAttribute(attr);
            }
        }
    });
}

class DetectClientClass {

    constructor() {
        this.platform = "Windows"; // patch had to declaire it here instead of above to pass firefox extension compilation warning
    }

    async init() {
        if (navigator.userAgentData) {
            this.platform = (await navigator.userAgentData.getHighEntropyValues(["platform"])).platform;
        }
    }
  
    findBrand(brandString) {
        return navigator.userAgentData?.brands.some(brands => brands.brand == brandString);
    }
    
    isChrome() {
        return this.findBrand("Google Chrome");
    }

    isChromium() {
        return this.findBrand("Chromium")
             && !this.isFirefox()
             && !this.isSafari()
        ;
    }

    isEdge() {
        return this.findBrand("Microsoft Edge");
    }

    isOpera() {
        return this.findBrand("Opera");
    }

    isFirefox() {
        return /firefox/i.test(navigator.userAgent);
    }

    isSafari() {
        return /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    }

    isWindows() {
        if (navigator.userAgentData) {
            return this.platform == "Windows";
        } else {
            return /windows/i.test(navigator.userAgent);
        }
    }

    isAndroid() {
        if (navigator.userAgentData) {
            return this.platform == "Android";
        } else {
            return /android/i.test(navigator.userAgent);
        }
    }

    isMac() {
        if (navigator.userAgentData) {
            return this.platform == "macOS";
        } else {
            return /mac/i.test(navigator.userAgent);
        }
    }

    is_iPhone() {
        if (navigator.userAgentData) {
            return this.platform == "iOS";
        } else {
            return /iPhone/i.test(navigator.userAgent);
        }
    }

    isLinux() {
        if (navigator.userAgentData) {
            return this.platform == "Linux";
        } else {
            return /linux/i.test(navigator.userAgent);
        }
    }

    isChromeOS() {
        return this.platform == "Chrome OS" || this.platform == "ChromeOS";
    }

    async getChromeChannel() {
        
        if (this.isChrome() || this.isChromeOS()) {
            let platform;

            if (this.isWindows()) {
                platform = "win";
            } else if (this.isMac()) {
                platform = "mac";
            } else if (this.isLinux()) {
                platform = "linux";
            } else if (this.isChromeOS()) {
                platform = "chromeos";
            } else if (this.isAndroid()) {
                platform = "android";
            } else {
                platform = "all";
            }

            const fullVersionList = (await navigator.userAgentData.getHighEntropyValues(["fullVersionList"])).fullVersionList;
            let matchedBrand = fullVersionList.find(list => list.brand == "Google Chrome");
            if (!matchedBrand) {
                matchedBrand = fullVersionList.find(list => list.brand == "Chromium");
                if (!matchedBrand) {
                    matchedBrand = fullVersionList.find(list => !list.brand.match(/brand/i));
                }
            }

            let browserVersion = matchedBrand?.version;
            if (!browserVersion) {
                throw Error("Could not extract browser version", fullVersionList);
            }
            //browserVersion = "99.0.4844.74";

            const data = await fetchJSON(`https://versionhistory.googleapis.com/v1/chrome/platforms/${platform}/channels/all/versions/all/releases?filter=version=${browserVersion}`);
            const release = data.releases[0];
            const channel = release.name.split("/")[4];
            const startTime = new Date(release.serving.startTime);
            if (release.serving.endTime) {
                //console.log("et", new Date(release.serving.endTime));
            }

            const OLD_VERSION_THRESHOLD_IN_DAYS = 90;

            return {
                channel: channel,
                oldVersion: Math.abs(startTime.diffInDays()) > OLD_VERSION_THRESHOLD_IN_DAYS
            };
        } else {
            throw Error("Not Chrome");
        }
    }

    getFirefoxDetails() {
        return fetchJSON("https://jasonsavard.com/getBrowserDetails");
    }
}

const DetectClient = new DetectClientClass();

function getInternalPageProtocol() {
	var protocol;
	if (DetectClient.isFirefox()) {
		protocol = "moz-extension:";
	} else {
		protocol = "chrome-extension:";
	}
	return protocol;
}

function isInternalPage(url) {
	if (arguments.length == 0) {
		url = location.href;
	}
	return url && url.indexOf(getInternalPageProtocol()) == 0;
}

function customShowError(error) {
    if (globalThis.document) {
        docReady(() => {
            show(document.body);
            document.body.style.opacity = "1";

            const div = document.createElement("div");
            div.style.cssText = "background:red;color:white;padding:5px;z-index:999";
            div.textContent = error;

            if (new String(error).includes("UnknownError") || new String(error).includes("Internal error")) {
                div.textContent += " ";

                const a = document.createElement("a");
                a.textContent = "See solution";
                a.href = "https://jasonsavard.com/wiki/Corrupt_browser_profile?ref=unknown-internal-error";
                a.target = "_blank";
                div.appendChild(a);
            }

            document.body.prepend(div);
        });
    } else {
        showCouldNotCompleteActionNotification(error);
    }
}

function displayUncaughtError(errorStr) {
	if (globalThis.polymerPromise2?.then) {
		polymerPromise2.then(() => {
			if (globalThis.showError) {
				document.body.style.opacity = "1";
                // must catch errors here to prevent onerror loop
                const indexedDBError = errorStr.toLowerCase().includes("indexeddb");
                const bucketError = errorStr.toLowerCase().includes("bucket data");

                if (errorStr.name == "DBError" || indexedDBError || bucketError) {
                    showError(errorStr, {
                        text: "See solution",
                        onClick: () => {
                            let url = "https://jasonsavard.com/wiki/Corrupt_browser_profile";
                            if (bucketError) {
                                url += "?error=bucket";
                            }
                            openUrl(url);
                        }
                    }).catch(e => {
                        console.error(e);
                        customShowError(errorStr);
                    });
                } else {
                    showError(errorStr, {
                        text: "Send feedback",
                        onClick: () => {
                            openUrl("https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=send-feedback");
                        }
                    }).catch(e => {
                        console.error(e);
                        customShowError(errorStr);
                    });
                }
			} else {
				customShowError(errorStr);
			}
		}).catch(error => {
			customShowError(errorStr);
		});
	} else {
		customShowError(errorStr);
	}
}

globalThis.onerror = function(msg, url, line) {
	var thisUrl = removeOrigin(url).substring(1); // also remove beginning slash '/'
	var thisLine;
	if (line) {
		thisLine = " (" + line + ") ";
	} else {
		thisLine = " ";
	}
	var action = thisUrl + thisLine + msg;
	
	sendGAError(action);
	
    var errorStr = msg + " (" + thisUrl + " " + line + ")";
    displayUncaughtError(errorStr);
	
	//return false; // false prevents default error handling.
};

globalThis.addEventListener('unhandledrejection', function (event) {
    let error;
    if (event.reason.name == "DBError") {
        error = event.reason; // pass dberror to errorfunction below
    } else if (event.reason.stack) {
        error = event.reason.stack;
    } else {
        error = event.reason;
    }
    console.error("unhandledrejection", error);
    displayUncaughtError(error);
  
    // Prevent the default handling (error in console)
    //event.preventDefault();
});

// usage: [url] (optional, will use location.href by default)
function removeOrigin(url) {
	var linkObject;
	if (arguments.length && url) {
		try {
			linkObject = document.createElement('a');
			linkObject.href = url;
		} catch (e) {
			console.error("jerror: could not create link object: " + e);
		}
	} else {
		linkObject = location;
	}
	
	if (linkObject) {
		return linkObject.pathname + linkObject.search + linkObject.hash;
	} else {
		return url;
	}
}

//anonymized email by using only 3 letters instead to comply with policy
async function getUserIdentifier() {
    try {
        // seems it didn't exist sometimes!
        if (globalThis.getFirstEmail) {
            let str = getFirstEmail(accounts);
            if (str) {
                str = str.split("@")[0].substring(0,3);
            }
            return str;
        }
    } catch (error) {
        console.warn("Could not getUserIdentifier: " + error);
    }
}

async function sendGAError(action) {
	// google analytics

	// commented because event quota was surpassed in analytics
	/*
	var JS_ERRORS_CATEGORY = "JS Errors";
	if (typeof sendGA != "undefined") {
		// only action (no label) so let's use useridentifier
		var userIdentifier = await getUserIdentifier();
		if (arguments.length == 1 && userIdentifier) {
			sendGA(JS_ERRORS_CATEGORY, action, userIdentifier);
		} else {
			// transpose these arguments to sendga (but replace the 1st arg url with category ie. js errors)
			// use slice (instead of sPlice) because i want to clone array
			var argumentsArray = [].slice.call(arguments, 0);
			// transpose these arguments to sendGA
			var sendGAargs = [JS_ERRORS_CATEGORY].concat(argumentsArray);
			sendGA.apply(this, sendGAargs);
		}
	}
	//return false; // false prevents default error handling.
	*/
}

function logError(action) {
	// transpose these arguments to console.error
	// use slice (instead of sPlice) because i want to clone array
	var argumentsArray = [].slice.call(arguments, 0);
	// exception: usually 'this' is passed but instead its 'console' because console and log are host objects. Their behavior is implementation dependent, and to a large degree are not required to implement the semantics of ECMAScript.
	console.error.apply(console, argumentsArray);
	
	sendGAError.apply(this, arguments);
}

var ONE_SECOND = 1000;
var ONE_MINUTE = 60000;
var ONE_HOUR = ONE_MINUTE * 60;
var ONE_DAY = ONE_HOUR * 24;

function seconds(seconds) {
	return seconds * ONE_SECOND;
}

function minutes(mins) {
	return mins * ONE_MINUTE;
}

function hours(hours) {
	return hours * ONE_HOUR;
}

function days(days) {
	return days * ONE_DAY;
}

function shallowClone(obj) {
    return Object.assign({}, obj);
}

function deepClone(obj) {
    if (obj) {
        return JSON.parse(JSON.stringify(obj), dateReviver);
    }
}

async function readMessagesFile(lang, region) {
    var folderName;
    if (region) {
        folderName = lang + "_" + region.toUpperCase();
    } else {
        folderName = lang;
    }

    return fetchJSON(chrome.runtime.getURL("_locales/" + folderName + "/messages.json"));
}

async function _loadLocaleMessagesFile() {
    const localeFormatted = locale.replace("-", "_");
    const lang = localeFormatted.split("_")[0].toLowerCase();
    const region = localeFormatted.split("_")[1];
        
    try {
        globalThis.localeMessages = await readMessagesFile(lang, region);
    } catch (error) {
        // if we had region then try lang only
        if (region) {
            console.log("Couldn't find region: " + region + " so try lang only: " + lang);
            try {
                globalThis.localeMessages = await readMessagesFile(lang);
            } catch (error) {
                // always resolve
                console.warn(error);
            }
        } else {
            console.warn("Lang not found: " + lang);
        }
    }
}

async function loadLocaleMessages() {
    // only load locales from files if they are not using their browser language (because i18n.getMessage uses the browser language) 
    if (chrome.i18n.getUILanguage && (locale == chrome.i18n.getUILanguage() || locale == chrome.i18n.getUILanguage().substring(0, 2))) {
        // for english just use native calls to get i18n messages
        globalThis.localeMessages = null;
    } else {
        //console.log("loading locale: " + locale);
        
        // i haven't created a en-US so let's avoid the error in the console and just push the callback
        if (globalThis.locale != "en-US") {
            await _loadLocaleMessagesFile();
        }
    }
}

function getMessage(messageID, args) {
	if (messageID) {

        if (messageID == "tomorrow") {
            return getTomorrowMessage();
        } else if (messageID == "yesterday") {
            return getYesterdayMessage();
        } else if (messageID == "today") {
            return getTodayMessage();
        }

		if (typeof localeMessages != 'undefined' && localeMessages != null) {
			var messageObj = localeMessages[messageID];	
			if (messageObj) { // found in this language
				var str = messageObj.message;
				
				// patch: replace escaped $$ to just $ (because chrome.i18n.getMessage did it automatically)
				if (str) {
					str = str.replace(/\$\$/g, "$");
				}
				
				if (args != null) {
					if (args instanceof Array) {
						for (var a=0; a<args.length; a++) {
							str = str.replace("$" + (a+1), args[a]);
						}
					} else {
						str = str.replace("$1", args);
					}
				}
				return str;
			} else { // default to default language
				return chromeGetMessage(messageID, args);
			}
		} else {
			return chromeGetMessage(messageID, args);
		}
	}
}

//patch: chrome.i18n.getMessage does pass parameter if it is a numeric - must be converted to str
function chromeGetMessage(messageID, args) {
	if (args != null && !isNaN(args)) {
		args = args + "";
	}
	return chrome.i18n.getMessage(messageID, args);
}

function getUniqueId() {
	return Math.floor(Math.random() * 100000);
}

var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc, forceEnglish) {
		var dF = dateFormat;
		var i18n = forceEnglish ? dF.i18nEnglish : dF.i18n;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date;
		if (isNaN(date)) throw SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  i18n.dayNamesShort[D],
				dddd: i18n.dayNames[D],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  i18n.monthNamesShort[m],
				mmmm: i18n.monthNames[m],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNamesShort: [],
	dayNames: [],
	monthNamesShort: [],
	monthNames: []
};

dateFormat.i18nEnglish = shallowClone(dateFormat.i18n);
dateFormat.i18nCalendarLanguage = shallowClone(dateFormat.i18n);

function initCalendarNames(obj) {
    let date = new DateZeroTime();
    date.setDate(date.getDate() - date.getDay()); // set to Sunday

    while (obj.dayNamesShort.length < 7) {
        obj.dayNamesShort.push(date.toLocaleString(locale, {
            weekday: "short"
        }));

        obj.dayNames.push(date.toLocaleString(locale, {
            weekday: "long"
        }));

        date.setDate(date.getDate() + 1);
    }

    date = new DateZeroTime(new Date().getFullYear(), 0, 1);

    // weird bug with feb repeated when using setDate in for loop, so had to use while loop instead
    while (obj.monthNamesShort.length < 12) {
        obj.monthNamesShort.push(date.toLocaleString(locale, {
            month: "short"
        }));

        obj.monthNames.push(date.toLocaleString(locale, {
            month: "long"
        }));

        date.setMonth(date.getMonth() + 1);
    }
}

Date.prototype.addSeconds = function(seconds, cloneDate) {
	var date;
	if (cloneDate) {
		date = new Date(this);		
	} else {
		date = this;
	}
	date.setSeconds(date.getSeconds() + seconds, date.getMilliseconds());
	return date;
}

Date.prototype.subtractSeconds = function(seconds, cloneDate) {
	return this.addSeconds(-seconds, cloneDate);
}

function getHourCycle() {
    return twentyFourHour ? "h23" : "h12";
}

function getDateFormatOptions() {
    return {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }
}

function getTimeFormatOptions() {
    return {
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: getHourCycle()
    }
}

function getDateAndTimeFormatOptions() {
    return {...getDateFormatOptions(), ...getTimeFormatOptions()};
}

Object.defineProperty(Date.prototype, "toLocaleDateStringJ", {
    value: function () {
        return this.toLocaleDateString(locale, getDateFormatOptions());
    }
});

Object.defineProperty(Date.prototype, "toLocaleTimeStringJ", {
    value: function (removeTrailingZeroes) {
        let str = this.toLocaleTimeString(locale, getTimeFormatOptions());

        str = str.replace(" AM", "am");
        str = str.replace(" PM", "pm");

        if (removeTrailingZeroes && !twentyFourHour) {
			str = str.replace(":00", "");
		}
        return str;
    }
});

Object.defineProperty(Date.prototype, "toLocaleStringJ", {
    value: function () {
        return this.toLocaleString(locale, getDateAndTimeFormatOptions());
    }
});

// For convenience...
Date.prototype.format = function (mask, utc, forceEnglish) {
	return dateFormat(this, mask, utc, forceEnglish);
};

Date.prototype.displayDate = function(params = {}) {
	// date
	let dateStr;
    if (this.isToday()) { // diffInHours() > -12
        dateStr = this.toLocaleTimeStringJ();
	} else {
		if (params.relativeDays && this.isYesterday()) {
			dateStr = getMessage("yesterday");
		} else {
            if (params.long) {
                dateStr = this.toLocaleStringJ();
            } else {
                const params = {
                    month: "short",
                    day: "numeric"
                }
                // display year if from previous years
                if (this.getFullYear() != new Date().getFullYear()) {
                    params.year = "numeric";
                }
                dateStr = this.toLocaleDateString(locale, params);
            }
		}
	}
	return dateStr;
}

Date.parse = function(dateStr) {
	var DATE_TIME_REGEX = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\.\d+(\+|-)(\d\d):(\d\d)$/;
	var DATE_TIME_REGEX_Z = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\.\d+Z$/;
	var DATE_TIME_REGEX_Z2 = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)+Z$/;
	var DATE_MILLI_REGEX = /^(\d\d\d\d)(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)$/;
	var DATE_REGEX = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
	var DATE_NOSPACES_REGEX = /^(\d\d\d\d)(\d\d)(\d\d)$/;

	/* Convert the incoming date into a javascript date
	 * 2006-04-28T09:00:00.000-07:00
	 * 2006-04-28T09:00:00.000Z
	 * 2010-05-25T23:00:00Z (new one from jason)
	 * 2006-04-19
	 */
	var parts = DATE_TIME_REGEX.exec(dateStr);

	// Try out the Z version
	if (!parts) {
		parts = DATE_TIME_REGEX_Z.exec(dateStr);
	}
	if (!parts) {
		parts = DATE_TIME_REGEX_Z2.exec(dateStr);
	}

	if (exists(parts) && parts.length > 0) {
		var d = new Date();
		d.setUTCFullYear(parts[1], parseInt(parts[2], 10) - 1, parts[3]);
		d.setUTCHours(parts[4]);
		d.setUTCMinutes(parts[5]);
		d.setUTCSeconds(parts[6]);
		d.setUTCMilliseconds(0);

		var tzOffsetFeedMin = 0;
		if (parts.length > 7) {
			tzOffsetFeedMin = parseInt(parts[8],10) * 60 + parseInt(parts[9],10);
			if (parts[7] != '-') { // This is supposed to be backwards.
				tzOffsetFeedMin = -tzOffsetFeedMin;
			}
		}
		return new Date(d.getTime() + tzOffsetFeedMin * ONE_MINUTE); 
	}

	parts = DATE_MILLI_REGEX.exec(dateStr);
	if (exists(parts)) {
		var d = new Date();
		d.setFullYear(parts[1], parseInt(parts[2], 10) - 1, parts[3]);
		d.setHours(parts[4]);
		d.setMinutes(parts[5]);
		d.setSeconds(parts[6]);
		d.setMilliseconds(0);
		return d;
	}
	if (!parts) {
		parts = DATE_REGEX.exec(dateStr);
	}
	if (!parts) {
		parts = DATE_NOSPACES_REGEX.exec(dateStr);
	}
	if (exists(parts) && parts.length > 0) {
		return new Date(parts[1], parseInt(parts[2],10) - 1, parts[3]);
	}
	
	// Parse these strings...
	// Wed, Jan 25, 2012 at 1:53 PM
	// 25 janvier 2012 13:53
	// 25 января 2012 г. 13:53
	
	if (!isNaN(dateStr)) {
		return new Date(dateStr);
	}
	return null;
}

function resetTime(date) {
    date.setHours(0, 0, 0, 0);
    return date;
}

class DateZeroTime extends Date {
    constructor(...dateFields) {
        super(...dateFields);
        resetTime(this);
    }
}

function today() {
	return new DateZeroTime();
}

function yesterday() {
	const yest = new DateZeroTime();
	yest.setDate(yest.getDate()-1);
	return yest;
}

function tomorrow() {
	const tom = new DateZeroTime();
	tom.setDate(tom.getDate()+1);
	return tom;
}

function isToday(date) {
    return date.isSameDay(today());
}

function isTomorrow(date) {
    return date.isSameDay(tomorrow());
}

function isYesterday(date) {
    return date.isSameDay(yesterday());
}

function getRelativeDayMessage(dayOffset) {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    let relativeDay = formatter.format(dayOffset, 'day');
    if (locale.includes("en")) {
        relativeDay = relativeDay.capitalize();
    }
    return relativeDay;
}

function getTodayMessage() {
    return getRelativeDayMessage(0);
}

function getYesterdayMessage() {
    return getRelativeDayMessage(-1);
}

function getTomorrowMessage() {
    return getRelativeDayMessage(+1);
}

function normalizeDST(date1, date2) {
    if (date1.getTimezoneOffset() != date2.getTimezoneOffset()) {
        date2 = new Date(date2);
        date2 = date2.addMinutes(date1.getTimezoneOffset() - date2.getTimezoneOffset());
    }
    return date2;
}

Date.prototype.isToday = function () {
	return isToday(this);
};

Date.prototype.isTomorrow = function () {
	return isTomorrow(this);
};

Date.prototype.isYesterday = function () {
	return isYesterday(this);
};

Date.prototype.isSameDay = function (otherDay) {
    otherDay = normalizeDST(this, otherDay);
	return this.getFullYear() == otherDay.getFullYear() && this.getMonth() == otherDay.getMonth() && this.getDate() == otherDay.getDate();
};

Date.prototype.isBefore = function(otherDate) {
	let paramDate;
	if (otherDate) {
		paramDate = new Date(otherDate);
	} else {
		paramDate = new Date();
	}	
    const thisDate = new Date(this);
    paramDate = normalizeDST(thisDate, paramDate);

	return thisDate.getTime() < paramDate.getTime();
};

Date.prototype.isAfter = function(otherDate) {
	return !this.isBefore(otherDate);
};

Date.prototype.diffInMillis = function(otherDate) {
	let d1;
	if (otherDate) {
		d1 = new Date(otherDate);
	} else {
		d1 = new Date();
	}	
	var d2 = new Date(this);
    d1 = normalizeDST(d2, d1);

	return (d2.getTime() - d1.getTime());
};

Date.prototype.diffInSeconds = function(otherDate) {
    return this.diffInMillis(otherDate) / ONE_SECOND;
};

Date.prototype.diffInMinutes = function(otherDate) {
    return this.diffInMillis(otherDate) / ONE_MINUTE;
};

Date.prototype.diffInHours = function(otherDate) {
    return this.diffInMillis(otherDate) / ONE_HOUR;
};

Date.prototype.diffInDays = function(otherDate, forHumans) {
	var d1;
	if (otherDate) {
		d1 = new Date(otherDate);
	} else {
		d1 = new Date();
	}	
	var d2 = new Date(this);
    if (forHumans) {
		resetTime(d1);
		resetTime(d2);
	}

    d1 = normalizeDST(d2, d1);
	return (d2.getTime() - d1.getTime()) / ONE_DAY;
};

Date.prototype.daysInThePast = function() {
	return this.diffInDays() * -1;
};

Date.prototype.addMinutes = function(mins) {
	return new Date(this.getTime() + minutes(mins));
}

Date.prototype.addHours = function(hrs) {
	return new Date(this.getTime() + hours(hrs));
}

Date.prototype.addDays = function(days) {
	var newDate = new Date(this);
	newDate.setDate(newDate.getDate() + parseInt(days));
	return newDate;
}

Date.prototype.subtractDays = function(days) {
	return this.addDays(days * -1);
}

// returns a subset of an object array with unique attributes, ex. [{type:"1"}, {type:"1"}, {type:"2"}}.unique(function(obj) {return obj.type}); // result: [1,2]
Array.prototype.uniqueAttr = function(getValueFunction) {
    var result = {};
    for(var i = 0; i < this.length; ++i) {
        var value = getValueFunction(this[i]);
        result[(typeof value) + ' ' + value] = value;
    }

    var retArray = [];

    for (const key in result) {
        if (result.hasOwnProperty(key)) { 
            retArray.push(result[key]);
        }
    }

    return retArray;
}

Array.prototype.caseInsensitiveSort = function() {
	this.sort(function(a, b) {
	    if (a.toLowerCase() < b.toLowerCase()) return -1;
	    if (a.toLowerCase() > b.toLowerCase()) return 1;
	    return 0;
	})
	return this;
};
Array.prototype.first = function() {
	return this[0];
};
Array.prototype.last = function() {
	return this[this.length-1];
};
Array.prototype.isEmpty = function() {
	return this.length == 0;
};
Array.prototype.swap = function (x,y) {
	var b = this[x];
	this[x] = this[y];
	this[y] = b;
	return this;
}

String.prototype.parseUrl = function() {
	var a = document.createElement('a');
	a.href = this;
	return a;
}

String.prototype.replaceAll = function(find, replace) {
	var findEscaped = escapeRegExp(find);
	return this.replace(new RegExp(findEscaped, 'g'), replace);
}

String.prototype.chunk = function(size) {
	return this.match(new RegExp('.{1,' + size + '}', 'g'));
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.equalsIgnoreCase = function(str) {
	if (this && str) {
		return this.toLowerCase() == str.toLowerCase();
	}
}

String.prototype.hasWord = function(word) {
	return new RegExp("\\b" + word + "\\b", "i").test(this);
}

String.prototype.summarize = function(maxLength, EOM_Message) {
	if (!maxLength) {
		maxLength = 101;
	}
	var summary = this;
	if (summary.length > maxLength) {
		summary = summary.substring(0, maxLength);
		var lastSpaceIndex = summary.lastIndexOf(" ");
		if (lastSpaceIndex != -1) {
			summary = summary.substring(0, lastSpaceIndex);
			summary = summary.trim();
		}
		summary += "...";
	} else {
		if (EOM_Message) {
			summary += EOM_Message;
		}
	}
	
	// patch: do not why: but it seem that unless i append a str to summary, it returns an array of the letters in summary?
	return summary + "";
}

String.prototype.parseTime = function() {
	// examples...
	// italian time (no ampm on 12hour) 6 novembre 2015 12:03
	var d = new Date();
	var pieces;
	if (this.includes(":")) { // "17 September 2015 at 20:56"
		pieces = this.match(/(\d+)([:|\.](\d\d))\s*(a|p)?/i);
	} else { // "2pm"
		pieces = this.match(/(\d+)([:|\.](\d\d))?\s*(a|p)?/i);
	}
	if (pieces && pieces.length >= 5) {
		// patch: had to use parseFloat instead of parseInt (because parseInt would return 0 instead of 9 when parsing "09" ???		
		var hours = parseFloat(pieces[1]);
		var ampm = pieces[4];
		
		// patch for midnight because 12:12am is actually 0 hours not 12 hours for the date object
		if (hours == 12) {
			if (ampm && ampm.toLowerCase().startsWith("a")) {
				hours = 0;
			} else {
				hours = 12;
			}
		} else if (ampm && ampm.toLowerCase().startsWith("p")) {
			hours += 12;
		}
		d.setHours(hours);		
		d.setMinutes( parseFloat(pieces[3]) || 0 );
		d.setSeconds(0, 0);
		return d;
	}
}

String.prototype.startsWith = function (str) {
	return this.indexOf(str) == 0;
};

String.prototype.endsWith = function (str) {
	return this.slice(-str.length) == str;
};

// remove entity codes
String.prototype.htmlToText = function() {
    let html = this
            .replace(/<br\s?\/?>/ig,"\n")
            .replace(/<(?:.|\n)*?>/gm, '')
    ;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
}

String.prototype.htmlEntities = function() {
	return String(this).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

//remove entity codes
String.prototype.getFirstName = function() {
	return this.split(" ")[0];
}

/*
String.prototype.endsWith = function(suffix) {
	var indexOfSearchStr = this.indexOf(suffix, this.length - suffix.length); 
    return indexOfSearchStr != -1 && indexOfSearchStr == this.length - suffix.length;
};
*/

function parseHtml(html) {
	var dom = (new DOMParser()).parseFromString(html, "text/html");
	if (dom.documentElement.nodeName != "parsererror") {
		return dom;
	}
}

function parseDate(dateStr) {
    if (typeof dateStr != "string") {
        return dateStr;
    }

	/*
	// v1: bug patch: it seems that new Date("2011-09-21") return 20th??? but if you use slashes instead ie. 2011/09/21 then it works :)
    // v2: Append the time ie. Date.parse(`${el.getAttribute("data-date")}T00:00:00.000`)
	if (this.length <= 10) {
		return new Date(Date.parse(this.replace("-", "/")));
	} else {
		return new Date(Date.parse(this));
	}
	*/
	var DATE_TIME_REGEX = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(\.\d+)?(\+|-)(\d\d):(\d\d)$/;
	var DATE_TIME_REGEX_Z = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)\.\d+Z$/;
	var DATE_TIME_REGEX_Z2 = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)+Z$/;
	var DATE_MILLI_REGEX = /^(\d\d\d\d)(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)$/;
	var DATE_REGEX = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
	var DATE_NOSPACES_REGEX = /^(\d\d\d\d)(\d\d)(\d\d)$/;

	/* Convert the incoming date into a javascript date
	 * 2012-09-26T11:42:00-04:00
	 * 2006-04-28T09:00:00.000-07:00
	 * 2006-04-28T09:00:00.000Z
	 * 2010-05-25T23:00:00Z (new one from jason)
	 * 2006-04-19
	 */

	  var parts = DATE_TIME_REGEX.exec(dateStr);
	  
	  // Try out the Z version
	  if (!parts) {
	    parts = DATE_TIME_REGEX_Z.exec(dateStr);
	  }
	  if (!parts) {
		parts = DATE_TIME_REGEX_Z2.exec(dateStr);
	  }
	  
	  if (exists(parts) && parts.length > 0) {
	    var d = new Date();
	    d.setUTCFullYear(parts[1], parseInt(parts[2], 10) - 1, parts[3]);
	    d.setUTCHours(parts[4]);
	    d.setUTCMinutes(parts[5]);
	    d.setUTCSeconds(parts[6]);
		d.setUTCMilliseconds(0);

	    var tzOffsetFeedMin = 0;
	    if (parts.length > 8) {
	      tzOffsetFeedMin = parseInt(parts[9],10) * 60 + parseInt(parts[10],10);
	      if (parts[8] != '-') { // This is supposed to be backwards.
	        tzOffsetFeedMin = -tzOffsetFeedMin;
	      }
	    }
	    return new Date(d.getTime() + tzOffsetFeedMin * ONE_MINUTE);
	  }
	  
	  parts = DATE_MILLI_REGEX.exec(dateStr);
	  if (exists(parts)) {
			var d = new Date();
			d.setFullYear(parts[1], parseInt(parts[2], 10) - 1, parts[3]);
		    d.setHours(parts[4]);
		    d.setMinutes(parts[5]);
		    d.setSeconds(parts[6]);
			d.setMilliseconds(0);
			return d;
	  }
	  if (!parts) {
		  parts = DATE_REGEX.exec(dateStr);
	  }
	  if (!parts) {
		  parts = DATE_NOSPACES_REGEX.exec(dateStr);
	  }
	  if (exists(parts) && parts.length > 0) {
	    return new Date(parts[1], parseInt(parts[2],10) - 1, parts[3]);
	  }
	  if (!isNaN(dateStr)) {
		  return new Date(dateStr);
	  }
	  return null;
}

function initAnalytics() {
	if (DetectClient.isChrome()) {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = 'js/analytics.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		docReady(() => {
            onDelegate(document, "click", "a, input, button", function() {
				processNodeForAnalytics(this);
			});
            onDelegate(document, "change", "select", function() {
				processNodeForAnalytics(this);
			});
		});
	}
} 

function determineAnalyticsLabel(node) {
	var id = node.getAttribute("ga");
	if (id == "IGNORE") {
		return;
	}
	if (id) {
		return id;
	}
	id = node.getAttribute("id");
	if (id) {
		return id;
	}
	id = node.getAttribute("msg");
	if (id) {
		return id;
	}
	id = node.getAttribute("msgTitle");
	if (id) {
		return id;
	}
	id = node.getAttribute("href");
	// don't log # so dismiss it
	if (id) {
		if (id == "#") {
			return;
		} else {
			id = id.replace(/javascript\:/, "");
			// only semicolon so remove it and keep finding other ids
			if (id == ";") {
				return "";
			}
		}
	}
	id = node.parentElement?.getAttribute("id");
	if (id) {
		return id;
	}
	id = node.getAttribute("class");
	if (id) {
		return id;
	}
}

function processNodeForAnalytics(node) {
	var label = null;
	var id = determineAnalyticsLabel(node);
	if (id) {
		if (node.getAttribute("type") != "text") {
			if (node.getAttribute("type") == "checkbox") {
				if (node.checked) {
					label = id + "_on";
				} else {
					label = id + "_off";
				}
			} else if (node.tagName == "SELECT") {
				label = node.value;
			}
			var category = node.closest("*[gaCategory]");
			var action = null;
			// if gaCategory specified
			if (category) {
				category = category.getAttribute("gaCategory");
				action = id;
			} else {
				category = id;
				action = "click";
			}
			
			if (label != null) {
				sendGA(category, action, label);
			} else {
				sendGA(category, action);
			}
		}
	}
}

function initSanitizer() {
    // Methods declared for "html-css-sanitizer-minified.js"
    globalThis.allowAllUrls = function(url, mime) { return url; }
    globalThis.rewriteIds = function(id) { return HTML_CSS_SANITIZER_REWRITE_IDS_PREFIX + id; }
    //Loosen restrictions of Caja's html-sanitizer to allow for styling

    if (typeof html4 != "undefined") {
        html4.ATTRIBS['*::style'] = 0;
        html4.ATTRIBS['*::background'] = 0;
        html4.ATTRIBS['a::target'] = 0;
        html4.ATTRIBS['audio::src'] = 0;
        html4.ATTRIBS['video::src'] = 0;
        html4.ATTRIBS['video::poster'] = 0;
        html4.ATTRIBS['video::controls'] = 0;
        //html4.ATTRIBS['video::autoplay'] = 0;
        html4.ELEMENTS['audio'] = 0;
        html4.ELEMENTS['video'] = 0;
    }
}

//usage: sendGA('category', 'action', 'label');
//usage: sendGA('category', 'action', 'label', value);  // value is a number.
//usage: sendGA('category', 'action', {'nonInteraction': 1});
function sendGA(category, action, label, etc) {
	
	// Disables sending any analytics when using Firefox to comply with their policy
	if (DetectClient.isChrome()) {
		console.log("%csendGA: " + category + " " + action + " " + label, "font-size:0.6em");
	
		// patch: seems arguments isn't really an array so let's create one from it
		var argumentsArray = [].splice.call(arguments, 0);
	
		var gaArgs = ['send', 'event'];
		// append other arguments
		gaArgs = gaArgs.concat(argumentsArray);
		
		if (globalThis.ga) {
			ga.apply(this, gaArgs);
		}
	}
	
}

async function initUI() {
    await initMisc();
	initMessages(); // must be before polymer loads to process templates etc.
	initMessagesInTemplates();
}

async function initMisc(params = {}) {
    if (!globalThis.initMiscPromise) {
        console.info("initMisc");
        globalThis.initMiscPromise = new Promise(async (resolve, reject) => {
            
            await DetectClient.init();

            if (!params.skipStorageInit) {
                await storage.init();
            }

            if (!await storage.get("console_messages")) {
                console.log = console.debug = function () {};
            }
            globalThis.locale = await storage.get("language");
            globalThis.twentyFourHour = await storage.get("24hourMode");
            console.time("loadLocaleMessages");
            await loadLocaleMessages();
            console.timeEnd("loadLocaleMessages");
            initCalendarNames(dateFormat.i18n);
            await initOauthAPIs();
            Controller();
    
            ChromeTTS();
            initSanitizer();

            console.time("initAllAccounts");
            await initAllAccounts();
            console.timeEnd("initAllAccounts");

            await initPopup();
            globalThis.buttonIcon = new ButtonIcon();
            await buttonIcon.init();
    
            // MUST USE promise with resolve because I could forget an await on one of these async functions above and could lead to race issue and undefined accounts or buttonIcon ref: https://jasonsavard.com/forum/discussion/comment/24170#Comment_24170
            resolve();
        });
    }
    return globalThis.initMiscPromise;
}

async function initAllAccounts() {
    globalThis.accounts = await retrieveAccounts();
    globalThis.ignoredAccounts = await retrieveAccounts("ignoredAccounts");
}

function openContributeDialog(key, monthly, footerText) {
	const dialogParams = {
        content: new DocumentFragment()
    };
	
	if (monthly) {
		dialogParams.content.append(getMessage("extraFeaturesMonthlyBlurb"));
		dialogParams.otherLabel = getMessage("monthlyContribution");
		dialogParams.otherLabel2 = getMessage("moreInfo");
	} else {
		dialogParams.title = getMessage("extraFeatures");
		dialogParams.content.append(getMessage("extraFeaturesPopup1"), createBR(), getMessage("extraFeaturesPopup2"));
		dialogParams.otherLabel = getMessage("contribute");
	}
	
	if (footerText) {
		dialogParams.content.append(createBR(), createBR(), footerText);
	}
	
	openGenericDialog(dialogParams).then(function(response) {
		if (response == "other") {
			var url = "contribute.html?action=" + key;
			if (monthly) {
				url += "&contributionType=monthly";
			}
			openUrl(url);
		} else if (response == "other2") {
			openUrl("https://jasonsavard.com/wiki/Gmail_API_Quota?ref=contributeDialog");
		}
	});
}

async function setStorage(element, params) {
	var OFF_OR_DEFAULT = DEFAULT_SETTINGS_ALLOWED_OFF.includes(params.key) && (!params.value || DEFAULT_SETTINGS[params.key] == params.value);
	if ((element.closest("[mustDonate]") || params.mustDonate) && !donationClickedFlagForPreventDefaults && !OFF_OR_DEFAULT) {
		params.event.preventDefault();
		openContributeDialog(params.key);
		return Promise.reject(JError.DID_NOT_CONTRIBUTE);
	} else {
        if (params.key == "sounds" && (params.value == "custom" || params.value == "record")) {
            // ignore
            return;
        }

		if (params.account) {
			return params.account.saveSettingForLabel(params.key, params.label, params.value);
		} else {
			return storage.set(params.key, params.value);
		}
	}
}

function initPaperElement($nodes, params = {}) {
    $nodes = selectorAll($nodes);
	$nodes.forEach(async element => {
		const key = element.getAttribute("indexdb-storage");
		var permissions;
		if (DetectClient.isChromium()) {
			permissions = element.getAttribute("permissions");
		}
		
		if (key && key != "language") { // ignore lang because we use a specific logic inside the options.js
            const value = await storage.get(key);
            if (element.nodeName.equalsIgnoreCase("paper-checkbox")) {
                element.checked = toBool(value);
			} else if (element.nodeName.equalsIgnoreCase("paper-listbox")) {
				element.setAttribute("selected", value ?? "");
			} else if (element.nodeName.equalsIgnoreCase("paper-radio-group")) {
				element.setAttribute("selected", value ?? "");
			} else if (element.nodeName.equalsIgnoreCase("paper-slider")) {
				element.setAttribute("value", value);
			} else if (element.nodeName.equalsIgnoreCase("paper-input")) {
				if (value != null) {
					element.setAttribute("value", value);
				}
			}
		} else if (permissions) {
			chrome.permissions.contains({permissions: [permissions]}, function(result) {
				element.checked = result;
			});
		}

		// need a 1ms pause or else setting the default above would trigger the change below?? - so make sure it is forgotten
        sleep(500);    
        
        var eventName;
        if (element.nodeName.equalsIgnoreCase("paper-checkbox")) {
            eventName = "change";
        } else if (element.nodeName.equalsIgnoreCase("paper-listbox")) {
            eventName = "iron-activate";
        } else if (element.nodeName.equalsIgnoreCase("paper-radio-group")) {
            eventName = "paper-radio-group-changed";
        } else if (element.nodeName.equalsIgnoreCase("paper-slider")) {
            eventName = "change";
        } else if (element.nodeName.equalsIgnoreCase("paper-input")) {
            eventName = "change";
        }

        element.addEventListener(eventName, function(event) {
            if (key || params.key) {
                
                var value;
                if (element.nodeName.equalsIgnoreCase("paper-checkbox")) {
                    value = element.checked;
                } else if (element.nodeName.equalsIgnoreCase("paper-listbox")) {
                    value = event.detail.selected;
                } else if (element.nodeName.equalsIgnoreCase("paper-radio-group")) {
                    value = element.selected;
                } else if (element.nodeName.equalsIgnoreCase("paper-slider")) {
                    value = element.getAttribute("value");
                } else if (element.nodeName.equalsIgnoreCase("paper-input")) {
                    value = element.value;
                }

                let storagePromise;
                
                if (key) {
                    storagePromise = setStorage(element, {event:event, key:key, value:value});
                } else if (params.key) {
                    params.event = event;
                    params.value = value;
                    storagePromise = setStorage(element, params);
                }
                
                storagePromise.catch(error => {
                    console.error("could not save setting: " + error);
                    if (element.nodeName.equalsIgnoreCase("paper-checkbox")) {
                        element.checked = !element.checked;
                    } else if (element.nodeName.equalsIgnoreCase("paper-listbox")) {
                        element.closest("paper-dropdown-menu").close();
                    }
                    
                    if (error != JError.DID_NOT_CONTRIBUTE) {
                        showError(error);
                    }
                });
            } else if (permissions) {
                if (element.checked) {
                    chrome.permissions.request({permissions: [permissions]}, function(granted) {
                        if (granted) {
                            element.checked = granted;
                        } else {
                            element.checked = false;
                            niceAlert("Might not be supported by this OS");
                        }
                    });
                } else {			
                    chrome.permissions.remove({permissions: [permissions]}, function(removed) {
                        if (removed) {
                            element.checked = false;
                        } else {
                            // The permissions have not been removed (e.g., you tried to remove required permissions).
                            element.checked = true;
                            niceAlert("These permissions could not be removed, they might be required!");
                        }
                    });
                }
            }
        });
	});
}

async function initMessagesInTemplates(templates) {
    if (templates) {
        for (const template of templates) {
            const node = template.content.firstElementChild;
            if (node) {
                initMessages(node, true);
                initMessages(node.querySelectorAll("*"), true);
                const innerTemplates = template.content.querySelectorAll("template");
                initMessagesInTemplates(innerTemplates);
            }
        }
    } else {
        templates = document.querySelectorAll("template");
        if (templates.length) {
            initMessagesInTemplates(templates);
        }
    }
}

function _changeMessages(selectorOrNode) {
	if (location.href.includes("options.html") || location.href.includes("popup.html")) {
        htmlElement.dir = getMessage("dir");
	}

	// used to target certain divs in a page for direction:rtl etc.
    htmlElement.classList.add(getMessage("dir"));

	var selector;
	if (selectorOrNode) {
		selector = selectorOrNode;
	} else {
		selector = "*";
	}

	selectorAll(selector).forEach(el => {
		let attr = el.getAttribute("msg");
		if (attr) {
            const msgArg1 = el.getAttribute("msgArg1");
			if (msgArg1) {
                el.textContent = getMessage( attr, msgArg1 )
                const msgArg2 = el.getAttribute("msgArg2");
				if (msgArg2) {
                    el.textContent = getMessage(attr, [msgArg1, msgArg2]);
				}
			} else {
                // look for inner msg nodes to replace before...
                const innerMsg = el.querySelectorAll("*[msg]");
				if (innerMsg.length) {
					_changeMessages(innerMsg);
                    const msgArgs = Array.from(innerMsg).map(msg => msg.outerHTML);
                    el.innerHTML = getMessage(attr, msgArgs);
				} else {
					if (el.nodeName == "PAPER-TOOLTIP") {
						const $innerNode = el.querySelector(".paper-tooltip");
						if ($innerNode) {
                            $innerNode.textContent = getMessage(attr);
						} else {
                            el.textContent = getMessage(attr);
						}
					} else {
                        el.textContent = getMessage(attr);
					}
				}
			}
		}

        function processAttribute(sourceAttr, sourceAttrArg1, destAttr) {
            const attr = el.getAttribute(sourceAttr);
            if (attr) {
                const msgArg1 = sourceAttrArg1 &&= el.getAttribute(sourceAttrArg1);
                if (msgArg1) {
                    el.setAttribute(destAttr, getMessage(attr, msgArg1));
                } else {
                    el.setAttribute(destAttr, getMessage(attr));
                }
            }
        }

        processAttribute("msgTitle", "msgTitleArg1", "title");
        processAttribute("msgLabel", "msgLabelArg1", "label");
        processAttribute("msgText", "msgTextArg1", "text");
        processAttribute("msgValue", "msgValueArg1", "value");
        processAttribute("msgPlaceholder", "msgPlaceholderArg1", "placeholder");

        attr = el.getAttribute("msgSrc");
		if (attr) {
			el.src = getMessage(attr);
		}

		attr = el.getAttribute("msgHALIGN");
		if (attr) {
			if (htmlElement.dir == "rtl" && attr == "right") {
				el.setAttribute("horizontal-align", "left");
			} else {
				el.setAttribute("horizontal-align", attr);
			}
		}
		attr = el.getAttribute("msgPosition");
		if (attr) {
			if (htmlElement.dir == "rtl" && attr == "left") {
				el.setAttribute("position", "right");
			} else if (htmlElement.dir == "rtl" && attr == "right") {
				el.setAttribute("position", "left");
			} else {
				el.setAttribute("position", attr);
			}
		}
	});

	function addWarning(attrName) {
        const WARNING_MESSAGE = "Not supported by this browser!";
		const $nodes = selectorAll(`[${attrName}]`);

        $nodes.forEach(el => {
            if (!el._warningAdded) {
                el._warningAdded = true;
                el.querySelector("paper-tooltip")?.remove();
    
                el.setAttribute("disabled", "");
                el.style.opacity = "0.5";
                
                const paperTooltip = document.createElement("paper-tooltip");
                paperTooltip.textContent = WARNING_MESSAGE;
                el.append(paperTooltip);
                onClick(el, function (e) {
                    openGenericDialog({ content: WARNING_MESSAGE });
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        });
	}

	if (!DetectClient.isChromium()) {
		addWarning("chromium-only");
    }

    if (DetectClient.isFirefox()) {
        addWarning("not-firefox");
        removeAllNodes("[hide-from-firefox]")
    }

    if (DetectClient.isOpera()) {
        addWarning("not-opera");
        removeAllNodes("[hide-from-opera]");
    }

    if (DetectClient.isEdge()) {
        addWarning("hide-from-edge");
        removeAllNodes("[hide-from-edge]");
    }
    
    if (!DetectClient.isWindows()) {
        removeAllNodes("[windows-only]");
    }
}

async function initMessages(selectorOrNode, beforePolymer) { // beforePolymer useful for replacing msgs inside templates before polymer
	// patch for mac small popup issue: needed a delay or wait for polymer to load before replacing html?
	// v2 introduced macPopupException
	// v1 only used beforePolymer
    const macPopupException = DetectClient.isMac() && globalThis.fromToolbar;
    if (globalThis.polymerPromise && (!beforePolymer || macPopupException)) {
        await polymerPromise;
        if (DetectClient.isMac()) {
            await sleep(150);
        }
    }

    _changeMessages(selectorOrNode);
}

async function donationClicked(action, monthly) {
	if (await storage.get("donationClicked")) {
		return true;
	} else {
		openContributeDialog(action, monthly);
		return false;
	}
}

function getChromeWindows() {
	return new Promise((resolve, reject) => {
		chrome.windows.getAll(windows => {
			// keep only normal windows and not app windows like debugger etc.
			var normalWindows = windows.filter(thisWindow => {
				return thisWindow.type == "normal";
			});
			resolve(normalWindows);
		});
	});
}

function findTab(url) {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({url:url + "*"}, tabs => {
			if (chrome.runtime.lastError){
	            console.error(chrome.runtime.lastError.message);
	            resolve();
			} else {
				if (tabs.length) {
					var tab = tabs.last();
					console.log("force window found")
					chrome.tabs.update(tab.id, {active:true}, () => {
						if (chrome.runtime.lastError) {
							resolve();
						} else {
							// must do this LAST when called from the popup window because if set focus to a window the popup loses focus and disappears and code execution stops
							chrome.windows.update(tab.windowId, {focused:true}, () => {
								resolve({found:true, tab:tab});
							});
						}
					});
				} else {
					resolve();
				}
			}
		});
	});
}

//usage: openUrl(url, {urlToFind:""})
function openUrl(url, params = {}) {
	return new Promise((resolve, reject) => {
		if (globalThis.inWidget) {
			top.location.href = url;
		} else {
			getChromeWindows().then(normalWindows => {
				if (normalWindows.length == 0) { // Chrome running in background
					var createWindowParams = {url:url};
					if (DetectClient.isChromium()) {
						createWindowParams.focused = true;
					}
					chrome.windows.create(createWindowParams, createdWindow => {
						findTab(url).then(response => {
							resolve(response);
						});
					});
				} else {
					new Promise((resolve, reject) => {
						if (params.urlToFind) {
							findTab(params.urlToFind).then(response => {
								resolve(response);
							});
						} else {
							resolve();
						}
					}).then(response => {
						if (response && response.found) {
							//chrome.tabs.update(response.tab.id, {url:url});
							return Promise.resolve(response);
						} else {
							return createTabAndFocusWindow(url);
						}
					}).then(response => {
						if (location.href.includes("source=toolbar") && DetectClient.isFirefox() && params.autoClose !== false) {
							globalThis.close();
						}
						resolve();
					});
				}
			});
		}
	});
}

function createTabAndFocusWindow(url) {
	return new Promise((resolve, reject) => {
		new Promise((resolve, reject) => {
			if (DetectClient.isFirefox()) { // required for Firefox because when inside a popup the tabs.create would open a tab/url inside the popup but we want it to open inside main browser window 
				chrome.windows.getCurrent(thisWindow => {
					if (thisWindow && thisWindow.type == "popup") {
						chrome.windows.getAll({windowTypes:["normal"]}, windows => {
							if (windows.length) {
								resolve(windows[0].id)
							} else {
								resolve();
							}
						});
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}		
		}).then(windowId => {
			var createParams = {url:url};
			if (windowId != undefined) {
				createParams.windowId = windowId;
			}
			chrome.tabs.create(createParams, tab => {
				chrome.windows.update(tab.windowId, {focused:true}, () => {
					resolve(tab);
				});						
			});
		});
	});
}

function removeNode(id) {
	var o = document.getElementById(id);
	if (o) {
		o.parentNode.removeChild(o);
	}
}

function addCSS(id, css) {
	removeNode(id);
	const s = document.createElement('style');
	s.id = id;
	s.setAttribute('type', 'text/css');
	s.appendChild(document.createTextNode(css));
	(document.getElementsByTagName('head')[0] || document.documentElement).appendChild(s);
	return s;
}

function pad(str, times, character) { 
	var s = str.toString();
	var pd = '';
	var ch = character ? character : ' ';
	if (times > s.length) { 
		for (var i=0; i < (times-s.length); i++) { 
			pd += ch; 
		}
	}
	return pd + str.toString();
}

function toBool(str) {
	if ("false" === str || str == undefined) {
		return false;
	} else if ("true" === str) {
		return true;
	} else {
		return str;
	}
}

// name case sensitive
// url (optional defaults to location.href)
function getUrlValue(name, url) {
    url ||= globalThis.location?.href;

    const urlObj = new URL(url, "https://jasondefault.com");
    return urlObj.searchParams.get(name);
}

function setUrlParam(url, name, value) {
    const DEFAULT_DOMAIN = "https://jasondefault.com";

    let urlObj;
    let origin;

    if (!url.includes("://")) {
        let domain = DEFAULT_DOMAIN;
        if (!url.startsWith("/")) {
            domain += "/";
        }

        urlObj = new URL(domain + url);
        origin = "";
    } else {
        urlObj = new URL(url, DEFAULT_DOMAIN);
        origin = urlObj.origin;
    }

    const searchParams = urlObj.searchParams;
    if (value == null || value == "") {
        searchParams.delete(name);
    } else {
        searchParams.set(name, value);
    }

    url = `${origin}${urlObj.pathname}?${searchParams}`;
    if (urlObj.hash) {
        url += urlObj.hash;
    }

    return url;
}

function getCookie(c_name) {
	if (document.cookie.length>0) {
	  c_start=document.cookie.indexOf(c_name + "=");
	  if (c_start!=-1) {
	    c_start=c_start + c_name.length+1;
	    c_end=document.cookie.indexOf(";",c_start);
	    if (c_end==-1) c_end=document.cookie.length;
	    return decodeURIComponent(document.cookie.substring(c_start,c_end));
	    }
	  }
	return "";
}

function exists(o) {
	if (o) {
		return true;
	} else {
		return false;	
	}	
}

function getExtensionIDFromURL(url) {
	//"chrome-extension://dlkpjianaefoochoggnjdmapfddblocd/options.html"
	return url.split("/")[2]; 
}

function isSameUrl(url1, url2) {
	return removeProtocol(url1) == removeProtocol(url2);
}

function removeProtocol(url) {
	if (url) {
		return url.replace(/https?:\/\//g, "");
	} else {
		return url;
	}
}

function findTag(str, name) {
	if (str) {
		var index = str.indexOf("<" + name + " ");
		if (index == -1) {
			index = str.indexOf("<" + name + ">");
		}
		if (index == -1) {
			return null;
		}
		var closingTag = "</" + name + ">";
		var index2 = str.indexOf(closingTag);
		return str.substring(index, index2 + closingTag.length);
	}
}

function trimLineBreaks(str) {
	if (str) {
		str = str.replace(/^\n*/g, "");
		str = str.replace(/\n*$/g, "");
	}
	return str;
}

function cleanEmailSubject(subject) {
	if (subject) {
		subject = subject.replace(/^re: ?/i, "");
		subject = subject.replace(/^fwd: ?/i, "");
	}
	return subject;	
}

function extractEmails(text) {
	if (text) {
		return text.match(/([a-zA-Z0-9.!#$%^_+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
	}
}

function obscureEmails(str) {
    let matches = extractEmails(str);
    if (matches) {
        matches.forEach (email => {
            str = str.replace(email, email.split("@")[0].substring(0,3) + "...@cutoff.com");
        });
    }
    return str;
}

function getHost(url) {
	if (url) {
		var matches = url.match(/:\/\/([^\/?#]*)/);
		if (matches && matches.length >=2) {
			return matches[1];
		}
	}
}

function ellipsis(str, cutoffLength) {	
	if (cutoffLength && str && str.length > cutoffLength) {
		str = str.substring(0, cutoffLength) + " ...";
	}
	return str;
}

function getActiveTab() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError.message);
			} else {
				if (tabs?.length) {
					resolve(tabs[0]);
				} else {
					resolve();
				}
			}
		});
	});
}

function beautify(string) {
    return string.replace(/([+.,])$/, '').replace(/^([+.,])/, '');
}

/*
 * -----------------------------------------------------------------------------
 *  Function for filtering text from "bad" characters and preppare text
 *  for Google Text to Speech API
 * -----------------------------------------------------------------------------
*/	
function filterTextForGoogleSpeech(text) {
	var j = 0,
	str = [],
	tmpstr =[],
	maxlength = 90, // Max length of one sentence this is Google's fault :)
	badchars = ["+","#","@","-","<",">","\n","!","?",":","&",'"',"  ","。"],
	replaces = [" plus "," sharp "," at ","","","","",".",".","."," and "," "," ","."];

	for(var i in badchars) // replacing bad chars
	{
		text = text.split(badchars[i]).join(replaces[i]);		
	}

	str = text.split(/([.,!?:])/i); // this is where magic happens :) :)

	for(var i in str) //join and group sentences
	{
		if(tmpstr[j] === undefined)
		{
			tmpstr[j] = '';
		}

		if((tmpstr[j]+str[i]).length < maxlength)
		{
			tmpstr[j] = tmpstr[j]+str[i].split(' ').join('+');
		}
		else
		{
			tmpstr[j] = beautify(tmpstr[j]);

			if(str[i].length < maxlength)
			{
				j++;
				tmpstr[j]=beautify(str[i].split(' ').join('+'));
			}
			else
			{
				const sstr = split(str[i],maxlength);
				for(const x in sstr)
				{
					j++;
					tmpstr[j] = beautify(sstr[x]);
				}
			}
		}
	}
	return tmpstr.filter(String);
}

function isDomainEmail(email) {
	if (email) {
		email = email.toLowerCase();
		var POPULAR_DOMAINS = ["zoho", "aim", "videotron", "icould", "inbox", "yandex", "rambler", "ya", "sbcglobal", "msn", "me", "facebook", "twitter", "linkedin", "email", "comcast", "gmx", "aol", "live", "google", "outlook", "yahoo", "gmail", "mail", "comcast", "googlemail", "hotmail"];
		
		var foundPopularDomainFlag = POPULAR_DOMAINS.some(function(popularDomain) {
			if (email.includes("@" + popularDomain + ".")) {
				return true;
			}
		});
		
		return !foundPopularDomainFlag;
	}
}

function ChromeTTS() {
	
	var chromeTTSMessages = [];
	var speaking = false;
	
	ChromeTTS.queue = function(msg, params = {}) {
		// this might have fixed the endless loop
		if (msg != null && msg != "") {
			params.utterance = msg;
			chromeTTSMessages.push(params);
			return play();
		} else {
			return Promise.resolve();
		}
	};

	ChromeTTS.stop = function() {
		if (chrome.tts) {
			chrome.tts.stop();
		}
		chromeTTSMessages = [];
		speaking = false;
	};

	ChromeTTS.isSpeaking = function() {
		return speaking;
	}
	
	function setVoiceByLang(chromeTTSMessage, lang, voices) {
		var voiceFound = voices.find(voice => {
			return voice.lang && voice.lang.match(lang);
		});
		
		if (voiceFound) {
			chromeTTSMessage.voiceName = voiceFound.voiceName;
			chromeTTSMessage.extensionId = voiceFound.extensionId;
		}
	}

	function play() {
		return new Promise(async (resolve, reject) => {

            // must declare these here because chrome.tts.* had issues with async callbacks and trying to queue several phrases
            const voiceParams = await storage.get("notificationVoice");
            const volume = await storage.get("voiceSoundVolume") / 100;
            const pitch = parseFloat(await storage.get("pitch"));
            const rate = parseFloat(await storage.get("rate"));

			if (chromeTTSMessages.length) {
				chrome.tts.isSpeaking(speakingParam => {
					console.log(speaking + " : " + speakingParam);
					if (!speaking && !speakingParam) {
						
						var chromeTTSMessage = chromeTTSMessages[0];

						if (chromeTTSMessage.utterance) {
							// decoded etity codes ie. &#39; is ' (apostrohpe)
							chromeTTSMessage.utterance = chromeTTSMessage.utterance.htmlToText();
						} else {
							chromeTTSMessage.utterance = "";
						}

						// replace links with just domain ie. http://www.google.com/longpath/blah.html  >  google.com
						chromeTTSMessage.utterance = Autolinker.link( chromeTTSMessage.utterance, {
							stripPrefix : true,
						});
						
						chromeTTSMessage.voiceName = voiceParams.split("___")[0];
						chromeTTSMessage.extensionId = voiceParams.split("___")[1];

						console.log("speak: " + chromeTTSMessage.utterance);
						speaking = true;
						chrome.tts.stop();
						
						chrome.i18n.detectLanguage(chromeTTSMessage.utterance, result => {
							chrome.tts.getVoices(voices => {
								var voiceUserChose = voices.find(voice => {
									return voice.voiceName == chromeTTSMessage.voiceName && voice.extensionId == chromeTTSMessage.extensionId;
								});
								
								if (!voiceUserChose || !voiceUserChose.lang) {
									// user chose voice with a lang (ie. native) don't use auto-detect because it does not have a fallback lang attribute
								} else if (chromeTTSMessage.forceLang) {
									if (voiceUserChose && voiceUserChose.lang && voiceUserChose.lang.match(chromeTTSMessage.forceLang)) {
										// since forced lang is same a user chosen lang then do nothing and use the user default
									} else {
										setVoiceByLang(chromeTTSMessage, chromeTTSMessage.forceLang, voices);
									}
								} else if (result.isReliable) {
									var detectedLang = result.languages.first().language;
									console.log("detectedLang: " + detectedLang);
									if (voiceUserChose && voiceUserChose.lang && voiceUserChose.lang.match(detectedLang)) {
										// do nothing
									} else {
										setVoiceByLang(chromeTTSMessage, detectedLang, voices);
									}
								} else if (chromeTTSMessage.defaultLang) {
									setVoiceByLang(chromeTTSMessage, chromeTTSMessage.defaultLang, voices);
								}
								
								// check the time between when we executed the speak command and the time between the actual "start" event happened (if it doesn't happen then let's break cause we could be stuck)
								var speakNotStartedTimer = setTimeout(function() {
									console.log("start event never happened: so stop voice");
									// stop will invoke the "interuppted" event below and it will process end/next speak events
									chrome.tts.stop();
								}, seconds(5));
							
								chrome.tts.speak(chromeTTSMessage.utterance, {
									voiceName: chromeTTSMessage.voiceName,
									extensionId : chromeTTSMessage.extensionId,
									//enqueue : true,
									volume: volume,
									pitch: pitch,
									rate: rate,
									onEvent: function(event) {
										console.log('event: ' + event.type);			
										if (event.type == "start") {
											clearTimeout(speakNotStartedTimer);
										} else if (event.type == "interrupted" || event.type == 'error' || event.type == 'end' || event.type == 'cancelled') {
											clearTimeout(speakNotStartedTimer);
											chromeTTSMessages.shift();
											speaking = false;

											// delay between plays
											setTimeout(function() {
												play().then(() => {
													resolve();
												}).catch(error => {
													reject(error);
												});
											}, chromeTTSMessage.noPause ? 1 : 150);
										}
									}
								}, function() {
									if (chrome.runtime.lastError) {
								        logError('speech error: ' + chrome.runtime.lastError.message);
									}
								});
							});
						});
					} else {
						console.log("already speaking, wait before retrying...");
						setTimeout(function() {
							play().then(() => {
								resolve();
							}).catch(error => {
								reject(error);
							});
						}, seconds(1));
					}
				});
			} else {
				resolve();
			}
		});
	}
}

async function fetchWrapper(url, options) {
    try {
        return await fetch(url, options);
    } catch (error) {
        console.error("fetch error: " + error);
        if (await isOnline()) {
            let customError;
            if (url?.includes("mail.google.com") && !await hasGmailHostPermission()) {
                // note: could also be mistakenly caught when internet is not working net::ERR_NAME_NOT_RESOLVED
                customError = Error("Must grant host permission"); // don't insert the word "error" because i filter for it when displaying error in popup
                customError.jError = JError.HOST_PERMISSION;
            } else {
                customError = Error(getMessage("networkProblem"));
                customError.jError = JError.NETWORK_ERROR;
            }
            customError.originalError = error;
            throw customError;
        } else {
            throw getMessage("yourOffline");
        }
    }
}

async function fetchText(url, searchStreamFunction) {
    const response = await fetchWrapper(url);
    if (response.ok) {
        if (searchStreamFunction) {
            const reader = response.body.getReader();
            const utf8decoder = new TextDecoder();
            let data = "";
            let searchResult;

            //console.log("start")
            return reader.read().then(function processText({ done, value }) {
                if (done) {
                    //console.log("Stream complete");
                    return;
                } else {
                    //console.log("Stream read");
                }
            
                data += utf8decoder.decode(value, {stream: true});

                searchResult = searchStreamFunction(data);
                //console.log("search result: ", searchResult);
                if (searchResult) {
                    //console.log("found");
                    reader.cancel("searchFound");
                    return;
                } else {
                    return reader.read().then(processText);
                }
            }).then(() => {
                //console.log("end: ", searchResult);
                return searchResult;
            });
        } else {
            return response.text();
        }
    } else {
        const error = Error(response.statusText);
        error.status = response.status;
        throw error;
    }
}

async function fetchJSON(url, data, options = {}) {
    if (options.method) {
        options.method = options.method.toUpperCase();
    }

    if (data) {
        // default is get
        if (!options.method || /GET/i.test(options.method)) {
            if (!url.searchParams) {
                url = new URL(url);
            }

            // formdata should not be passed as GET (actually fails) but if we let's convert it to url parameters
            if (data instanceof FormData) {
                for (const pair of data.entries()) {
                    url.searchParams.append(pair[0], pair[1]);
                }
            } else {            
                Object.keys(data).forEach(key => {
                    if (Array.isArray(data[key])) {
                        data[key].forEach(value => {
                            url.searchParams.append(key + "[]", value);
                        });
                    } else {
                        url.searchParams.append(key, data[key]);
                    }
                });
            }
        } else { // must be post, patch, delete etc..
            if (!options.headers) {
                options.headers = {};
            }

            const contentType = options.headers["content-type"] || options.headers["Content-Type"];
            if (contentType && contentType.includes("application/json")) {
                options.body = JSON.stringify(data);
            } else if (contentType && contentType.includes("multipart/mixed")) {
                options.body = data;
            } else if (data instanceof FormData) {
                options.body = data;
            } else {
                var formData = new FormData();
                Object.keys(data).forEach(key => formData.append(key, data[key]));
                options.body = formData;
            }
        }
    }
    
    //console.log("fetchJSON", url, options);
    const response = await fetchWrapper(url, options);
    //console.log("response", response);

    let responseData = await response.text();
    if (responseData) {
        try {
            responseData = JSON.parse(responseData);
        } catch (error) {
            console.warn("Response probaby text only: " + error);
        }
    }
    if (response.ok) {
        return responseData;
    } else {
        if (responseData) {
            if (typeof responseData.code === "undefined") { // code property alread exists so let's use fetchReturnCode
                responseData.code = response.status;
            } else {
                responseData.fetchReturnCode = response.status;
            }
            throw responseData;
        } else {
            throw response.statusText;
        }
    }
}

function LineReader(str) {
	var SEP = "\r\n";
	this.currentIndex = 0;
	
	this.readLine = function() {
        // detect if at the end of string
        if (this.currentIndex == str.length) {
            return null;
        } else {
            var sepIndex = str.indexOf(SEP, this.currentIndex);
            if (sepIndex == -1) {
                // return the rest of the string
                var line = str.substring(this.currentIndex);
                this.currentIndex = str.length;
                return line;
            } else {
                var line = str.substring(this.currentIndex, sepIndex);
                this.currentIndex = sepIndex + SEP.length;
                return line;
            }
        }
	}
}

function parseBodyParts(body) {
	var httpResponses = [];
    
    /*
	var contentType = jqXHR.getResponseHeader("content-type"); // multipart/mixed; boundary=batch_Al0uYHFsObA=_AAFnntVKyPs=
	//console.log("contentType", contentType);
	var boundary = contentType.match(/.*\n?.*boundary=\"?([^\r\n\"']*)/i);
	if (boundary) {
		boundary = boundary[1];
    }
    */
    // fist lines in response contains the boundary ie. --batch_TYfz_-hvxys_ABTBc14rZZI
    const boundary = body.match(/\-\-(.*)\r/i)[1].trim();
	
	//console.log("boundary: " + boundary);

	const bodyParts = body.split("--" + boundary);
	for (const bodyPart of bodyParts) {
		if (bodyPart.length >= 10) { // because -- means end of body
			/* example:
			Content-Type: application/http
			
			HTTP/1.1 200 OK
			ETag: "gbmbZs68sGGWei7engZdferRE3M/kD5-Hkz3T496rt9xks8mnnwGENY"
			Content-Type: application/json; charset=UTF-8
			Date: Sun, 20 Jul 2014 15:56:25 GMT
			Expires: Sun, 20 Jul 2014 15:56:25 GMT
			Cache-Control: private, max-age=0
			Content-Length: 1186337
			
			bodyblahblah...
		 */

			var httpResponse = {};
			
			var emptyLines = 0;
			var lr = new LineReader(bodyPart);
            let line;
			while ((line = lr.readLine()) != null) {
				//console.log("line: " + "|" + line + "|");
				if (line == "") {
					emptyLines++;
					//console.log("empty line: " + emptyLines);
					if (emptyLines == 3) {
						//console.log("process body");
						httpResponse.body = bodyPart.substring(lr.currentIndex);
						break;
					}
				} else {
					if (line.includes("HTTP")) {
						httpResponse.status = line;
						if (line.hasWord("200")) {
							httpResponse.statusText = "success";
						} else {
							httpResponse.statusText = line;
						}
					} else {
						// process other headers here...
						
					}
				}
			}
			
			/*
			// get first bunch of characters to parse
			var firstBunchOfLines = bodyParts[a].substring(0, 1000);
			// split lines into array
			firstBunchOfLines = firstBunchOfLines.match(/[^\r\n]+/g);
			*/
		
			httpResponses.push(httpResponse);			
		}
	}

	return httpResponses;
}

// mimics official Google gapi.client - https://developers.google.com/api-client-library/javascript/reference/referencedocs
function MyGAPIClient() {
}

MyGAPIClient.prototype = {
	request: function(args) {
		return args;
	}
}

// static method
MyGAPIClient.getHeaderValue = function(headers, name) {
	if (headers) {
		for (const header of headers) {
			if (name.equalsIgnoreCase(header.name)) {
				return header.value;
			}
		}
	}
}

MyGAPIClient.getAllHeaderValues = function(headers, name) {
	var values = [];
	if (headers) {
		for (const header of headers) {
			if (name.equalsIgnoreCase(header.name)) {
				values.push(header.value);
			}
		}
	}
	return values;
}

function HttpBatch() {
	var MAX_CALLS_PER_BATCH = 100;
	
	var httpRequests = [];
	var LF = "\n";
	var data = "";
	
	function addDataLine(str) {
		data += str + LF;
	}

	this.add = function(httpRequest, optParams) {
		if (httpRequests.length > MAX_CALLS_PER_BATCH) {
			throw new Error(JError.EXCEEDED_MAXIMUM_CALLS_PER_BATCH);
		} else {
			httpRequests.push(httpRequest);
		}
	};
	
	// Usage: params: .oauthRequest, .tokenResponse OR .email
	this.execute = async function(sendOAuthParams) {
        if (httpRequests.length) {
            var boundary = "batch_sep";
            
            for (const httpRequest of httpRequests) {
                addDataLine("");
                addDataLine("--" + boundary);
                addDataLine("Content-Type: application/http");
                addDataLine("");
                addDataLine(httpRequest.method + " " + httpRequest.path);
            }
            addDataLine("--" + boundary + "--");
            
            // if no token passed then use email
            var tokenResponse = sendOAuthParams.tokenResponse;
            if (!tokenResponse) {
                tokenResponse = await sendOAuthParams.oauthRequest.findTokenResponse({userEmail:sendOAuthParams.email});
            }
            
            const sendResponse = await sendOAuthParams.oauthRequest.send({
                tokenResponse: tokenResponse,
                type: "POST",
                url: GmailAPI.DOMAIN + "/batch/gmail/v1",
                contentType: 'multipart/mixed; boundary="' + boundary + '"',
                data: data
            });
            //console.log("batch response", sendResponse);
            
            var httpResponses = parseBodyParts(sendResponse);
            console.log("parsed parts parsed", httpResponses);
            
            const httpBodies = httpResponses.map(httpResponse => {
                try {
                    httpResponse.body = JSON.parse(httpResponse.body);
                    if (httpResponse.statusText != "success") {
                        if (httpResponse.body.error) {
                            httpResponse.error = httpResponse.body.error.message;
                            httpResponse.code = httpResponse.body.error.code;
                            if (httpResponse.body.error.code == 404) {
                                httpResponse.body.jerror = JError.NOT_FOUND;
                                console.warn("might be permanently deleted: " + httpResponse.body.error.message);
                            } else {
                                logError("execute error: " + httpResponse.body.error.message + " data: " + data + " body: " + JSON.stringify(httpResponse.body));
                            }
                        } else {
                            throw new Error("error3 status: " + httpResponse.statusText);
                        }
                    }
                } catch (e) {
                    logError("execute error2: " + e + " httpResponse.error: " + httpResponse.error + " data: " + data + " body: " + JSON.stringify(httpResponse.body));
                    httpResponse.error = httpResponse.body;
                    httpResponse.body = {
                        error: {
                            message: httpResponse.error
                        }
                    };
                }
                return httpResponse.body;
            });
            // must match dummy resolve below if httpRequests.length == 0
            return {httpResponses:httpResponses, httpBodies:httpBodies};
        } else {
            // send out dummy 
            return {httpResponses:[], httpBodies:[]};
        }
	}

}

function getMyGAPIClient() {
	var mygapiClient = new MyGAPIClient();
	mygapiClient.HttpBatch = new HttpBatch();
	return mygapiClient;
}

function OAuthForDevices(defaultParams) {

	var that = this;

	const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
	const GOOGLE_CLIENT_ID = "450788627700-m1vhpe3biqmp4vgaachs2us80updp12j.apps.googleusercontent.com";
	const GOOGLE_REDIRECT_URI = "https://apps.jasonsavard.com/oauth2callback";

    async function getTokenResponses() {
        return await storage.getEncryptedObj(defaultParams.storageKey, dateReviver) || [];
    }

    async function setTokenResponses(tokenResponses) {
        await storage.setEncryptedObj(defaultParams.storageKey, tokenResponses);
    }

    async function sequentialFunction(fn) {
        return new Promise(async (resolve, reject) => {
            if (that.sequentialFunctionPromise) {
                await that.sequentialFunctionPromise;
                await fn();
                that.sequentialFunctionPromise = null;
                resolve();
            } else {
                that.sequentialFunctionPromise = new Promise(async (resolve, reject) => {
                    await fn();
                    resolve();
                }).then(() => {
                    that.sequentialFunctionPromise = null;
                    resolve();
                })
            }
        });
    }

    async function updateToken(tokenResponse) {
        await sequentialFunction(async () => {
            const tokenResponses = await getTokenResponses();
            const index = await that.findTokenResponseIndex(tokenResponse);
            tokenResponses[index] = tokenResponse;
            await setTokenResponses(tokenResponses);
        });
    }

	this.getSecurityToken = async () => {
		return storage.get(defaultParams.securityTokenKey);
    }

	this.generateSecurityToken = async () => {
        const securityToken = getUniqueId();
        await storage.set(defaultParams.securityTokenKey, securityToken);
        return securityToken;
    }
    
    this.removeSecurityToken = async () => {
        return storage.remove(defaultParams.securityTokenKey);
    }
	
	this.getUserEmails = async function() {
        return (await getTokenResponses()).map(tokenResponse => tokenResponse.userEmail);
	}

	if (defaultParams.getUserEmail) {
		// override default with this method
		this.getUserEmail = defaultParams.getUserEmail;
	} else {
		// default getUserEmail	
		this.getUserEmail = function(tokenResponse, sendOAuthRequest) {
			return new Promise((resolve, reject) => {
				sendOAuthRequest({tokenResponse:tokenResponse, url: GmailAPI.URL + "profile", noCache:true}).then(data => {
					resolve({
                        userEmail: data.emailAddress
                    });
				}).catch(error => {
					error += " (Could not get userinfo - email)";
					logError(error);
					reject(error);
				});
			});
		}
    }
    
    function setExpiryDate(tokenResponse) {
        // expires_in params is in seconds (i think)
        tokenResponse.expiryDate = new Date(Date.now() + (tokenResponse.expires_in * 1000));
    }

	this.openPermissionWindow = async function(params = {}) {
        const scopes = params.scopes || defaultParams.scope;
        const stateParams = `${chrome.runtime.getURL(`oauth2callback.html?security_token=${await that.generateSecurityToken()}`)}&scopes=${scopes}`;

        var url = `${GOOGLE_AUTH_URL}?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(stateParams)}`;
        
        var prompt = "consent";
        
        if (params.email) {
            url += `&login_hint=${encodeURIComponent(params.email)}`;
        } else {
            prompt += " select_account";
        }
        
        url += `&prompt=${encodeURIComponent(prompt)}`;
        url += "&access_type=offline"; // required when I used https://www.googleapis.com/oauth2/v4/token (instead of the old way https://accounts.google.com/o/oauth2/v2/auth) or else refresh_token was not returned
        url += "&include_granted_scopes=true";
        
        const width = 600;
        const height = DetectClient.isFirefox() ? 650 : 800;

        const position = await getCenterWindowPosition(width, height);
        
        const newWindow = await createWindow({
            url: url,
            width: Math.round(width),
            height: Math.round(height),
            left: position.left,
            top: position.top,
            type: "popup"
        });
        
        localStorage._permissionWindowId = newWindow.id;
        globalThis.permissionWindow = newWindow;
        return newWindow;
	}

    async function oauthFetch(url, data, options = {}) {
        try {
            return await fetchJSON(url, data, options);
        } catch (response) {
            console.log("oauthfetchresponse", response);
            let error;
            if (response.error) {
                if (response.error.message) {
                    error = Error(response.error.message);
                    error.code = response.error.code;
                } else { // token errors look like this {"error": "invalid_grant", "error_description": "Bad Request"}
                    error = Error(response.error);
                    error.code = response.code;
                }
            } else if (typeof response == "object") {
                error = Error(response.statusText);
                error.code = response.status;
                if (response.jError) {
                    error.jError = response.jError;
                }
            } else {
                error = response;
            }

            if (error == "invalid_grant" || error == "invalid_request" || error.code == ErrorCodes.BAD_REQUEST || error.code == ErrorCodes.UNAUTHORIZED) { // i removed 400 because it happens when entering invalid data like a quick add of "8pm-1am Test 1/1/19"
                error.message = "You need to re-grant access, it was probably revoked";
            }

            console.error("error in oauthFetch: ", error);
            throw error;
        }
    }

	this.generateURL = async function(userEmail, url) {
        const tokenResponse = await that.findTokenResponse({userEmail:userEmail});
        if (tokenResponse) {
            const response = await ensureToken(tokenResponse);
            // before when calling refreshtoken we used to call this method, notice the tokenResponse came from the response and not that one passed in... params.generatedURL = setUrlParam(url, "access_token", params.tokenResponse.access_token);
            response.generatedURL = setUrlParam(url, "access_token", tokenResponse.access_token);
            return response;
        } else {
            throw new Error("No tokenResponse found!");
        }
	}
	
	async function sendOAuthRequest(params) {
        let accessToken;
        if (params.tokenResponse) {
            accessToken = params.tokenResponse.access_token;
        } else if (params.userEmail) {
            var tokenResponse = await that.findTokenResponse(params);
            accessToken = tokenResponse.access_token;
        }
        
        if (params.appendAccessToken) {
            params.data = initUndefinedObject(params.data);
            params.data.access_token = accessToken;
        }
        
        if (/delete/i.test(params.type)) {
            params.data = null;
        }
        
        console.log("sendOAuthRequest: " + params.userEmail + " url: " + params.url);

        const options = {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
        }

        if (params.headers) {
            options.headers = {...options.headers, ...params.headers};
        }

        if (params.type) {
            options.method = params.type.toUpperCase(); // was getting CORS and Access-Control-Allow-Origin errors!!
        }

        if (params.noCache) {
            options.cache = "no-cache";
        }

        options.headers["content-type"] = params.contentType || "application/json; charset=utf-8";

        options.mode = "cors";

        try {
            const data = await oauthFetch(params.url, params.data, options);
            // empty data happens when user does a method like DELETE where this no content returned
            return data || {};
        } catch (error) {
            copyObj(params, error);
            throw error;
        }
	}
	
	async function ensureToken(tokenResponse) {
        if (tokenResponse.chromeProfile) {
            const getAuthTokenParams = {
                interactive: false,
                scopes: (tokenResponse.scopes || Scopes.GMAIL_MODIFY).split(" ") // legacy default to initial full scope (before i reduced them)
            };
            try {
                tokenResponse.access_token = await getAuthToken(getAuthTokenParams);
                await updateToken(tokenResponse);
                return {};
            } catch (errorMessage) {
                const error = Error(errorMessage);
                error.tokenResponse = tokenResponse;
                error.oauthAction = "refreshToken";

                if (error.toString().includes("OAuth2 not granted or revoked")) {
                    error.code = 401;
                }
                throw error;
            }
        } else if (isExpired(tokenResponse)) {
            console.log("token expired: ", tokenResponse);
            return refreshToken(tokenResponse);
        } else {
            return {};
        }
	}

	async function refreshToken(tokenResponse) {
        console.log("refresh token: " + tokenResponse.userEmail + " now time: " + Date.now().toString());

        let data = {
            refresh_token: tokenResponse.refresh_token,
            extension: ITEM_ID,
        };

        // old OAuth client ID (in new way, I save the client id in tokenresponse)
        if (!tokenResponse.clientId) {
            data.old_client_id = true;
        }

        try {
            data = await getAuthTokenFromServer(data);
        } catch (error) {
            error.tokenResponse = tokenResponse;
            error.oauthAction = "refreshToken";
            throw error;
        }

        tokenResponse.access_token = data.access_token;
        tokenResponse.token_type = data.token_type;
        tokenResponse.expires_in = data.expires_in;
        setExpiryDate(tokenResponse);
        console.log("in refresh: " + tokenResponse.expiryDate.toString());

        // patch #1 of 2 for access revoke concurrency issue, because array items were being overwritten : https://jasonsavard.com/forum/discussion/5171/this-access-was-revoked-error-keeps-happening-even-after-reinstalling-etc#latest
        // you can reproduce this by setting expired access tokens to ALL accounts and using old expiry dates and then reload the extension, it's intermittent
        await updateToken(tokenResponse);

        return {tokenResponse:tokenResponse};
	}
	
	// private isExpired
	function isExpired(tokenResponse) {
        var SECONDS_BUFFER = -300; // 5 min. yes negative, let's make the expiry date shorter to be safe
		return !tokenResponse.expiryDate || new Date().isAfter(new Date(tokenResponse.expiryDate).addSeconds(SECONDS_BUFFER, true));
    }
    
    function getAuthToken(params) {
        return new Promise((resolve, reject) => {
            chrome.identity.getAuthToken(params, token => {
                if (chrome.runtime.lastError) {
                    console.info("getAuthToken error: " + chrome.runtime.lastError.message, token);
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve(token);
                }
            });
        });
    }

    function eStr(raw, offset = 1) {
        let str = "";
        for (let i = 0; i < raw.length; i++) {
            str += String.fromCharCode(raw.charCodeAt(i) + offset);
        }
        return str;
    }

    function dStr(raw, offset = -1) {
        return eStr(raw, offset);
    }

    async function getAuthTokenFromServer(data) {
        data.version = "3";
        
        if (data.refresh_token) {
            data.ert = eStr(data.refresh_token);
            delete data.refresh_token;
        }

        const rawResponse =  await oauthFetch("https://extensions-auth.uc.r.appspot.com/oauthToken", data, {
            method: "post",
            headers: {
                "content-type": "application/json" // required for golang or would come in as ==part form-data ...
            },
        });
        
        const response = dStr(rawResponse);
        return JSON.parse(response);
    }

	// public method, meant to be called before sending multiple asynchonous requests to .send
	this.ensureTokenForEmail = async function(userEmails) {
        // if single email passed, put it into an array
        if (!Array.isArray(userEmails)) {
            userEmails = [userEmails];
        }
        
        let responses = [];
        await asyncForEach(userEmails, async (userEmail, index) => {
            var tokenResponse = await that.findTokenResponse({userEmail:userEmail});
            if (tokenResponse) {
                let response = await ensureToken(tokenResponse);
                responses.push(response);
            } else {
                var error = Error("no token for: " + userEmail + ": might have not have been granted access");
                console.warn(error);
                throw error;
            }
        });

        if (responses.length == 1) {
            return responses.first();
        } else {
            return responses;
        }
	}		
	
	this.send = async function(params) {
        var tokenResponse;
        // if tokenresponse directly passsed here then use it, else let's use the userEmail to find the token
        if (params.tokenResponse) {
            tokenResponse = params.tokenResponse;
        } else {
            tokenResponse = await that.findTokenResponse(params);		
        }
        if (tokenResponse) {
            await ensureToken(tokenResponse);
            // patch #2 of 2 happened with 3+ accounts - access revoke concurrency issue : https://jasonsavard.com/forum/discussion/5171/this-access-was-revoked-error-keeps-happening-even-after-reinstalling-etc#latest
            params.tokenResponse = tokenResponse;
            return sendOAuthRequest(params);
        } else {
            var errorEmail;
            if (params.userEmail && params.userEmail.includes("@")) {
                errorEmail = "(specific email)";
            } else {
                errorEmail = "(/mail/u/*)";
            }
            console.warn("no token response found for email2: " + errorEmail + " " + params.url);
            throw new Error(JError.NO_TOKEN_FOR_EMAIL);
        }
	}
	
	this.findTokenResponseIndex = async function(params) {
        const tokenResponses = await getTokenResponses();
        return tokenResponses.findIndex(element => element.userEmail == params.userEmail);
	}
	
	this.findTokenResponse = async function(params) {
		var index = await that.findTokenResponseIndex(params);
		if (index != -1) {
            const tokenResponses = await getTokenResponses();
			return tokenResponses[index];
		}
	}

	this.findTokenResponseByIndex = async function(index) {
        const tokenResponses = await getTokenResponses();
		return tokenResponses[index];
	}

	this.removeTokenResponse = async function(params) {
        const index = await that.findTokenResponseIndex(params);
        if (index != -1) {
            const tokenResponses = await getTokenResponses();
            tokenResponses.splice(index, 1);
            await setTokenResponses(tokenResponses);
        }
	}

	this.removeAllTokenResponses = async function() {
        await setTokenResponses([]);
	}

	this.removeAllCachedTokens = async function() {
        const tokenResponses = await getTokenResponses();
        const removeTokenPromises = tokenResponses.map(tokenResponse => removeCachedAuthToken(tokenResponse.access_token));
        return alwaysPromise(removeTokenPromises);
	}

	this.getAccessToken = async function(params) {
        that.code = params.code;
		console.log("get access token");
        let tokenResponse;
        
        if (params.code) {

            tokenResponse = await getAuthTokenFromServer({
                code: params.code,
                extension: ITEM_ID,
            });

            that.removeSecurityToken();
        } else {
            if (params.refetch) {
                if (params.userEmail) {
                    const tokenResponse = await that.findTokenResponse({ userEmail: userEmail });
                    try {
                        await removeCachedAuthToken(tokenResponse.access_token);
                    } catch (error) {
                        // nothing
                        console.warn(error);
                    }
                } else {
                    await that.removeAllCachedTokens();
                }
            }

            tokenResponse = {
                chromeProfile: true
            };

            const getAuthTokenParams = {
                interactive: true,
                scopes: (params.scopes || defaultParams.scope).split(" ")
            };

            let token;
            try {
                token = await getAuthToken(getAuthTokenParams);
            } catch (error) {
                // patch seems even on success it would return an error, but calling it 2nd time would get the token
                getAuthTokenParams.interactive = false;
                token = await getAuthToken(getAuthTokenParams);
            }
            tokenResponse.access_token = token;
        }
        
        const response = await that.getUserEmail(tokenResponse, sendOAuthRequest);
        if (response.userEmail) {
            // add this to response
            tokenResponse.userEmail = response.userEmail;
            if (response.name) {
                tokenResponse.name = response.name;
            }
            if (response.photoUrl) {
                tokenResponse.photoUrl = response.photoUrl;
            }
            tokenResponse.clientId = GOOGLE_CLIENT_ID;
            tokenResponse.scopes = params.scopes || defaultParams.scope;

            if (tokenResponse.expires_in) {
                setExpiryDate(tokenResponse);
            }

            const tokenResponses = await getTokenResponses();
            const index = await that.findTokenResponseIndex(response);
            if (index != -1) {
                // update if exists
                tokenResponses[index] = tokenResponse;
            } else {
                // add new token response
                tokenResponses.push(tokenResponse);
            }
            await setTokenResponses(tokenResponses);
            return { tokenResponse: tokenResponse };
        } else {
            throw new Error("Could not fetch email");
        }
	}
}

function DetectSleepMode(wakeUpCallback) {
    var PING_INTERVAL = 60; // MUST MATCH the Alarm EVERY_MINUTE
	var PING_INTERVAL_BUFFER = 15;
	
	var lastPingTime = new Date();
	var lastWakeupTime = new Date(1); // make the last wakeup time really old because extension starting up does not equal a wakeup 
	
	function lastPingIntervalToolLong() {
		return lastPingTime.diffInSeconds() < -(PING_INTERVAL+PING_INTERVAL_BUFFER);
	}
	
	this.ping = function() {
		if (lastPingIntervalToolLong()) {
			console.log("DetectSleepMode.wakeup time: " + new Date());
			lastWakeupTime = new Date();
			if (wakeUpCallback) {
				wakeUpCallback();
			}
		}
		lastPingTime = new Date();
	}
    
	this.isWakingFromSleepMode = function() {
		console.log("DetectSleepMode.last ping: " + lastPingTime);
		console.log("last wakeuptime: " + lastWakeupTime);
		console.log("current time: " + new Date())
		// if last wakeup time was recently set than we must have awoken recently
		if (lastPingIntervalToolLong() || lastWakeupTime.diffInSeconds() >= -(PING_INTERVAL+PING_INTERVAL_BUFFER)) {
			return true;
		} else {
			return false;
		}
	}
}

function Controller() {
	
	// apps.jasonsavard.com server
	Controller.FULLPATH_TO_PAYMENT_FOLDERS = "https://apps.jasonsavard.com/";
	
	// jasonsavard.com server
	//Controller.FULLPATH_TO_PAYMENT_FOLDERS = "https://jasonsavard.com/apps.jasonsavard.com/";

	// internal only for now
	function callAjaxController(params) {
		return fetchJSON(Controller.FULLPATH_TO_PAYMENT_FOLDERS + "controller.php", params.data, {
            method: params.method ? params.method : "GET",
            headers: {
                misc: location.href
            }
		});
	}

	Controller.ajax = function(params) {
		return callAjaxController(params);
	}

	Controller.verifyPayment = function(itemID, emails) {
		var data = {action:"verifyPayment", name:itemID, email:emails};
		return callAjaxController({data:data});
	}
	
	Controller.getSkins = function(ids, timeMin) {
		const data = {
            action: "getSkins",
            extension: "gmail",
            misc: location.href
        };

        if (ids) {
            data.ids = ids;
        }

		if (timeMin) {
			data.timeMin = Math.round(new Date().diffInSeconds(timeMin)); // seconds elapsed since now
		}
		
		return callAjaxController({data:data});
	}

	Controller.updateSkinInstalls = function(id, offset) {
		var data = {};
		data.action = "updateSkinInstalls";
		data.id = id;
		data.offset = offset;
		data.misc = location.href;
		
		// had to pass misc as parameter because it didn't seem to be passed with header above
		return callAjaxController({data:data});
	}

	Controller.processFeatures = async function() {
		await storage.set("donationClicked", true);
		chrome.runtime.sendMessage({command: "featuresProcessed"}, function(response) {});
	}

}

function replaceBase64UrlSafeCharacters(str) {
	if (str) {
		str = str.replace(/-/g, '+');
		str = str.replace(/_/g, '/');
	}
	return str;
}

function replaceBase64UrlUnsafeCharacters(str) {
	str = str.replace(/\+/g, '-');
	str = str.replace(/\//g, '_');
	return str;
}

function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

function decodeBase64UrlSafe(str) {
	if (str) {
        str = replaceBase64UrlSafeCharacters(str);
        // Patch: Refer to unicode problem - https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
        // return decodeURIComponent(escape(window.atob( str )));
        return b64DecodeUnicode(str); // refer to: https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
	} else {
		return str;
	}
}

function encodeBase64UrlSafe(str) {
	str = b64EncodeUnicode(str);
    str = replaceBase64UrlUnsafeCharacters(str);
	return str;
}

function nbsp(count) {
	var str = "";
	for (var a=0; a<count; a++) {
		str += "&nbsp;";
	}
	return str;
}

// usage: JSON.parse(str, dateReviver) find all date strings and turns them into date objects
function dateReviver(key, value) {
	// 2012-12-04T13:51:06.897Z
	if (typeof value == "string" && value.length == 24 && /\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\.\d{3}Z/.test(value)) {
		return new Date(value);
	} else {
		return value;
	}
}

var syncOptions = (function() {
	var MIN_STORAGE_EVENTS_COUNT_BEFORE_SAVING = 4;
	var LOCALSTORAGE_CHUNK_PREFIX = "localStorageChunk";
	var INDEXEDDB_CHUNK_PREFIX = "indexedDBChunk";
	var saveTimeout;
	var paused;
	
	// ex. syncChunks(deferreds, localStorageChunks, "localStorageChunk", setDetailsSeparateFromChunks);
	function syncChunks(deferreds, chunks, chunkPrefix, details, setDetailsSeparateFromChunks) {
		
		var previousDeferredsCount = deferreds.length;
		
		chunks.forEach((chunk, index) => {
			var itemToSave = {};
			
			// let's set details + chunk together
			if (!setDetailsSeparateFromChunks) {
				itemToSave["details"] = details;
			}
			
			itemToSave[chunkPrefix + "_" + index + "_" + details.chunkId] = chunk;
			
			console.log("trying to sync.set json length: ", chunkPrefix + "_" + index + "_" + details.chunkId, chunk.length + "_" + JSON.stringify(chunk).length);
			
			const promise = new Promise((resolve, reject) => {
				// firefox
				chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE ??= 120;

				// to avoid problems with MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE let's spread out the calls
				var delay;
				var SYNC_OPERATIONS_BEFORE = 1; // .clear were done before
				if (SYNC_OPERATIONS_BEFORE + previousDeferredsCount + chunks.length > chrome.storage.sync.MAX_WRITE_OPERATIONS_PER_MINUTE) {
					delay = (previousDeferredsCount+index) * seconds(10); // makes only 6 calls per minute
				} else {
					delay = 0;
				}
				setTimeout(function() {					
					chrome.storage.sync.set(itemToSave, function() {
						if (chrome.runtime.lastError) {
							var error = "sync error: " + chrome.runtime.lastError.message;
							logError(error);
							reject(error);
						} else {											
							console.log("saved " + chunkPrefix + " " + index);
							resolve("success");
						}
					});
				}, delay);
			});
			deferreds.push(promise);
		});
	}
	
	// usage: compileChunks(details, items, details.localStorageChunksCount, LOCALSTORAGE_CHUNK_PREFIX) 
	function compileChunks(details, items, chunkCount, prefix) {
		var data = "";
		for (var a=0; a<chunkCount; a++) {
			data += items[prefix + "_" + a + "_" + details.chunkId];
		}
		return JSON.parse(data);
	}
	
	function isSyncable(key) {
		return !key.startsWith("_") && !syncOptions.excludeList.includes(key);
	}
	
	return { // public interface
		init: function(excludeList = []) {
			// all private members are accesible here
			syncOptions.excludeList = excludeList;
		},
		storageChanged: async function(params) {
			if (!paused) {
				if (isSyncable(params.key)) {
					// we don't want new installers overwriting their synced data from previous installations - so only sync after certain amount of clicks by presuming their just going ahead to reset their own settings manually
					var storageEventsCount = await storage.get("_storageEventsCount");
					if (!storageEventsCount) {
						storageEventsCount = 0;
					}
					await storage.set("_storageEventsCount", ++storageEventsCount);
					
					// if loaded upon new install then we can proceed immediately to save settings or else want for minium storage event
					if (await storage.get("lastSyncOptionsLoad") || await storage.get("lastSyncOptionsSave") || storageEventsCount >= MIN_STORAGE_EVENTS_COUNT_BEFORE_SAVING) {
                        console.log("storage event: " + params.key + " will sync it soon...");
                        chrome.alarms.create(Alarms.SYNC_DATA, {delayInMinutes: 1});
					} else {
						console.log("storage event: " + params.key + " waiting for more storage events before syncing");
					}
				} else {
					//console.log("storage event ignored: " + params.key);
				}
			}
		},
		pause: function() {
			paused = true;
		},
		resume: function() {
			paused = false;
		},
		save: function(reason) {
			return new Promise(function(resolve, reject) {
				if (chrome.storage.sync) {
					// firefox
					if (!chrome.storage.sync.QUOTA_BYTES_PER_ITEM) {
						chrome.storage.sync.QUOTA_BYTES_PER_ITEM = 8192;
					}
					// split it up because of max size per item allowed in Storage API
					// because QUOTA_BYTES_PER_ITEM is sum of key + value STRINGIFIED! (again)
					// watchout because the stringify adds quotes and slashes refer to https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
					// so let's only use 70% of the max and leave the rest for stringification when the sync.set is called
					var MAX_CHUNK_SIZE = Math.floor(chrome.storage.sync.QUOTA_BYTES_PER_ITEM * 0.60); // changed from 80 to 70, 60 ref: https://jasonsavard.com/forum/discussion/comment/24198#Comment_24198
		
					console.log("syncOptions: saving data reason: " + reason + "...");
					
					// process localStorage
					var localStorageItemsToSave = {};

                    if (globalThis.localStorage) {
                        for (const key in globalThis.localStorage) {
                            // don't incude storage options starting with _blah and use exclude list
                            if (isSyncable(key)) {
                                //console.log(key + ": " + globalThis.localStorage[key]);
                                localStorageItemsToSave[key] = globalThis.localStorage[key];
                            }
                        }
                    }
					
					syncOptions.exportIndexedDB({}, function(exportIndexedDBResponse) {
						// remove all items first because we might have less "chunks" of data so must clear the extra unsused ones now
						chrome.storage.sync.clear(function() {
							if (chrome.runtime.lastError) {
								var error = "sync error: " + chrome.runtime.lastError.message;
								logError(error);
								reject(error);
							} else {
								try {
									var deferreds = [];
									var deferred;
									
									var chunkId = getUniqueId();

                                    const QUOTA_ERROR_STR = "Settings to large. If you need to replicate the settings you can take screenshots of the option pages and set them manually onto the other device.";

                                    // set firefox defaults
                                    chrome.storage.sync.QUOTA_BYTES ??= 102400;

                                    if (JSON.stringify(localStorageItemsToSave).length + JSON.stringify(exportIndexedDBResponse.data).length > chrome.storage.sync.QUOTA_BYTES) {
                                        reject(QUOTA_ERROR_STR);
                                    }
		
									var localStorageChunks = chunkObject(localStorageItemsToSave, MAX_CHUNK_SIZE);
									var indexedDBChunks = chunkObject(exportIndexedDBResponse.data, MAX_CHUNK_SIZE);
									
									var details = {chunkId:chunkId, localStorageChunksCount:localStorageChunks.length, indexedDBChunksCount:indexedDBChunks.length, extensionVersion:chrome.runtime.getManifest().version, lastSync:new Date().toJSON(), syncReason:reason};
									
									// can we merge details + first AND only chunk into one .set operation (save some bandwidth)
									var setDetailsSeparateFromChunks;
									
									if (localStorageChunks.length == 1 && indexedDBChunks.length == 1 && JSON.stringify(details).length + localStorageChunks.first().length + indexedDBChunks.first().length < MAX_CHUNK_SIZE) {
										setDetailsSeparateFromChunks = false;
									} else {
										setDetailsSeparateFromChunks = true;
		
										// set sync header/details...
										deferred = new Promise((resolve, reject) => {
											chrome.storage.sync.set({details:details}, function() {
												console.log("saved details");
												resolve("success");
											});
										});
										deferreds.push(deferred);
									}
									
									// in 1st call to syncChunks let's pass the last param setDetailsSeparateFromChunks
									// in 2nd call to syncChunks let's hard code setDetailsSeparateFromChunks to true
									syncChunks(deferreds, localStorageChunks, LOCALSTORAGE_CHUNK_PREFIX, details, setDetailsSeparateFromChunks);
									syncChunks(deferreds, indexedDBChunks, INDEXEDDB_CHUNK_PREFIX, details, true);
									
									Promise.all(deferreds).then(() => {
                                        storage.setDate("lastSyncOptionsSave");
                                        console.log("sync done");
                                        resolve();
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        // error occured so let's clear storage because we might have only partially written data
                                        chrome.storage.sync.clear();
                                        
                                        if (error.toString().includes("QUOTA")) {
                                            reject(QUOTA_ERROR_STR);
                                        } else {
                                            reject("jerror with sync deferreds: " + error);
                                        }
                                    });
								} catch (error) {
									reject(error);
								}
							}
						});
					});
				} else {
					reject(new Error("Sync is not supported!"));
				}
			});
		},
		fetch: function() {
			return new Promise(function(resolve, reject) {
				if (chrome.storage.sync) {
					console.log("syncOptions: fetch...");
					chrome.storage.sync.get(null, function(items) {
						if (chrome.runtime.lastError) {
							var error = "sync last error: " + chrome.runtime.lastError.message;
							reject(error);
						} else {
							console.log("items", items);
							if (isEmptyObject(items)) {
								reject("Could not find any synced data!<br><br>Make sure you sign in to Chrome on your other computer AND this one <a target='_blank' href='https://support.google.com/chrome/answer/185277'>More info</a>");
							} else {
								var details = items["details"];
								if (details.extensionVersion != chrome.runtime.getManifest().version) {
									reject({items:items, error:"Versions are different: " + details.extensionVersion + " and " + chrome.runtime.getManifest().version});
								} else {
									resolve(items);
								}
							}
						}
					});
				} else {
					reject(new Error("Sync is not supported!"));
				}
			});
		},
		load: function(items) {
			console.log("syncOptions: load...");
			return new Promise(async (resolve, reject) => {
				if (chrome.storage.sync) {
					if (items) {
						var details = items["details"]; 
						if (details) {
							// process localstorage
                            if (globalThis.localStorage) {
                                var dataObj;
                                dataObj = compileChunks(details, items, details.localStorageChunksCount, LOCALSTORAGE_CHUNK_PREFIX);
                                for (const item in dataObj) {
                                    globalThis.localStorage.setItem(item, dataObj[item]);
                                }
                            }
							
							// process indexeddb
							if (details.indexedDBChunksCount) {
                                dataObj = compileChunks(details, items, details.indexedDBChunksCount, INDEXEDDB_CHUNK_PREFIX);
								syncOptions.importIndexedDB(dataObj).then(() => {
									resolve(items);
								}).catch(error => {
									reject(error);
								})
							} else {
								resolve(items);
							}
							
							// finish stamp
                            await storage.setDate("lastSyncOptionsLoad");
							console.log("done");
						}
					} else {
						reject("No items found");
					}
				} else {
					reject(new Error("Sync is not supported!"));
				}
			});
		},
		exportIndexedDB: function(params = {}, callback) {
			const db = wrappedDB.db;
			
		    if (!db) {
		    	callback({error: "jerror db not declared"});
		    	return;
		    }

		    //Ok, so we begin by creating the root object:
		    var data = {};
		    var promises = [];
		    for(var i=0; i<db.objectStoreNames.length; i++) {
		        //thanks to http://msdn.microsoft.com/en-us/magazine/gg723713.aspx
		        promises.push(

		            new Promise((resolve, reject) => {

		                var objectstore = db.objectStoreNames[i];
		                console.log("objectstore: " + objectstore);

		                var transaction = db.transaction([objectstore], "readonly");  
		                var content = [];

		                transaction.oncomplete = function(event) {
		                    console.log("trans oncomplete for " + objectstore + " with " + content.length + " items");
		                    resolve({name:objectstore, data:content});
		                };

		                transaction.onerror = function(event) {
		                	// Don't forget to handle errors!
		                	console.dir(event);
		                };

		                var handleResult = function(event) {  
		                	var cursor = event.target.result;  
		                	if (cursor) {
                                //console.log(cursor.key + " " + JSON.stringify(cursor.value).length);
		                		
		                		// don't incude storage options starting with _blah and use exclud list
		                		if (cursor.key.startsWith("_") || (!params.exportAll && syncOptions.excludeList.includes(cursor.key))) {
		                			// exclude this one and do nothing
		                			console.log("excluding this key: " + cursor.key);
		                		} else {
                                    // strip accounts and keep only skeleton
                                    if (cursor.key == "accounts") {
                                        console.log("Strip accounts", cursor.value);
                                        const accounts = cursor.value.value;
                                        accounts.forEach(account => {
                                            account.mails = account.unsnoozedEmails = account.emailsInAllLabels = JSON.stringify([]);
                                        });
                                    }
                                    content.push({key:cursor.key, value:cursor.value});
                                    try {
                                        console.log("key: " + cursor.key + " length: ", cursor.value.value.length)
                                    } catch (error) {
                                        console.warn("could not log this one", error);
                                    }
		                		}
		                		
		                		cursor.continue();  
		                	}
		                };  

		                var objectStore = transaction.objectStore(objectstore);
		                objectStore.openCursor().onsuccess = handleResult;

		            })

		        );
		    }

		    Promise.all(promises)
		    	.then(dataToStore => {
                    console.log(dataToStore);
			        // arguments is an array of structs where name=objectstorename and data=array of crap
			        // make a copy cuz I just don't like calling it argument
			        //var dataToStore = arguments;
			        //serialize it
			        var serializedData = JSON.stringify(dataToStore);
			        console.log("datastore:", dataToStore);
			        console.log("length: " + serializedData.length);
			        
			        callback({data:dataToStore});
			        
			        //downloadObject(dataToStore, "indexedDB.json");
			        
			        //The Christian Cantrell solution
			        //var link = $("#exportLink");
			        //document.location = 'data:Application/octet-stream,' + encodeURIComponent(serializedData);
			        //link.attr("href",'data:Application/octet-stream,'+encodeURIComponent(serializedData));
			        //link.trigger("click");
			        //fakeClick(link[0]);
		   		})
		   		.catch(error => {
		   			console.error(error)
		   			callback({error:"jerror when exporting"});
		   		})
		    ;
		},
		importIndexedDB: function(obj) {
			return new Promise(function(resolve, reject) {
				// first (and only) item in array should be the "settings" objectstore that i setup when using the indexedb with this gmail checker
                var settingsObjectStore = obj[0];
				if (settingsObjectStore.name == storage.getStoreId()) {
					var promises = [];
					for (var a=0; a<settingsObjectStore.data.length; a++) {
						var key = settingsObjectStore.data[a].key;
						var value = settingsObjectStore.data[a].value.value;

	        			// could be excessive but i'm stringifing because i want parse with the datereviver (instead of interating the object myself in search of date strings)
	        			value = JSON.parse(JSON.stringify(value), dateReviver);
						
						console.log(key + ": " + value);
						promises.push( storage.set(key, value) );
					}
					Promise.all(promises).then(() => {
						resolve();
					}).catch(error => {
			   			console.error(error);
			   			reject("Problem importing settings: " + error);
					});
				} else {
					reject("Could not find 'settings' objectstore!");
				}
			});
		}
	};
})();

syncOptions.init([
	"version",
	"lastSyncOptionsSave",
	"lastSyncOptionsLoad",
	"detectedChromeVersion",
	"installDate",
	"installVersion",
	"DND_endTime",
	"lastOptionStatsSent",
	"tabletViewUrl",
	"autoSave",
	"customSounds",
	"contactsData",
    "peoplesData",
    "tokenResponsesEmails",
    "tokenResponsesContacts",
    "tokenResponsesProfiles",
    "unreadCount",
    "lastSetIconParams"
]);

function generateBlob(data, mimeType) {
	var blob = new Blob([convertBase64ToBlob(data)], {type:mimeType});
	return blob;
}

function generateBlobUrl(data, mimeType) {
	var blob = generateBlob(data, mimeType);
	var blobUrl = globalThis.URL.createObjectURL(blob);
	return blobUrl;
}

function downloadObject(data, filename) {
    if (!data) {
        console.error('No data')
        return;
    }

    if(!filename) filename = 'object.json'

    if(typeof data === "object"){
        data = JSON.stringify(data, undefined, 4)
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = globalThis.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, globalThis, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}

function downloadFile(data, mimeType, filename) {
	var blobUrl = generateBlobUrl(data, mimeType);
    var e = document.createEvent('MouseEvents');
    var a = document.createElement('a');

    a.download = filename;
    a.href = blobUrl;
    a.dataset.downloadurl =  [mimeType, a.download, a.href].join(':');
    
    // inside extenion popup windows CANNOT use .click() to execute on <a href="#"> instead must use e.init and e.dispatch event
    e.initMouseEvent('click', true, false, globalThis, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e);
}

function initUndefinedObject(obj) {
    if (typeof obj == "undefined") {
        return {};
    } else {
        return obj;
    }
}

function initUndefinedCallback(callback) {
    if (callback) {
        return callback;
    } else {
        return function() {};
    }
}

function chunkObject(obj, chunkSize) {
	var str = JSON.stringify(obj);
	return str.chunk(chunkSize);
}

function parseVersionString(str) {
    if (typeof(str) != 'string') { return false; }
    var x = str.split('.');
    // parse from string or default to 0 if can't parse
    var maj = parseInt(x[0]) || 0;
    var min = parseInt(x[1]) || 0;
    var pat = parseInt(x[2]) || 0;
    return {
        major: maj,
        minor: min,
        patch: pat
    }
}

function cmpVersion(a, b) {
    var i, cmp, len, re = /(\.0)+[^\.]*$/;
    a = (a + '').replace(re, '').split('.');
    b = (b + '').replace(re, '').split('.');
    len = Math.min(a.length, b.length);
    for( i = 0; i < len; i++ ) {
        cmp = parseInt(a[i], 10) - parseInt(b[i], 10);
        if( cmp !== 0 ) {
            return cmp;
        }
    }
    return a.length - b.length;
}

function gtVersion(a, b) {
    return cmpVersion(a, b) >= 0;
}

// syntax: ltVersion(details.previousVersion, "7.0.15")
function ltVersion(a, b) {
    return cmpVersion(a, b) < 0;
}

function escapeRegExp(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function isHex(str) {
	return /^[0-9A-Fa-f]+$/.test(str);
}

async function isOnline() {
	// patch because some distributions of linux always returned false for is navigator.online so let's force it to true
	if (DetectClient.isLinux() || await storage.get("disableOnline")) {
		return true;
	} else {
        return navigator.onLine;
	}
}

async function countEvent(eventName) {
	var lsKey = "_countEvent_" + eventName;
	
	var countEvent;
	var countEventStr = await storage.get(lsKey);
	
	if (countEventStr) {
		countEvent = JSON.parse(countEventStr);
		countEvent.startDate = new Date(countEvent.startDate);

		if (countEvent.startDate.isToday()) {
			countEvent.count++;
		} else {
			sendGA("frequentCountEvent", "hit", eventName, countEvent.count);
			countEvent.startDate = new Date();
			countEvent.count = 1;
		}
	} else {
		countEvent = {startDate:new Date(), count:1};
	}

	await storage.set(lsKey, countEvent);
}

function convertBase64ToBlob(base64str, type) {
	var byteString = atob(base64str);

	// write the bytes of the string to an ArrayBuffer
	var ab = new ArrayBuffer(byteString.length);
	var ia = new Uint8Array(ab);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}
	
	// write the ArrayBuffer to a blob, and you're done
	return new Blob([ia], {type: type});
}

// cross OS used to determine if ctrl or mac key is pressed
function isCtrlPressed(e) {
	return e.ctrlKey || e.metaKey;
}

//make sure it's not a string or empty because it will equate to 0 and thus run all the time!!!
//make sure it's not too small like 0 or smaller than 15 seconds
function setIntervalSafe(func, time) {
	if (isNaN(time) || parseInt(time) < 1000) {
		throw Error("jerror with setinterval safe: " + time + " is NAN or too small");
	} else {
		return setInterval(func, time); 
	}
}

async function sleep(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

async function setTimeoutCatchable(fn, delay) {
    await sleep(delay);
    await fn();
}

function repaintNode(node) {
	node.style.display='none';
	node.offsetHeight; // no need to store this anywhere, the reference is enough
	node.style.display='';
}

function DateTimeHighlighter() {

	var myDateRegexs = new Array();

	function addDayTimeRegex(myDateRegexs, myDateRegex) {
		
		// next week
		var nextWeekDate = new Date(myDateRegex.date);
		if (today().diffInDays(nextWeekDate) > -7) {
			nextWeekDate.setDate(nextWeekDate.getDate() + 7);
		}

		var myDateRegexNextWeek = JSON.parse(JSON.stringify(myDateRegex));
		myDateRegexNextWeek.pattern = "next " + myDateRegexNextWeek.pattern;
		myDateRegexNextWeek.date = nextWeekDate;

		myDateRegexs.push(myDateRegexNextWeek);

		// this day
		myDateRegexs.push(myDateRegex);
	}

	function getTime(date, pieces, startTimeOffset) {
		var d = new Date(date);

		// patch: had to use parseFloat instead of parseInt (because parseInt would return 0 instead of 9 when parsing "09" ???		
		var pos;
		if (startTimeOffset != null) {
			pos = startTimeOffset;
		} else {
			pos = 1;
		}
		var hours = parseFloat(pieces[pos]);
		var pm = pieces[pos+3];

		if (pm && pm.toLowerCase().includes("h")) {
			// 24 hour
			d.setHours(hours);
			d.setMinutes( parseFloat(pieces[pos+4]) || 0 );
		} else {
		
			if (hours >= 25) { //ie. 745pm was entered without the : (colon) so the hours will appear as 745 hours
				hours = parseFloat(pieces[pos].substring(0, pieces[pos].length-2));
				if (pm == "pm") {
					hours += 12;
				}
				var mins = pieces[pos].substring(pieces[pos].length-2);

				d.setHours(hours);
				d.setMinutes( parseFloat(mins) || 0 );
			} else {
				// patch for midnight because 12:12am is actually 0 hours not 12 hours for the date object
				if (hours == 12) {
					if (pm) {
						hours = 12;
					} else {
						hours = 0;
					}
				} else if (pm) {
					hours += 12;
				}
				d.setHours(hours);		
				//if ((pos+2) < pieces.length - ) {
				//}
				d.setMinutes( parseFloat(pieces[pos+2]) || 0 );
			}

		}

		d.setSeconds(0, 0);
		return d;
	}
	
	function getMonthNamePattern(monthNameIndex) {
		var monthName = dateFormat.i18nEnglish.monthNames[monthNameIndex];
		var monthNameShort = dateFormat.i18nEnglish.monthNamesShort[monthNameIndex];
		
		var monthNamePattern;
		
		// add 2nd language
		if (false && workerParams.i18nOtherLang) {
			var monthNameOtherLanguage = workerParams.i18nOtherLang.monthNames[monthNameIndex];
			var monthNameShortOtherLanguage = workerParams.i18nOtherLang.monthNamesShort[monthNameIndex];
			
			monthNamePattern = "(?:" + monthName + "|" + monthNameShort + "\\.?|" + monthNameOtherLanguage + "|" + monthNameShortOtherLanguage + "\\.?)"; //(?:\\.)
		} else {
			monthNamePattern = "(?:" + monthName + "|" + monthNameShort + "\\.?)";
		}
		return monthNamePattern;
	}

	DateTimeHighlighter.init = function() {
		//console.log("init called");
		var timePattern = "(?:at |from )?(\\d+)([:|\\.](\\d\\d))?(?:\\:\\d\\d)?\\s*(a(?:\\.)?m\\.?|p(?:\\.)?m\\.?|h(\\d+)?)?(ish)?";
		var timePatternSolo = "(\\d+)([:|\\.](\\d\\d))?\\s*(a(?:\\.)?m\\.?|p(?:\\.)?m|h(\\d+)?)(ish)?"; // ie. can't just be 10 must be 10PM OR AM

		var dateYearPattern = "(\\d+)(st|nd|rd|th)?(,|, | )(\\d{4})";
		var datePattern = "(\\d+)(st|nd|rd|th)?";
		
		var yearPattern = "(\\d{4})";

		var SEP = "(?:,|, | | on | around )?";
		var TO = "(?: to | untill | till | ?- ?| ?– ?)";

		for (var dayNameIndex=0; dayNameIndex<dateFormat.i18nEnglish.dayNames.length; dayNameIndex++) {
			var dayName = dateFormat.i18nEnglish.dayNames[dayNameIndex];
			var dayNameShort = dateFormat.i18nEnglish.dayNamesShort[dayNameIndex];
			
			var dayNamesSubPattern;
			var periodOfDay;
			
			// add 2nd language
			if (false && workerParams.i18nOtherLang) {
				var dayNameOtherLanguage = workerParams.i18nOtherLang.dayNames[dayNameIndex];
				var dayNameShortOtherLanguage = workerParams.i18nOtherLang.dayNamesShort[dayNameIndex];
				dayNamesSubPattern = "(?:" + dayName + "|" + dayNameShort + "\\.?|" + dayNameOtherLanguage + "|" + dayNameShortOtherLanguage + "\\.?)";
				periodOfDay = "(?: morning| " + workerParams.messages["morning"] + "| night| " + workerParams.messages["night"] + ")?";
			} else {
				dayNamesSubPattern = "(?:" + dayName + "|" + dayNameShort + "\\.?)";
				periodOfDay = "(?: " + getMessage("morning") + "| " + getMessage("night") + ")?"
			}
			
			var dayNamePattern = dayNamesSubPattern + periodOfDay;
			var dayNamePatternSolo = dayNamesSubPattern + periodOfDay;

			for (var monthNameIndex=0; monthNameIndex<dateFormat.i18nEnglish.monthNames.length; monthNameIndex++) {
				var monthNamePattern = getMonthNamePattern(monthNameIndex);

				// day + month + date + year + time (Friday, January 23rd, 2012 2pm - 4pm)
				myDateRegexs.push({pattern:dayNamePattern + SEP + monthNamePattern + SEP + dateYearPattern + SEP + timePattern + TO + timePattern, startTimeOffset:5, endTimeOffset:11, month:monthNameIndex, date:function(pieces, month) {
						var date = new Date();
						date.setMonth(month);
						date.setDate(pieces[1]);
						date.setYear(pieces[4]);
						return date;
					}, allDay:false});

				// day + month + date + year + time (Friday, January 23rd, 2012 at 2pm)
				myDateRegexs.push({pattern:dayNamePattern + SEP + monthNamePattern + SEP + dateYearPattern + SEP + timePattern, startTimeOffset:5, month:monthNameIndex, date:function(pieces, month) {
						var date = new Date();
						date.setMonth(month);
						date.setDate(pieces[1]);
						date.setYear(pieces[4]);
						return date;
					}, allDay:false});

				// day + month + date + time (Friday, January 23rd at 2pm)
				myDateRegexs.push({pattern:dayNamePattern + SEP + monthNamePattern + SEP + datePattern + SEP + timePattern, startTimeOffset:3, month:monthNameIndex, date:function(pieces, month) {
						var date = new Date();
						date.setMonth(month);
						date.setDate(pieces[1]);
						return date;
					}, allDay:false});

				// day + month + date (Friday, January 23rd) ** recent
				myDateRegexs.push({pattern:dayNamePattern + SEP + monthNamePattern + SEP + datePattern, month:monthNameIndex, date:function(pieces, month) {
						var date = new Date();
						date.setMonth(month);
						date.setDate(pieces[1]);
						return date;
					}, allDay:true});

				// day + date + month (Friday, 23 January) ** recent
				myDateRegexs.push({pattern:dayNamePattern + SEP + datePattern + SEP + monthNamePattern, month:monthNameIndex, date:function(pieces, month) {
						var date = new Date();
						date.setMonth(month);
						date.setDate(pieces[1]);
						return date;
					}, allDay:true});

			}
			
			var todayDayIndex = today().getDay();
			var daysAway = dayNameIndex-todayDayIndex;
			if (daysAway < 0) {
				daysAway = 7 + daysAway;
			}

			var date = today();
			date.setDate(date.getDate() + daysAway);
			
			// day + time - time (friday 10-11pm)
			addDayTimeRegex(myDateRegexs, {pattern:dayNamePattern + SEP + timePattern + TO + timePattern, date:date, startTimeOffset:1, endTimeOffset:7, allDay:false});
			
			// day + time (friday 10)
			addDayTimeRegex(myDateRegexs, {pattern:dayNamePattern + SEP + timePattern, date:date, startTimeOffset:1, allDay:false});

			// time + day (10pm friday)
			addDayTimeRegex(myDateRegexs, {pattern:timePattern + SEP + dayNamePattern, date:date, startTimeOffset:1, allDay:false});
			
			// day (friday)
			addDayTimeRegex(myDateRegexs, {pattern:dayNamePatternSolo, date:date, allDay:true});
		}

		for (var monthNameIndex=0; monthNameIndex<dateFormat.i18nEnglish.monthNames.length; monthNameIndex++) {
			var monthNamePattern = getMonthNamePattern(monthNameIndex);

			// April 8, 2012, 4:00pm - 6:00pm
			myDateRegexs.push({pattern:monthNamePattern + SEP + dateYearPattern + SEP + timePattern + TO + timePattern, startTimeOffset:5, endTimeOffset:11, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				date.setYear(pieces[4]);
				return date;
			}, allDay:false});
			
			// April 8, 2012, 4:00pm 
			myDateRegexs.push({pattern:monthNamePattern + SEP + dateYearPattern + SEP + timePattern, startTimeOffset:5, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				date.setYear(pieces[4]);
				return date;
			}, allDay:false});

			// 8 April 2012, 4:00pm 
			myDateRegexs.push({pattern:datePattern + SEP + monthNamePattern + SEP + yearPattern + SEP + timePattern, startTimeOffset:4, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				date.setYear(pieces[3]);
				return date;
			}, allDay:false});

			// April 8, 2012
			myDateRegexs.push({pattern:monthNamePattern + SEP + dateYearPattern, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				date.setYear(pieces[4]);
				return date;
			}, allDay:true});

			// 10 April, 2012 ** recent
			myDateRegexs.push({pattern:datePattern + SEP + monthNamePattern + SEP + yearPattern, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				date.setYear(pieces[3]);
				return date;
			}, allDay:true});

			// April 8, 4:00pm 
			myDateRegexs.push({pattern:monthNamePattern + SEP + datePattern + SEP + timePattern, startTimeOffset:3, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				return date;
			}, allDay:false});

			// April 22 
			myDateRegexs.push({pattern:monthNamePattern + SEP + datePattern, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				return date;
			}, allDay:true});

			// 20 - 22 April
			myDateRegexs.push({pattern:datePattern + TO + datePattern + SEP + monthNamePattern, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				return date;
			}, endDate:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[3]);
				return date;
			}, allDay:true});

			// 22 April
			myDateRegexs.push({pattern:datePattern + SEP + monthNamePattern, month:monthNameIndex, date:function(pieces, month) {
				var date = new Date();
				date.setMonth(month);
				date.setDate(pieces[1]);
				return date;
			}, allDay:true});
		}
		
		var tomorrowPattern;
		if (false && workerParams.i18nOtherLang) {
			tomorrowPattern = "(?:tomorrow|" + workerParams.messages["tomorrow"] + ")";
		} else {
			tomorrowPattern = getMessage("tomorrow");
		}

		myDateRegexs.push({pattern:tomorrowPattern + SEP + timePattern + TO + timePattern, startTimeOffset:1, endTimeOffset:7, date:tomorrow(), allDay:false});
		myDateRegexs.push({pattern:tomorrowPattern + SEP + timePattern, startTimeOffset:1, date:tomorrow(), allDay:false});

		myDateRegexs.push({pattern:timePattern + SEP + tomorrowPattern, startTimeOffset:1, date:tomorrow(), allDay:false});
		myDateRegexs.push({pattern:tomorrowPattern, date:tomorrow(), allDay:true});

		myDateRegexs.push({pattern:timePattern + TO + timePatternSolo, startTimeOffset:1, endTimeOffset:7, date:today(), allDay:false});
		myDateRegexs.push({pattern:timePatternSolo, startTimeOffset:1, date:today(), allDay:false});
	}

	DateTimeHighlighter.highlight = function(originalStr, highlightHandler) {
		if (originalStr) {
			var highlightedText = originalStr;
			var matchCount = 0;
	
			for (var a=0; a<myDateRegexs.length; a++) {
				var regex = new RegExp("\\b" + myDateRegexs[a].pattern + "\\b", "ig");
				var closeToPreviousReplacement = false;
	
				// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace
				highlightedText = highlightedText.replace(regex, function(match, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10) { // match, p1, p2, p3, p#etc..., offset, string
					//log("regex/argss: ", match);
					var matchPosition;
					
					matchPosition = arguments[arguments.length-2];
	
					// make sure not already inside <A>
					var canBeReplaced = true;
					var beforeStr = highlightedText.substring(0, matchPosition);
					var openingTagIndex = beforeStr.lastIndexOf("<a ");
					var closingTagIndex = beforeStr.lastIndexOf("</a>");
					if (openingTagIndex != -1) {
						if (closingTagIndex != -1) {
							if (openingTagIndex < closingTagIndex) {
								// valid
							} else {
								canBeReplaced = false;
							}
						} else {
							canBeReplaced = false;
						}
					} else {
						// valid
					}
	
					if (canBeReplaced) {
						// make sure did NOT match an attribute within a tag ie. <div attr='3PM'>
						var tagNameStart = beforeStr.lastIndexOf("<");
						var tagNameEnd = beforeStr.lastIndexOf(">");
						if (tagNameStart != -1) {
							if (tagNameEnd != -1) {
								if (tagNameStart < tagNameEnd) {
									// valid
								} else {
									canBeReplaced = false;
								}
							} else {
								canBeReplaced = false;
							}
						}
					}
					
					if (!canBeReplaced) {
						return match;
					}
	
					matchCount++;
	
					// got here means wasn't too close to previous replacements
					var startTime;
					var endTime;
	
					if (typeof myDateRegexs[a].date == "function") {
						startTime = myDateRegexs[a].date(arguments, myDateRegexs[a].month);
					} else {
						startTime = myDateRegexs[a].date;
					}
	
					if (typeof myDateRegexs[a].endDate == "function") {
						endTime = myDateRegexs[a].endDate(arguments, myDateRegexs[a].month);
					}
	
					var pieces = arguments;
					//if (pieces && pieces.length >= 6) {
					if (myDateRegexs[a].startTimeOffset != null) {
						startTime = getTime(startTime, pieces, myDateRegexs[a].startTimeOffset);
					}
					if (myDateRegexs[a].endTimeOffset) {
						endTime = getTime(startTime, pieces, myDateRegexs[a].endTimeOffset);
					}
	
					// add starttime ane endtime to object (watch out because mydatereg has "functions" called startDATE and endDATE
					
					myDateRegexs[a].match = match;
					myDateRegexs[a].startTime = startTime;
					myDateRegexs[a].endTime = endTime;
					
					return highlightHandler(myDateRegexs[a]);
				});
			}
	
			// set to highligtext to null so the worker doesn't have to serialized the data transferred
			if (matchCount == 0) {
				highlightedText = null;
			}
			return {highlightedText:highlightedText, matchCount:matchCount};
		} else {
			// null passed so return zero mactchount
			return {matchCount:0};
		}
	}

	DateTimeHighlighter.init();

}

function openTemporaryWindowToRemoveFocus() {
	// open a window to take focus away from notification and there it will close automatically
	var win = globalThis.open("about:blank", "emptyWindow", "width=1, height=1, top=-500, left=-500");
	win.close();
}

function getZoomFactor() {
	return new Promise(function(resolve, reject) {
		if (chrome.tabs && chrome.tabs.getZoomSettings) {
			chrome.tabs.getZoomSettings(function(zoomSettings) {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError.message);
					resolve(globalThis.devicePixelRatio);
				} else {
					resolve(zoomSettings.defaultZoomFactor);
				}
			});
		} else {
			resolve(globalThis.devicePixelRatio);
		}
	});
}

//copy all the fields (not a clone, we are modifying the target so we don't lose a any previous pointer to it
function copyObj(sourceObj, targetObj) {
    for (var key in sourceObj) {
    	targetObj[key] = sourceObj[key];
    }
}

function hasVerticalScrollbar(node, buffer = 0) {
    if (node.scrollHeight > node.clientHeight + buffer) {
        return true;
    } else {
        return false;
    }
}

function saveToLocalFile(blob, filename) {
	return new Promise(function(resolve, reject) {
	    // file-system size with a little buffer
	    var size = blob.size + (1024/2);
	
	    var name = filename.split('.')[0];
	    if (name) {
	        name = name
	            .replace(/^https?:\/\//, '')
	            .replace(/[^A-z0-9]+/g, '-')
	            .replace(/-+/g, '-')
	            .replace(/^[_\-]+/, '')
	            .replace(/[_\-]+$/, '');
	        //name = '-' + name;
	    } else {
	        name = '';
	    }
	    
	    //name = name + '-' + Date.now();
	    
	    if (filename.split('.')[1]) {
	    	name += "." + filename.split('.')[1];
	    }
	
	    function onwriteend() {
		    // filesystem:chrome-extension://fpgjambkpmbhdocbdjocmmoggfpmgkdc/temporary/screencapture-test-png-1442851914126.png
	    	resolve('filesystem:' + getInternalPageProtocol() + '//' + chrome.i18n.getMessage('@@extension_id') + '/temporary/' + name);
	    }
	
	    function errorHandler() {
	        reject();
	    }
	
	    globalThis.webkitRequestFileSystem(globalThis.TEMPORARY, size, function(fs){
	        fs.root.getFile(name, {create: true}, function(fileEntry) {
	            fileEntry.createWriter(function(fileWriter) {
	                fileWriter.onwriteend = onwriteend;
	                fileWriter.write(blob);
	            }, errorHandler);
	        }, errorHandler);
	    }, errorHandler);
	});
}

function blobToArrayBuffer(blob) {
	return new Promise(function(resolve, reject) {
		var fileReader = new FileReader();
		fileReader.onload = function() {
			resolve(this.result);
		};
		fileReader.onabort = fileReader.onerror = function(e) {
			reject(e);
		};
		fileReader.readAsArrayBuffer(blob);
	});
}

function blobToBase64(blob) {
	return new Promise(function(resolve, reject) {
		var fileReader = new FileReader();
		fileReader.onload = function() {
			resolve(this.result);
		};
		fileReader.onabort = fileReader.onerror = function(e) {
			reject(e);
		};
		fileReader.readAsDataURL(blob);
	});
}

// usage: getAllAPIData({oauthForDevices:oAuthForPeople, userEmail:userEmail, url:"https://people.googleapis.com/v1/people/me/connections?pageSize=100&requestMask.includeField=" + encodeURIComponent("person.emailAddresses,person.names"), itemsRootId:"connections"}) 
async function getAllAPIData(params) {
    if (params.pageToken) {
        params.url = setUrlParam(params.url, "pageToken", params.pageToken);
    }

    const responseObj = await params.oauthForDevices.send(params);
    console.log("params, responseObj", params, responseObj)
    if (!params.items) {
        params.items = [];
    }

    if (!params.itemsRootId) {
        throw "itemsRootId is required";
    }

    const moreItems = responseObj[params.itemsRootId];
    if (moreItems) {
        params.items = params.items.concat(moreItems);
    }
    if (responseObj.nextPageToken) {
        params.pageToken = responseObj.nextPageToken;
        return await getAllAPIData(params);
    } else {
        responseObj.email = params.userEmail;
        responseObj.items = params.items;

        if (responseObj.nextSyncToken) {
            responseObj.syncToken = responseObj.nextSyncToken;
        }

        return responseObj;
    }
}

function convertPlainTextToInnerHtml(str) {
	if (str) {
		return str.htmlEntities().replace(/\n/g, "<br/>");
	}
}

function insertScript(url) {
	return new Promise((resolve, reject) => {
		var script = document.createElement('script');
		script.async = true;
		script.src = url;
		script.onload = function (e) {
			resolve(e);
		};
		script.onerror = function (e) {
			reject(`Coud not load script: ${url}`);
		};
		(document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(script);	
	});
}

function insertImport(url, id) {
	return new Promise((resolve, reject) => {
		var link = document.createElement('link');
		if (id) {
			link.id = id;
		}
		link.rel = 'import';
		link.href = url;
		link.onload = function (e) {
			resolve(e);
		};
		link.onerror = function (e) {
			reject(e);
		};
		document.head.appendChild(link);
	});
}

function insertStylesheet(url, id) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        if (id) {
            link.id = id;
        }
        link.rel = 'stylesheet'; 
        link.href = url;
        link.onload = e => {
            resolve(e);
        };
		link.onerror = function (e) {
			reject(`Could not load stylesheet: ${url}`);
		};
        (document.getElementsByTagName('head')[0]||document.getElementsByTagName('body')[0]).appendChild(link);
    });
}

function showMessageNotification(title, message, error, errorType) {
   const options = {
        type: "basic",
        title: title,
        message: message.toString(),
        iconUrl: Icons.NOTIFICATION_ICON_URL,
        priority: 1
   }
   
   var notificationId;
   if (error) {
	   var buttonTitle;
	   
	   if (errorType == "extensionConflict") {
		   notificationId = "extensionConflict";
		   buttonTitle = "Click here to resolve issue";
	   } else if (errorType == "corruptProfile") {
		   notificationId = "corruptProfile";
		   buttonTitle = "Click for a solution";
	   } else {
		   notificationId = "error";
		   buttonTitle = "If this is frequent then click here to report it";
	   }

	   if (supportsNotificationButtons()) {
		   options.contextMessage = "Error: " + error;
		   options.buttons = [{title:buttonTitle}];
	   } else {
		   options.message += " Error: " + error;
	   }
   } else {
	   notificationId = "message";
   }
   
   chrome.notifications.create(notificationId, options, async function(notificationId) {
	   if (chrome.runtime.lastError) {
		   console.error(chrome.runtime.lastError.message);
	   } else {
            if (!error) {
                await sleep(seconds(4));
                chrome.notifications.clear(notificationId);
            }
	   }
   });
}

function showCouldNotCompleteActionNotification(error, extensionConflict) {
	if (extensionConflict) {
		showMessageNotification("Error with last action.", "Try again.", error, "extensionConflict");
	} else {
		showMessageNotification("Error with last action.", "Try again or sign out and in.", error);
	}
}

function getPreferredLanguage() {
	if (navigator.languages?.length) {
		return navigator.languages[0];
	} else {
		return navigator.language;
	}
}

/* 
   From: http://setthebarlow.com/indexeddb/ 
*/

const wrappedDB = {};
wrappedDB.db = null;
wrappedDB.opened = false;

wrappedDB.syncExternally = async function(key) {
	chrome.runtime.sendMessage({command:"indexedDBSettingSaved", key:key});
}

function throwDBError(error) {
    console.error("DB error: ", error);
    const myError = Error("Corrupt browser profile. See solution: https://jasonsavard.com/wiki/Corrupt_browser_profile");
    myError.name = "DBError";
    throw myError;
}

function getObjectStore(storeId, mode) {
    if (wrappedDB.opened === false) {
        throw Error("DB not opened - try reinstalling");
    } else {
        let trans;
        try {
            // using relaxed - might have fixed slow issue and maybe corrupt issue: https://jasonsavard.com/forum/discussion/6104/slow-popup-window/p4
            trans = wrappedDB.db.transaction([storeId], mode, {durability: "relaxed"});
			trans.onabort = function(e) {
                if (e.target.error == "QuotaExceededError") {
                    throw Error("Quota exceeded: Try clearing space on your drive.");
                } else {
                    throw Error("trans abort: " + e.target.error);
                }
			};
        } catch (error) {
            throwDBError(error);
        }
        return trans.objectStore(storeId);
    }
}

wrappedDB.open = function(dbName, storeId) {
	return new Promise((resolve, reject) => {
        
		function createObjectStore(db) {
			return new Promise((resolve, reject) => {
				if (db.objectStoreNames.contains(storeId)) {
					console.log("delete object store");
					db.deleteObjectStore(storeId);
				}
				console.log("creating object store");
				const objectStore = db.createObjectStore(storeId, {keyPath: "key"}); // Create unique identifier for store
				console.log("objectStore", objectStore)

				objectStore.transaction.oncomplete = function() {
					console.log("object store oncomplete");
					wrappedDB.db = db;
					wrappedDB.opened = true;		
					resolve();
				}
				objectStore.transaction.onerror = function(e) {
					const error = "Error in creating object store: " + objectStore.transaction.error;
					logError(error);
					reject(error);
				}			
			});
		}
        
        try {
            const request = indexedDB.open(dbName);
            //throw Error("Simulate corrupt indexeddb error");
            
            request.onsuccess = function(e) {
                wrappedDB.db = e.target.result;
                wrappedDB.opened = true;
                resolve();
            };
    
            request.onupgradeneeded = function (e) {
                console.log("onupgradeneeded: " + storeId);
                const db = e.target.result;
                createObjectStore(db).then(() => {
                    resolve();
                }).catch(error => {
                    reject(error);
                });
            };
    
            request.onblocked = function(e) {
                reject("Database version can't be upgraded because it's open somewhere else. " + e.target.error);
            };		
            
            request.onerror = function(e) {
                reject(e.target.error);
            };
        } catch (error) {
            throwDBError(error);
        }
	});
}

wrappedDB.putObject = function(storeId, key, value) {
	return new Promise((resolve, reject) => {
        const store = getObjectStore(storeId, "readwrite");
        const request = store.put({
            "key": key,
            "value": value
        });
        request.onsuccess = async function(e) {
            await wrappedDB.syncExternally(key);
            resolve();
        };
        request.onerror = function(e) {
            var error = "Error storing object with key: " + key + " " + e.target.error;
            logError(error);
            reject(error);
        };
    });
};
 
wrappedDB.deleteSetting = function(storeId, key) {
	return new Promise((resolve, reject) => {
        const store = getObjectStore(storeId, "readwrite");
        const request = store.delete(key);
        request.onsuccess = async function(e) {
            await wrappedDB.syncExternally(key);
            resolve();
        };
        request.onerror = function(e) {
            var error = "Error deleting object with key: " + key + " " + e.target.error;
            logError(error);
            reject(error);
        };
	});
};
 
wrappedDB.readAllObjects = function(storeId) {
	return new Promise((resolve, reject) => {
        const store = getObjectStore(storeId, "readonly");
        store.getAll().onsuccess = function(event) {
            resolve(event.target.result);
        };
	});
};

wrappedDB.readObject = function(storeId, key) {
	return new Promise((resolve, reject) => {
        const store = getObjectStore(storeId, "readonly");
        const request = store.get(key);
        request.onsuccess = function(e) {
            if (this.result) {
                resolve(this.result.value);
            } else {
                resolve();
            }
        };
        request.onerror = function(e) {
            var error = "Error reading object with key: " + key + " " + e.target.error;
            logError(error);
            reject(error);
        };
	});
};

function IndexedDBStorage() {
    var that = this;
    let cachedItems;

    //var cache;
    var storeId = "settings";
    this.loaded = false;

    /*
    async function loadFromDB() {
        const response = await wrappedDB.readAllObjects(storeId);
        cache = {};
        if (response) {
            response.forEach(obj => {
                cache[obj.key] = obj.value;
            });
        }
    }
    */

    this.getStoreId = function () {
        return storeId;
    };

    this.clearCache = function () {
        console.log("fail safe remove cache (manually)")
        cachedItems = null;
    }

    async function getItem(key, value) {
        if (value === undefined) {
            const defaultForOauth = that.defaultsForOauth[key];
            if (defaultForOauth != undefined && await that.get("accountAddingMethod") == "oauth") {
                value = defaultForOauth;
            } else {
                value = that.defaults[key];
            }
        }

        try {
            Object.freeze(value);
        } catch (error) {
            if (value instanceof Uint8Array) { // key == "_aesGcmIv"
                //console.log("ignore", key);
            } else {
                console.warn("Problem freezing", key, value);
            }
        }

        return value;
    }

    this.get = async key => {
        if (cachedItems) {
            // one issue that occurs with cachedItems is since we are not cloning the objects stored/retreived then they can cause issues ie. accounts[].mails
            //console.log("from cache: " + key);
            return getItem(key, cachedItems[key]);
        } else {
            //console.log("raw: " + key)
            const value = await wrappedDB.readObject(storeId, key);
            return getItem(key, value);
        }
    };

    this.getRaw = async key => {
        return await wrappedDB.readObject(storeId, key);
    };

    this.set = function (key, value) {
        if (cachedItems) {
            cachedItems[key] = value;
        }
        return wrappedDB.putObject(storeId, key, value);
    };

    this.setEncryptedObj = async function (key, value, replacer = null) {
        const encryptedObj = await Encryption.encryptObj(value, replacer);
        return that.set(key, encryptedObj);
    };

    this.getEncryptedObj = async function(key, reviver = null) {
        const value = await that.get(key);
        try {
            return await Encryption.decryptObj(value, reviver);
        } catch (error) {
            console.log("Use default value probably not enc or first time");
            return that.defaults[key];
        }
    }

    this.enable = function (key) {
        return that.set(key, true);
    };

    this.disable = function (key) {
        return that.set(key, false);
    };

    this.setDate = function (key) {
        return that.set(key, new Date());
    };

    this.firstTime = function (key) {
        if (that.get("_" + key)) {
            return false;
        } else {
            that.setDate("_" + key);
            return true;
        }
    };

    this.remove = function (key) {
        // remove it from indexeddb
        if (cachedItems) {
            delete cachedItems[key];
        }
        return wrappedDB.deleteSetting(storeId, key);
    };

    this.init = function () {
        console.log("storage.init()");

        if (that.loaded) {
            console.log("storage already loaded, ignoring init");
        } else {
            this.defaults = DEFAULT_SETTINGS;
            this.defaultsForOauth = {
                // should use await supportsRealtime instead, but didn't want the lag - so using isChromium && !DetectClient.isEdge() logic
                "poll": DetectClient.isChromium() && !DetectClient.isEdge() ? "realtime" : seconds(30)
            };
    
            var DBNAME = "MCP_DB";
    
            return wrappedDB.open(DBNAME, storeId).then(async () => {
                // nothing

                if (globalThis.location?.href?.includes("popup.html") && globalThis.localStorage?.["cacheIndexedDB"] != "false") {
                    const response = await wrappedDB.readAllObjects(storeId);
                    if (response) {
                        cachedItems = {};
                        response.forEach(obj => {
                            if (obj) {
                                cachedItems[obj.key] = obj.value;
                            } else {
                                console.warn("obj is null in readAllObjects");
                            }
                        });
                    }
            
                    // as a fail safe I remove the cache after a 2 seconds
                    setTimeout(() => {
                        if (cachedItems) {
                            console.log("fail safe remove cache")
                            cachedItems = null;
                        }
                    }, seconds(2));
                }

                that.loaded = true;
            }, error => { // note: this is a onRejected else
                console.error(error);
                showMessageNotification("Corrupted profile", "Click for more info", error, "corruptProfile");
                throw error;
            });
        }
    };
}

var storage = new IndexedDBStorage();

async function getInstanceToken() {
    return new Promise((resolve, reject) => {
        if (chrome.instanceID) {
            chrome.instanceID.getToken({
                authorizedEntity: GCM_SENDER_ID,
                scope: "GCM"
            }, async token => {
                clearTimeout(globalThis.instanceIdTimeout);
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    reject(chrome.runtime.lastError.message);
                } else {
                    console.log("token", token);
                    resolve(token);
                }
            });
            
            // seems Brave browser doesn't respond to success or failure
            globalThis.instanceIdTimeout = setTimeout(() => {
                const error = new Error("instanceID not responding");
                reject(error);
            }, seconds(2));
        } else {
            const error = new Error("GCM not supported");
            console.warn(error);
            reject(error);
        }
    });
}

async function ensureGCMRegistration() {
    const registrationId = await storage.get("registrationId");
    if (registrationId) {
        console.log("reusing gcm regid");
        return registrationId;
    } else {
        const token = await getInstanceToken();
        await storage.set("registrationId", token);
        return token;
    }
}

function removeCachedAuthToken(token) {
	return new Promise((resolve, reject) => {
        if (chrome.identity) {
            chrome.identity.removeCachedAuthToken({ token: token }, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                } else {
                    resolve();
                }
            });
        } else {
            resolve();
        }
	});
}

//syntax: alwaysPromise(Promise)
//syntax: alwaysPromies(Promise[])
function alwaysPromise(promises) {
	return new Promise((resolve, reject) => {
        var successfulPromises = [];
        var failedPromises = [];

        // if param is single promise then push it into an array
        if (typeof promises.then == 'function') {
        	promises = [promises];
        }
        
        function checkIfAllComplete() {
        	if (successfulPromises.length + failedPromises.length == promises.length) {
               	resolve({successful:successfulPromises, failures:failedPromises});
            }
        }
        
        if (promises.length) {
            promises.forEach(promise => {
                promise.then(response => {
                    successfulPromises.push(response);
                    checkIfAllComplete();
                }).catch(error => {
                    failedPromises.push(error);
                    checkIfAllComplete();
                });
            });        
        } else {
        	checkIfAllComplete();
        }
    });
}


var HAS_NEW_MOUSE = (function () {
	var has = false;
	try {
		has = Boolean(new MouseEvent('x'));
	} catch (_) { }
	return has;
})();

/**
   * Fires a mouse event on a specific node, at a given set of coordinates.
   * This event bubbles and is cancellable.
   *
   * @param {string} type The type of mouse event (such as 'tap' or 'down').
   * @param {{ x: number, y: number }} xy The (x,y) coordinates the mouse event should be fired from.
   * @param {!Element} node The node to fire the event on.
   */
function makeMouseEvent(type, xy, node) {
	var props = {
		bubbles: true,
		cancelable: true,
		clientX: xy.x,
		clientY: xy.y,
		// Allow event to go outside a ShadowRoot.
		composed: true,
		// Make this a primary input.
		buttons: 1 // http://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
	};
	var e;
	if (HAS_NEW_MOUSE) {
		e = new MouseEvent(type, props);
	} else {
		e = document.createEvent('MouseEvent');
		e.initMouseEvent(
			type, props.bubbles, props.cancelable,
			null, /* view */
			null, /* detail */
			0,    /* screenX */
			0,    /* screenY */
			props.clientX, props.clientY,
			false, /*ctrlKey */
			false, /*altKey */
			false, /*shiftKey */
			false, /*metaKey */
			0,     /*button */
			null   /*relatedTarget*/);
	}
	node.dispatchEvent(e);
}

function getDataUrl(canvas) {
	return new Promise(async (resolve, reject) => {
		if ('toDataURL' in canvas) { // regular canvas element
			resolve(canvas.toDataURL());
		} else { // OffscreenCanvas
			const blob = await canvas.convertToBlob();
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				resolve(reader.result);
			});
			reader.addEventListener('error', error => {
				reject(error);
			});
			reader.readAsDataURL(blob);
		}
	});
}

function getPopupWindow() {
    return chrome.extension.getViews().find(thisWindow => {
        return thisWindow.location.href.includes("popup.html");
    });
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

function isEmptyObject(obj) {
    return Object.entries(obj).length === 0 && obj.constructor === Object;
}

function supportsChromeSignIn() {
    if (DetectClient.isFirefox() || DetectClient.isEdge()) {
        return false;
    } else {
        return true;
    }
}

async function supportsRealtime() {
    try {
        const token = await getInstanceToken();
        if (token) {
            return token;
        }
    } catch (error) {
        console.warn("could not get instancetoken", error);
    }

    return false;
}

function supportsNotificationButtons() {
    return DetectClient.isChromium();
}

class Encryption {

    static async generateAesGcmParams() {
        let iv = await storage.get(this.IV_STORAGE_KEY);
        if (!iv) {
            iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
            storage.set(this.IV_STORAGE_KEY, iv);
        }
        return {
            name: this.ALGORITHM,
            iv: iv
        }
    }

    static async generateAndExportKey() {
        const key = await globalThis.crypto.subtle.generateKey(
            {
                name: this.ALGORITHM,
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        )

        const exportedKey = await globalThis.crypto.subtle.exportKey(
            this.KEY_FORMAT,
            key
        );
        await storage.set(this.EXPORTED_STORAGE_KEY, exportedKey);
        return key;
    }
    
    static async getAesGcmKey() {
        const exportedKey = await storage.get(this.EXPORTED_STORAGE_KEY);
        let key;
        if (exportedKey) {
            try {
                key = await globalThis.crypto.subtle.importKey(
                    this.KEY_FORMAT,
                    exportedKey,
                    this.ALGORITHM,
                    true,
                    ["encrypt", "decrypt"]
                );
            } catch (error) {
                console.warn("Problem importing key so recreating it: ", error);
                key = await this.generateAndExportKey();
            }
        } else {
            key = await this.generateAndExportKey();
        }
    
        return key;
    }
    
    static async encrypt(message) {
        const enc = new TextEncoder();
        const encoded = enc.encode(message);

        return globalThis.crypto.subtle.encrypt(
            await this.generateAesGcmParams(),
            await this.getAesGcmKey(),
            encoded
        );
    }

    static async encryptObj(obj, replacer) {
        const message = JSON.stringify(obj, replacer);
        return Encryption.encrypt(message);
    }

    static async decrypt(ciphertext) {
        if (await storage.get(this.EXPORTED_STORAGE_KEY)) {
            const aes = await this.generateAesGcmParams();
            const aeskey = await this.getAesGcmKey();
            const decrypted = await globalThis.crypto.subtle.decrypt(
                aes,
                aeskey,
                ciphertext
            );
            const dec = new TextDecoder();
            const decoded = dec.decode(decrypted)
            return decoded;
        } else {
            throw Error("Encryption keys not present - might be first install or restored options");
        }
    }

    static async decryptObj(ciphertext, reviver) {
        const obj = await Encryption.decrypt(ciphertext);
        return JSON.parse(obj, reviver);
    }
}

Encryption.ALGORITHM = "AES-GCM";
Encryption.KEY_FORMAT = "raw";
Encryption.IV_STORAGE_KEY = "_aesGcmIv"; // must start with _ to be ignored by sync because it's a type "Uint8Array" that can't be sycned properly
Encryption.EXPORTED_STORAGE_KEY = "_aesGcmExportedKey";

async function getImageBitmapFromUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return createImageBitmap(blob);
}

function isColorTooLight(color, luminosity) {
    if (color == "black") {
        return false;
    } else if (color == "white") {
        return true;
    }

	let rgb = hexToRgb(color);
	if (rgb) {
		let l = rgbToHsl(rgb[0], rgb[1], rgb[2])[2];

        if (luminosity) {
            if (l >= luminosity) {
                return true;
            }
        } else {
            let isYellow = rgb[0] == 255 && rgb[1] == 253 && rgb[2] == 33; // refer to https://jasonsavard.com/forum/discussion/comment/19187#Comment_19187
            if (l >= 0.85 || isYellow) {
                return true;
            }
        }
	}
}

function hexToRgb(hex) {
	var c;
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length == 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c = '0x' + c.join('');
		return [(c >> 16) & 255, (c >> 8) & 255, c & 255];
	}
	//throw new Error('Bad Hex: ' + hex);
}

function rgbToHsv(r, g, b) {
	r /= 255, g /= 255, b /= 255;

	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, v = max;

	var d = max - min;
	s = max == 0 ? 0 : d / max;

	if (max == min) {
		h = 0; // achromatic
	} else {
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return [h, s, v];
}

function rgbToHsl(r, g, b) {
	r /= 255, g /= 255, b /= 255;
	var max = Math.max(r, g, b), min = Math.min(r, g, b);
	var h, s, l = (max + min) / 2;

	if (max == min) {
		h = s = 0; // achromatic
	} else {
		var d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}
		h /= 6;
	}

	return [h, s, l];
}

async function getCenterWindowPosition(width, height) {
    const position = {};

    if (chrome.system?.display?.getInfo) {
        const screens = await new Promise((resolve, reject) => {
            chrome.system.display.getInfo(screens => {
                resolve(screens);
            })
        });
        const screen = screens.find(screen => screen.isPrimary);

        position.left = (screen.bounds.width - width) / 2;
        position.top = (screen.bounds.height - height) / 2;

        position.availLeft = screen.bounds.left;
        position.availTop = screen.bounds.top;
    } else if (globalThis.screen) {
        position.left = (globalThis.screen.width - width) / 2;
        position.top = (globalThis.screen.height - height) / 2;

        position.availLeft = globalThis.screen.availLeft;
        position.availTop = globalThis.screen.availTop;
    } else {
        position.left = 400;
        position.top = 300;

        position.availLeft = 0;
        position.availTop = 0;
    }

    position.left = Math.round(position.left);
    position.top = Math.round(position.top);

    position.availLeft &&= Math.round(position.availLeft);
    position.availTop &&= Math.round(position.availTop);

    return position;
}

// patch for issue on Linux when setting left/top outside of window - solution remove top/left settings, error: Invalid value for bounds. Bounds must be at least 50% within visible screen space.
function createWindow(params) {
    return new Promise((resolve, reject) => {
        chrome.windows.create(params, newWindow => {
            if (chrome.runtime.lastError) {
                const safeParams = shallowClone(params);
                delete safeParams.top;
                delete safeParams.left;
                chrome.windows.create(safeParams, newWindow => {
                    resolve(newWindow);
                });
            } else {
                resolve(newWindow);
            }
        });
    });
}

function generateRandomAlarmDelay() {
    const minHours = 2; // Minimum number of hours
    const maxHours = 8; // Maximum number of hours
  
    // Convert hours to minutes
    const minMinutes = minHours * 60;
    const maxMinutes = maxHours * 60;
  
    // Generate a random number of minutes between minMinutes and maxMinutes
    const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
  
    return randomMinutes;
}