/// <reference path="interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    let Plugins;
    (function (Plugins) {
        Plugins.ViewModel = [];
        Plugins.Background = [];
    })(Plugins = UrlEditor.Plugins || (UrlEditor.Plugins = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/shared.ts" />
var UrlEditor;
(function (UrlEditor) {
    const AutoRefreshType = "AutoRefresh";
    const RefreshPageEveryXLabel = "Refresh this page every 30s";
    const StopRefreshingLabel = "Stop refreshing";
    /**
     * Contains logic responsible for triggering reloads/refresh
     */
    class RefreshBackgroundProcessor {
        constructor(settings, background) {
            this.background = background;
            this.tabRefreshMap = {};
            this.counterEnabled = true;
            // add default "Refresh every ..."
            this.addDefaultContextMenuItem();
            // listening for messages from view model
            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => {
                if (msgData.type != AutoRefreshType) {
                    return;
                }
                switch (msgData.command) {
                    case "setInterval":
                        if (msgData.interval === undefined) {
                            throw new Error("AutoRefresh: interval missing in message data");
                        }
                        if (msgData.tabId === undefined) {
                            throw new Error("AutoRefresh: tabId missing in message data");
                        }
                        this.setRefreshIntervalForTab(msgData.tabId, msgData.interval);
                        break;
                    case "getCurrentTabRefreshData":
                        sendResponse(this.tabRefreshMap[msgData.tabId]);
                        break;
                }
            });
        }
        /**
         * Adds "Refresh every..." context menu item
         */
        addDefaultContextMenuItem() {
            this.background.addActionContextMenuItem({
                group: AutoRefreshType,
                label: RefreshPageEveryXLabel,
                clickHandler: (info, tab) => { this.setRefreshIntervalForTab(tab.id, 30); },
                isEnabled: tab => !this.tabRefreshMap[tab.id]
            });
        }
        /**
         * Sets refresh interval for given tab
         * @param tabId Tab id
         * @param interval Interval value in seconds
         */
        setRefreshIntervalForTab(tabId, interval) {
            // check if we should disable refresh
            if (interval == 0) {
                // cleaning up
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId].intervalHandle);
                delete this.tabRefreshMap[tabId];
                this.background.removeActionContextMenuItem(AutoRefreshType, StopRefreshingLabel, tabId);
                chrome.browserAction.setBadgeText({ text: "", tabId: tabId });
                // clear counter interval (for updating badge) only if no other refresh is setup
                if (Object.keys(this.tabRefreshMap).length == 0) {
                    clearInterval(this.counterInterval);
                    this.counterInterval = null;
                }
            }
            else {
                // clear previous if exists
                this.tabRefreshMap[tabId] && clearInterval(this.tabRefreshMap[tabId].intervalHandle);
                this.tabRefreshMap[tabId] = {
                    intervalHandle: setInterval((() => this.refreshTab(tabId)), interval * 1000),
                    interval: interval,
                    lastRefresh: Date.now()
                };
                // add menu item for stopping refreshing
                this.background.addActionContextMenuItem({
                    group: AutoRefreshType,
                    label: StopRefreshingLabel,
                    clickHandler: () => this.setRefreshIntervalForTab(tabId, 0),
                    tabId: tabId
                });
                if (this.counterEnabled) {
                    // we set one global counter for all the active tabs which are refreshing
                    if (!this.counterInterval) {
                        this.counterInterval = setInterval((() => this.updateCounter()), 1000);
                    }
                }
                else {
                    // set static badge "R"
                    this.setBadgeText(tabId);
                }
            }
        }
        /**
         * Sets badge text
         * @param tabId Tab id
         * @param text Badge text (default "R")
         */
        setBadgeText(tabId, text = "R") {
            // set badge if text is not static one or when counter is disabled
            if (text != "R" || !this.counterEnabled) {
                chrome.browserAction.setBadgeText({ tabId: tabId, text: text });
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: "green" });
            }
        }
        /**
         * Updates badge counter
         */
        updateCounter() {
            UrlEditor.Helpers.getActiveTab(tab => {
                let refreshData = this.tabRefreshMap[tab.id];
                // check if we are refreshing current tab
                if (refreshData) {
                    let remainingSecs = refreshData.interval - Math.floor((Date.now() - refreshData.lastRefresh) / 1000);
                    this.setBadgeText(tab.id, this.getHumanReadableTime(remainingSecs));
                }
            });
        }
        /**
         * Converts seconds to shorter format (with units)
         * @param secs Seconds to convert
         */
        getHumanReadableTime(secs) {
            const timeUnits = ["s", "m", "h", "d"];
            const timeValues = [60, 60, 24];
            let unit = 0;
            while (unit < timeValues.length && secs > timeValues[unit]) {
                secs = Math.floor(secs / timeValues[unit]);
                unit++;
            }
            return secs + timeUnits[unit];
        }
        /**
         * Refreshes/reloads tab.
         * @param tabId Tab id
         */
        refreshTab(tabId) {
            this.tabRefreshMap[tabId].lastRefresh = Date.now();
            // get current tab - refresh only if matches? setting?
            UrlEditor.Helpers.getActiveTab(tab => {
                if (tab && tab.id == tabId) {
                    chrome.tabs.reload(tabId);
                    this.setBadgeText(tabId);
                }
            });
        }
    }
    UrlEditor.RefreshBackgroundProcessor = RefreshBackgroundProcessor;
    /**
     * Contains logic related to plugin UI
     */
    class RefreshViewModel {
        constructor(settings, viewModel) {
            let button = UrlEditor.Helpers.ge("set_refresh_interval");
            let valueTextBox = button.previousElementSibling;
            button.addEventListener("click", () => {
                if (button.value == "Stop") {
                    this.setRefreshInterval("0");
                    button.value = "Start";
                    valueTextBox.disabled = false;
                }
                else {
                    this.setRefreshInterval(valueTextBox.value);
                    button.value = "Stop";
                    valueTextBox.disabled = true;
                }
                this.hideOptionsModule();
            });
            // set button text
            UrlEditor.Helpers.getActiveTab(tab => {
                chrome.runtime.sendMessage({ type: AutoRefreshType, command: "getCurrentTabRefreshData", tabId: tab.id }, (data) => {
                    if (data) {
                        button.value = "Stop";
                        valueTextBox.value = data.interval + "s";
                    }
                    valueTextBox.disabled = !!data;
                });
            });
        }
        /**
         * Converts time value (e.g. 1m, 10h) to seconds and posts message to processor
         * @param val Time value
         */
        setRefreshInterval(val) {
            // treat empty string as disable
            val = val || "0";
            let parsed = val.match(RefreshViewModel.TimePattern);
            if (!parsed) {
                // TODO: message about wrong format
                return;
            }
            let secs = parseInt(parsed[1]);
            switch (parsed[2]) {
                case "d":
                    secs *= 60 * 60 * 24;
                    break;
                case "h":
                    secs *= 60 * 60;
                    break;
                case "m":
                    secs *= 60;
                    break;
            }
            UrlEditor.Helpers.getActiveTab(tab => {
                chrome.runtime.sendMessage({ type: AutoRefreshType, command: "setInterval", tabId: tab.id, interval: secs });
            });
        }
        hideOptionsModule() {
            // hide page options module
            UrlEditor.Helpers.ge("options_menu_check").checked = false;
            // show list of options
            UrlEditor.Helpers.ge("options_list").checked = true;
        }
    }
    RefreshViewModel.TimePattern = /([0-9]+)(s|m|h|d)?/i;
    UrlEditor.RefreshViewModel = RefreshViewModel;
    // register plugins
    UrlEditor.Plugins.ViewModel.push(RefreshViewModel);
    UrlEditor.Plugins.Background.push(RefreshBackgroundProcessor);
})(UrlEditor || (UrlEditor = {}));
var UrlEditor;
(function (UrlEditor) {
    var storageCache = {};
    class Settings {
        constructor(storage) {
            /**
            * Current borwser action icon
            */
            this.icon = "img/edit.png";
            /**
            * Whether to hide action pane after submission
            */
            this.autoHide = true;
            /**
            * Whether to sort parameters automatically
            */
            this.autoSortParams = false;
            /**
             * Whether to select value on focus change
             */
            this.autoSelectValue = true;
            /**
             * Whether to jump to value field on equal character in param name field
             */
            this.autoJumpToValueOnEqual = true;
            /**
            * Whether to show parameter suggestions
            */
            this.autoSuggest = true;
            /**
            * Whether to save new parameters to suggest them in the future
            */
            this.autoSuggestSaveNew = true;
            /**
            * Whether to save new parameters when on incognito mode
            */
            this.autoSuggestEnabledOnIncognito = false;
            /**
            * Whether to turn on tracking user events
            */
            this.trackingEnabled = true;
            /**
            * Params suggestion data. We keep it as a string to prevent from parsing it on the initialization.
            */
            this.autoSuggestData = '{}';
            /**
             * Redirection rules. We keep it as a string to prevent from parsing it on the initialization.
             */
            this.redirectionRules = '{}';
            /**
             * Debug mode
             */
            this.debugMode = false;
            storageCache = storage;
            Object.keys(this).forEach(key => {
                // check if property is not inherited
                if (this.hasOwnProperty(key) &&
                    // check if someone is not trying to overwrite function
                    name != "saveValue" &&
                    // check if it is defined on storage already
                    storage[key] != undefined) {
                    // all the values in WebStorage are strings if the original value is not a string it means that we need to parse
                    this[key] = typeof this[key] == "string" ? storage[key] : JSON.parse(storage[key]);
                }
            });
        }
        setValue(name, value) {
            // check if name is valid
            if (name == "saveValue" || !this.hasOwnProperty(name)) {
                throw "Invalid setting name";
            }
            // save value in storage (note that WebStorage can only store strings
            storageCache[name] = typeof this[name] == "string" ? value : JSON.stringify(value);
            // update value in the current object
            this[name] = value;
        }
    }
    UrlEditor.Settings = Settings;
})(UrlEditor || (UrlEditor = {}));
// Seems to be the fastest way to replace all occurances of a string in a string
// http://jsperf.com/htmlencoderegex/25
String.prototype.replaceAll = function (searchValue, replaceValue, ignoreCase) {
    return this.replace(new RegExp(searchValue.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"), (ignoreCase ? "gi" : "g")), (typeof (replaceValue) == "string") ? replaceValue.replace(/\$/g, "$$$$") : replaceValue);
};
String.prototype.htmlEncode = function () {
    return this.replaceAll("&", "&amp;").replace("\"", "&quot;").replace("'", "&#39;").replace("<", "&lt;").replace(">", "&gt;");
};
var UrlEditor;
(function (UrlEditor) {
    class Command {
    }
    Command.GoToHomepage = "GoToHomepage";
    Command.RedirectUseFirstRule = "RedirectUseFirstRule";
    Command.ReloadRedirectionRules = "ReloadRedirectionRules";
    UrlEditor.Command = Command;
})(UrlEditor || (UrlEditor = {}));
(function (UrlEditor) {
    var Helpers;
    (function (Helpers) {
        var base64Pattern = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/;
        /**
         * It iterates over previous siblings and counts elements of given tag names (types)
         */
        function getIndexOfSiblingGivenType(elem, types) {
            var index = 0;
            for (var i = 0; elem = elem.previousElementSibling;) {
                if (types.indexOf(elem.tagName) != -1) {
                    index++;
                }
            }
            return index;
        }
        Helpers.getIndexOfSiblingGivenType = getIndexOfSiblingGivenType;
        /**
         * Returns element in the same column as the given one (grid layout)
         */
        function findNthElementOfType(container, types, index) {
            var elementsFound = 0;
            var lastFound = null;
            for (var i = 0, child; child = container.children[i++];) {
                if (types.indexOf(child.tagName) != -1) {
                    if (elementsFound == index) {
                        return child;
                    }
                    lastFound = child;
                    elementsFound++;
                }
            }
            return lastFound;
        }
        Helpers.findNthElementOfType = findNthElementOfType;
        /**
         * Wrapper for document.getElementById
         */
        function ge(elementId) {
            return document.getElementById(elementId);
        }
        Helpers.ge = ge;
        /**
         * Wrapper for document.getElementById
         */
        function find(selector, root = document) {
            return root.querySelectorAll(selector);
        }
        Helpers.find = find;
        /**
         * Encodes given string with Base64 algorythm
         */
        function b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt("0x" + p1))));
        }
        Helpers.b64EncodeUnicode = b64EncodeUnicode;
        /**
         * Decodes string using Base64 algorythm
         */
        function b64DecodeUnicode(str) {
            return safeExecute(() => decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')), "b64DecodeUnicode/decodeURI");
        }
        Helpers.b64DecodeUnicode = b64DecodeUnicode;
        /**
         * Checks if given string can be Base64 encoded
         */
        function isBase64Encoded(val) {
            // TODO whenever test passes we can try to decode and check if there are only valid string chars
            return base64Pattern.test(val);
        }
        Helpers.isBase64Encoded = isBase64Encoded;
        function isTextFieldActive() {
            return isTextField(document.activeElement);
        }
        Helpers.isTextFieldActive = isTextFieldActive;
        function isTextField(elem) {
            // check if tag is an INPUT or TEXTAREA, additionally check if the INPUT type is text
            return (elem.tagName == "INPUT" && elem.type == "text") ||
                (elem.tagName == "DIV" && elem.id == "full_url");
        }
        Helpers.isTextField = isTextField;
        /**
         * Encodes query parameters/components
         *
         * Should be used as a replacement for encodeURIComponent
         */
        function encodeQueryParameter(queryParam) {
            // encodeURIComponent doesn't correcly encode all characters required by RFC 3986
            // reference: http://stackoverflow.com/questions/18251399/why-doesnt-encodeuricomponent-encode-single-quotes-apostrophes
            // additionaly, for query parameters it's allowed to use + instead of to %20, which gives a nicer looking URL
            // %20 is only required when encoding in the path part of the URL, not the query part of the URL
            // reference: http://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
            return encodeURIComponent(queryParam).replace(/[!'()*]/g, escape).replace(/%20/g, "+");
        }
        Helpers.encodeQueryParameter = encodeQueryParameter;
        function ensureIsVisible(elem, container, containerHeight) {
            var containerScrollTop = container.scrollTop;
            var suggestionElemOffsetTop = elem.offsetTop;
            var offsetBottom = suggestionElemOffsetTop + elem.offsetHeight;
            if (offsetBottom > containerScrollTop + containerHeight) {
                container.scrollTop = offsetBottom - containerHeight;
            }
            else if (suggestionElemOffsetTop < containerScrollTop) {
                container.scrollTop = suggestionElemOffsetTop;
            }
        }
        Helpers.ensureIsVisible = ensureIsVisible;
        function safeExecute(delegate, description) {
            try {
                return delegate();
            }
            catch (e) {
                Helpers.log(`[${description || "error"}] ${e.message || e}`);
            }
        }
        Helpers.safeExecute = safeExecute;
        function getActiveTab(callback) {
            chrome.tabs.query({ currentWindow: true, active: true }, tabs => tabs[0] && callback(tabs[0]));
        }
        Helpers.getActiveTab = getActiveTab;
        Helpers.log = lazyInit(logInitializer);
        function logInitializer() {
            let logElem = ge("log");
            let addNewLine = false;
            return (msg) => {
                if (logElem) {
                    logElem.textContent += (addNewLine ? "\n" : "") + msg;
                }
                console.warn(msg);
                addNewLine = true;
            };
        }
        function lazyInit(func) {
            let initializedFunc;
            return ((...args) => {
                if (!initializedFunc) {
                    initializedFunc = func();
                }
                return initializedFunc.apply(this, args);
            });
        }
    })(Helpers = UrlEditor.Helpers || (UrlEditor.Helpers = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../../../typings/index.d.ts" />
/// <reference path="helpers.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Tracking;
    (function (Tracking) {
        let Category;
        (function (Category) {
            Category[Category["AddParam"] = 0] = "AddParam";
            Category[Category["RemoveParam"] = 1] = "RemoveParam";
            Category[Category["Navigate"] = 2] = "Navigate";
            Category[Category["Encoding"] = 3] = "Encoding";
            Category[Category["AutoSuggest"] = 4] = "AutoSuggest";
            Category[Category["Settings"] = 5] = "Settings";
            Category[Category["Submit"] = 6] = "Submit";
            Category[Category["Sort"] = 7] = "Sort";
            Category[Category["Redirect"] = 8] = "Redirect";
        })(Category = Tracking.Category || (Tracking.Category = {}));
        class Dimension {
        }
        Dimension.Version = "dimension1";
        Tracking.Dimension = Dimension;
        var enableLogOncePerSession = true;
        var trackingEnabled = true;
        var logOncePerSession = {};
        // create global analytics object
        (function internalInit(hostObject, propertyName) {
            hostObject["GoogleAnalyticsObject"] = propertyName;
            hostObject[propertyName] = hostObject[propertyName] || function () {
                (hostObject[propertyName].q = hostObject[propertyName].q || []).push(arguments);
            };
            hostObject[propertyName].l = 1 * new Date();
        })(window, "ga");
        // initial tracking variavles setup
        ga("create", "UA-81916828-1", "auto");
        ga("set", "checkProtocolTask", null); // Disables file protocol checking.
        function init(_trackingEnabled, page, logEventsOnce = true, appVersion = "") {
            trackingEnabled = _trackingEnabled;
            enableLogOncePerSession = logEventsOnce;
            if (!trackingEnabled) {
                return;
            }
            // load Analytics library
            var a = document.createElement("script");
            a.async = true;
            a.src = "https://www.google-analytics.com/analytics.js";
            var m = document.getElementsByTagName("script")[0];
            m.parentNode.insertBefore(a, m);
            ga("send", "pageview", page);
            window.addEventListener("error", err => {
                let file = err.filename || "";
                // remove extension schema and id: chrome-extension://XXXXXXXXX/
                file = file.substr(Math.max(0, file.indexOf("/", 20)));
                if (appVersion) {
                    appVersion = "[" + appVersion + "]";
                }
                ga("send", "exception", { "exDescription": `[${file}:${err.lineno}]${appVersion} ${err.message}` });
            });
        }
        Tracking.init = init;
        function setCustomDimension(name, value) {
            ga("set", name, value);
        }
        Tracking.setCustomDimension = setCustomDimension;
        function trackEvent(category, action, label, value) {
            // check if we should log this event
            if (!isLoggingEnabled(Array.prototype.slice.call(arguments))) {
                return;
            }
            if (!trackingEnabled) {
                console.log(`TrackedEvent: ${Category[category]}/${action}/${label}/${value}`);
                return;
            }
            ga("send", "event", Category[category], action, label, value);
        }
        Tracking.trackEvent = trackEvent;
        function addOptionalEventParam(eventData, param) {
            if (typeof param != "undefined") {
                eventData.push(param);
            }
        }
        function isLoggingEnabled(params) {
            if (!enableLogOncePerSession) {
                return true;
            }
            var hash = JSON.stringify(params);
            if (logOncePerSession[hash]) {
                return false;
            }
            logOncePerSession[hash] = true;
            return true;
        }
        function hashCode(s) {
            return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
        }
    })(Tracking = UrlEditor.Tracking || (UrlEditor.Tracking = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../shared/interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    let paramPattern = /(?:\?|&(?:amp;)?)([^=&#]+)(?:=?([^&#]*))/g;
    let prefixPattern = /^([a-zA-Z0-9-]+:)http/;
    class Uri {
        constructor(uri) {
            this.urlPrefix = ""; // like view-source:
            this.anchor = document.createElement('a');
            this.url(uri);
        }
        getSet(value, propertyName) {
            // check whether to set or return a value
            if (value == undefined) {
                return this.anchor[propertyName];
            }
            this.anchor[propertyName] = value;
        }
        /**
         * Protocol value. Name followed by ":", for example: https:
         */
        protocol(value) {
            return this.getSet(value, "protocol");
        }
        /**
         * Host name (without port number)
         */
        hostname(value) {
            return this.getSet(value, "hostname");
        }
        /**
         * Port number (default: 80)
         */
        port(value) {
            let result = this.getSet(value, "port");
            return result ? parseInt(result) : undefined;
        }
        /**
         * Part of the uri between host and query
         */
        pathname(value) {
            return this.getSet(value, "pathname");
        }
        /**
         * Part of the uri starting from "?" character
         */
        query(value) {
            return this.getSet(value, "search");
        }
        hash(value) {
            return this.getSet(value, "hash");
        }
        /**
         * Host (with port number, for example: localhost:8888)
         */
        host(value) {
            let current = this.getSet(undefined, "host");
            ;
            if (value == undefined) {
                return current;
            }
            // sometimes port number stays in the url - we need to be sure that it won't be in the final url when it is not needed
            if (this.getSet(undefined, "port") == "0" && value.indexOf(":") == -1) {
                value += ":80"; // set default http port number (it will disappear on final url)
            }
            return this.getSet(value, "host");
        }
        /**
         * Params collection. Key value pairs
         */
        params(value) {
            // check whether we should set or return value
            if (value == undefined) {
                let params = {};
                let match;
                while (match = paramPattern.exec(this.anchor.search)) {
                    // initialize with empty array if doesn't exist already
                    params[match[1]] = params[match[1]] || [];
                    params[match[1]].push(match[2]);
                }
                return params;
            }
            else {
                let search = "";
                for (let name in value) {
                    if (value[name].length == 0) {
                        // add empty string as a value otherwise param won't be added
                        value[name].push("");
                    }
                    value[name].forEach(val => {
                        search += search ? "&" : "";
                        search += name + "=" + val;
                    });
                }
                if (search) {
                    search = "?" + search;
                }
                this.anchor.search = search;
            }
        }
        url(url) {
            if (url == undefined) {
                // return regular url with prefix (like 'view-source:')
                return this.urlPrefix + this.anchor.href;
            }
            let matches = url.match(prefixPattern);
            if (matches && matches.length > 1) {
                this.urlPrefix = matches[1];
                // remove prefix from the url before passing it to anchor elem
                url = url.replace(prefixPattern, "http");
            }
            else {
                this.urlPrefix = "";
            }
            this.anchor.href = url;
        }
        getHighlightMarkupPos(position, paramIndex = undefined) {
            let isCursorPositionAvailable = position != undefined;
            let fullUrl = this.url();
            let result = [];
            let queryLength = this.anchor.search.length;
            let pathLength = this.anchor.pathname.length;
            let hostLenght = this.anchor.href.length - queryLength - pathLength - this.anchor.hash.length;
            if (isCursorPositionAvailable && position <= hostLenght) {
                // cursor somewhere in the beginning of the url / host part
                result.push([0, hostLenght]);
            }
            else if (isCursorPositionAvailable && position <= hostLenght + pathLength) {
                // cursor somewhere in the path
                result.push([hostLenght, hostLenght + pathLength]);
            }
            else if (!isCursorPositionAvailable || position <= hostLenght + pathLength + queryLength) {
                let currentIndex = 0;
                // cursor somewhere in query area
                fullUrl.replace(paramPattern, (match, paramName, paramValue, offset) => {
                    // Increment offset as the pattern conatin joiner char (? or &)
                    offset++;
                    // check if we should higlight this param
                    if ((!isCursorPositionAvailable && currentIndex == paramIndex) ||
                        (position >= offset && position <= offset + paramName.length + paramValue.length + 1)) {
                        result.push([offset, offset + paramName.length]);
                        result.push([offset + paramName.length + 1, offset + paramName.length + 1 + paramValue.length]);
                    }
                    currentIndex++;
                    return match;
                });
            }
            if (result.length == 0) {
                let hash = this.hash();
                if (hash && position > fullUrl.length - hash.length) {
                    result.push([fullUrl.length - hash.length, fullUrl.length]);
                }
            }
            return result;
        }
    }
    UrlEditor.Uri = Uri;
})(UrlEditor || (UrlEditor = {}));
var UrlEditor;
(function (UrlEditor) {
    let activeFeatures = [];
    let breakOnDebugCall = false;
    let DebugFeatures;
    (function (DebugFeatures) {
        DebugFeatures[DebugFeatures["autosuggest"] = 0] = "autosuggest";
        DebugFeatures[DebugFeatures["save"] = 1] = "save";
    })(DebugFeatures = UrlEditor.DebugFeatures || (UrlEditor.DebugFeatures = {}));
    function debug(featureNames, ...params) {
        if (typeof featureNames == "number") {
            featureNames = [featureNames];
        }
        if (featureNames.some(item => activeFeatures.indexOf(item) != -1)) {
            params.unshift(featureNames.map(f => DebugFeatures[f]));
            console.log.apply(window, params);
            debugger;
        }
    }
    UrlEditor.debug = debug;
    function turnOnDebugging(features, breakOnDebug = undefined) {
        if (typeof features == "number") {
            features = [features];
        }
        if (breakOnDebug != undefined) {
            breakOnDebugCall = breakOnDebug;
        }
        activeFeatures = activeFeatures.concat(features);
    }
    UrlEditor.turnOnDebugging = turnOnDebugging;
})(UrlEditor || (UrlEditor = {}));
/// <reference path="testhooks.ts" />
/// <reference path="interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Shared;
    (function (Shared) {
        var AutoSuggest;
        (function (AutoSuggest) {
            const UNBIND = "[Unbind] ";
            const HOST_ALIAS_KEY = "[suggestionAlias]";
            class Data {
                constructor(settings) {
                    this.settings = settings;
                }
                getData() {
                    if (!this.autoSuggestData) {
                        this.autoSuggestData = JSON.parse(this.settings.autoSuggestData);
                    }
                    return this.autoSuggestData;
                }
                setData(data) {
                    this.autoSuggestData = data;
                    return this;
                }
                getDomains() {
                    return Object.keys(this.getData());
                }
                exists(domain) {
                    return !!this.getData()[domain];
                }
                getPage(domain, throwWhenDataMissing = false) {
                    if (!this.exists(domain)) {
                        if (throwWhenDataMissing) {
                            throw new Error(`Domain data not found! (${domain})`);
                        }
                        else {
                            // initialize data object
                            this.getData()[domain] = {};
                        }
                    }
                    return new Page(this, domain);
                }
                save() {
                    UrlEditor.debug([UrlEditor.DebugFeatures.autosuggest, UrlEditor.DebugFeatures.save], JSON.parse(this.settings.autoSuggestData), this.autoSuggestData);
                    this.settings.setValue("autoSuggestData", JSON.stringify(this.autoSuggestData));
                }
            }
            AutoSuggest.Data = Data;
            class Page {
                constructor(dataObj, domain) {
                    this.dataObj = dataObj;
                    this.domain = domain;
                    this.data = dataObj.getData();
                }
                bindWith(domainToBind) {
                    let localTopDomain = this.getTopDomain(this.domain);
                    domainToBind = this.getTopDomain(domainToBind);
                    if (localTopDomain == domainToBind) {
                        return;
                    }
                    this.mergeParams(localTopDomain, domainToBind);
                    // update other domains if they were bind to the bindDomain
                    this.dataObj.getDomains().forEach(domain => {
                        if (this.data[domain][HOST_ALIAS_KEY] && this.data[domain][HOST_ALIAS_KEY][0] == domainToBind) {
                            this.data[domain][HOST_ALIAS_KEY][0] = localTopDomain;
                        }
                    });
                    this.data[domainToBind] = {};
                    this.data[domainToBind][HOST_ALIAS_KEY] = [localTopDomain];
                }
                unbind(domain) {
                    let rel = this.resolveRelationship(domain);
                    this.data[rel.child] = this.data[rel.parent];
                }
                add(paramName, paramValue) {
                    let params = this.getParams();
                    // initialize if doesn't exist
                    params[paramName] = params[paramName] || [];
                    // check if value already exists
                    let foundOnPosition = params[paramName].indexOf(paramValue);
                    if (foundOnPosition != -1) {
                        // remove it as we want to add it on the beginning of the collection later
                        params[paramName].splice(foundOnPosition, 1);
                    }
                    // add value on the beginning
                    params[paramName].unshift(paramValue);
                }
                delete() {
                    // check if it is top domain
                    if (!this.isAlias()) {
                        let newTopDomain;
                        let params = this.getParamNames();
                        // make sure the other domains which were linked to the current one will be updated
                        this.dataObj.getDomains().forEach(domain => {
                            if (this.isAlias(domain) && this.getTopDomain(domain) == this.domain) {
                                if (params.length == 0) {
                                    // if there are no params we should remove all linked domains
                                    delete this.data[domain];
                                }
                                else {
                                    if (!newTopDomain) {
                                        newTopDomain = domain;
                                        this.data[domain] = this.getParams();
                                    }
                                    else {
                                        this.data[domain][HOST_ALIAS_KEY][0] = newTopDomain;
                                    }
                                }
                            }
                        });
                    }
                    delete this.data[this.domain];
                }
                deleteParam(name) {
                    delete this.data[this.getTopDomain()][name];
                    let remainningParams = Object.keys(this.getParams());
                    if (remainningParams.length == 0) {
                        // if no params left remove the domain
                        this.delete();
                    }
                }
                deleteParamValue(paramName, valueToRemove) {
                    let remainingValues = this.data[this.getTopDomain()][paramName].filter(val => val != valueToRemove);
                    this.data[this.getTopDomain()][paramName] = remainingValues;
                    // remove param if no values left
                    if (remainingValues.length == 0) {
                        this.deleteParam(paramName);
                    }
                }
                isAlias(name = null) {
                    return !!this.data[name || this.domain][HOST_ALIAS_KEY];
                }
                getParams() {
                    return this.data[this.getTopDomain()];
                }
                getParamNames() {
                    return Object.keys(this.getParams());
                }
                getParamValues(name) {
                    return this.data[this.getTopDomain()][name];
                }
                getTopDomain(page = this.domain) {
                    let topDomain = page;
                    // just in case if there is nesting (which shouldn't happen)
                    while (this.data[topDomain][HOST_ALIAS_KEY]) {
                        topDomain = this.data[topDomain][HOST_ALIAS_KEY][0];
                    }
                    return topDomain;
                }
                resolveRelationship(domain, parentLookupEnabled = false) {
                    let result = {
                        parent: this.domain,
                        child: domain
                    };
                    if (this.data[this.domain][HOST_ALIAS_KEY]) {
                        let parentDomain = domain;
                        if (this.data[parentDomain][HOST_ALIAS_KEY]) {
                            if (parentLookupEnabled) {
                                // trying to find root
                                parentDomain = this.getTopDomain(domain);
                            }
                            else {
                                throw new Error("Binding failed. Both pages are aliases.");
                            }
                        }
                        // swap
                        result.parent = parentDomain;
                        result.child = this.domain;
                    }
                    return result;
                }
                mergeParams(parentDomain, domainToBind) {
                    Object.keys(this.data[domainToBind]).forEach(paramName => {
                        let result = Array.from(
                        // Set by default removes all dupes
                        new Set(
                        // merging arrays
                        (this.data[parentDomain][paramName] || []).concat(this.data[domainToBind][paramName])));
                        // only update if it's different
                        if ((this.data[parentDomain][paramName] || []).length != this.data[domainToBind][paramName].length) {
                            this.data[parentDomain][paramName] = result;
                        }
                    });
                }
            }
            AutoSuggest.Page = Page;
        })(AutoSuggest = Shared.AutoSuggest || (Shared.AutoSuggest = {}));
    })(Shared = UrlEditor.Shared || (UrlEditor.Shared = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="settings.ts" />
/// <reference path="tracking.ts" />
/// <reference path="url_parser.ts" />
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="../shared/autosuggest.shared.ts" />
var UrlEditor;
(function (UrlEditor) {
    const AutoSuggestData = UrlEditor.Shared.AutoSuggest.Data;
    class AutoSuggest {
        constructor(settings, doc, baseUrl, isInIncognitoMode) {
            this.isInIncognitoMode = isInIncognitoMode;
            this.settings = settings;
            this.baseUrl = new UrlEditor.Uri(baseUrl.url());
            this.autoSuggestData = new AutoSuggestData(settings);
            this.pageData = this.autoSuggestData.getPage(this.baseUrl.hostname());
            // initialize suggestions container
            this.suggestions = new Suggestions(doc, this);
            // bind event handlers
            doc.body.addEventListener("DOMFocusOut", evt => {
                this.suggestions.hide();
            });
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(evt.target));
            doc.body.addEventListener("input", evt => this.onDomEvent(evt.target));
        }
        onSubmission(submittedUri) {
            // check if we shouldn't save param data
            if (!this.settings.autoSuggestSaveNew ||
                // check if host is not the same
                this.baseUrl.hostname() != submittedUri.hostname() ||
                (this.isInIncognitoMode && !this.settings.autoSuggestEnabledOnIncognito)) {
                // not saving data
                return;
            }
            let baseParams = this.baseUrl.params();
            let submittedParams = submittedUri.params();
            // create a list of params to save
            let paramsToSave;
            Object.keys(submittedParams).forEach(name => {
                // add params to save list when they were just added
                if (baseParams[name] == undefined ||
                    // or their values are different than before (this is not the most efficient way to compare arrays but it's simple and works)
                    baseParams[name].join(",") != submittedParams[name].join(",")) {
                    // initilize collection whenever it is needed
                    paramsToSave = paramsToSave || {};
                    // take only values which were not saved previously
                    let newValues = submittedParams[name].filter(val => !baseParams[name] || baseParams[name].indexOf(val) == -1);
                    // skip empty ones
                    if (newValues.length) {
                        paramsToSave[name] = newValues;
                    }
                }
            });
            if (paramsToSave) {
                let page = this.autoSuggestData.getPage(submittedUri.hostname());
                Object.keys(paramsToSave).forEach(name => {
                    // iterate over newly added param values
                    paramsToSave[name].forEach(val => {
                        page.add(name, val);
                    });
                });
                this.autoSuggestData.save();
            }
            // create new Uri object to avoid keeping same reference
            this.baseUrl = new UrlEditor.Uri(submittedUri.url());
        }
        deleteSuggestion(paramName, paramValue) {
            if (paramValue != undefined) { // removing value suggestion
                this.pageData.deleteParamValue(paramName, paramValue);
            }
            else { // removing param suggestion
                this.pageData.deleteParam(paramName);
            }
            this.autoSuggestData.save();
        }
        onDomEvent(elem) {
            if (elem.tagName == "INPUT" && elem.type == "text" && elem.parentElement.isParamContainer) {
                let name, value;
                switch (elem.name) {
                    case "name":
                        name = elem.value;
                        break;
                    case "value":
                        name = elem.previousElementSibling.value;
                        value = elem.value;
                        break;
                }
                if (name) {
                    this.showSuggestions(elem, name, value);
                }
                else {
                    this.suggestions.hide();
                }
            }
        }
        showSuggestions(elem, name, value) {
            // check if auto-suggest functionality is enabled
            if (!this.settings.autoSuggest) {
                return;
            }
            if (this.autoSuggestData.exists(this.baseUrl.hostname())) {
                let prefix;
                let suggestions = [];
                let page = this.autoSuggestData.getPage(this.baseUrl.hostname());
                // check if param name is being edited
                if (value == undefined) {
                    suggestions = page.getParamNames();
                    prefix = name;
                }
                else if (page.getParamValues(name)) {
                    suggestions = page.getParamValues(name);
                    prefix = value;
                }
                if (suggestions.length > 0) {
                    this.suggestions.bulkAdd(suggestions.filter(text => {
                        // suggestion must be longer than prefix
                        return prefix.length < text.length &&
                            // and must start with prefix
                            text.substr(0, prefix.length) == prefix;
                    }));
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "shown");
                    this.suggestions.show(elem);
                }
            }
        }
    }
    AutoSuggest.HOST_ALIAS_KEY = "[suggestionAlias]";
    UrlEditor.AutoSuggest = AutoSuggest;
    class Suggestions {
        constructor(doc, autoSuggest) {
            this.doc = doc;
            this.autoSuggest = autoSuggest;
            this.container = doc.createElement("ul");
            this.container.className = "suggestions";
            this.doc.body.appendChild(this.container);
            // need to use mousedown as click event is triggered too late (after DOMFocusIn which is hidding suggestions)
            this.container.addEventListener("mousedown", evt => this.mouseEventHandler(evt));
        }
        add(text) {
            let li = this.doc.createElement("li");
            li.textContent = text;
            li.className = "suggestion";
            li["suggestionText"] = text;
            // delete button
            let del = this.doc.createElement("span");
            del.textContent = "x";
            del.className = "delete";
            del.title = "Press Ctrl+D to remove";
            li.appendChild(del);
            this.container.appendChild(li);
        }
        bulkAdd(texts) {
            this.clear();
            texts.forEach(text => this.add(text));
        }
        clear() {
            this.container.innerHTML = "";
            this.hide();
        }
        show(elem) {
            // show only if there is anything to show
            if (this.container.innerHTML) {
                this.inputElem = elem;
                // we need to wrap it to be able to remove it later
                this.handler = (evt) => this.keyboardNavigation(evt);
                this.inputElem.addEventListener("keydown", this.handler, true);
                this.originalText = this.inputElem.value;
                // allow to flush all the DOM changes before adjusting position
                setTimeout(() => this.adjustPositionAndHeight(), 0);
            }
        }
        hide() {
            this.container.style.display = "none";
            if (this.inputElem) {
                this.inputElem.removeEventListener("keydown", this.handler, true);
            }
            this.active = undefined;
        }
        adjustPositionAndHeight() {
            let pos = this.inputElem.getBoundingClientRect();
            // pos doesn't contain scroll value so we need to add it
            let posTop = pos.bottom + window.scrollY - 3;
            this.container.style.top = posTop + "px";
            this.container.style.left = pos.left + "px";
            this.container.style.display = "block";
            this.container.style.minWidth = this.inputElem.offsetWidth + "px";
            this.container.style.height = "auto";
            this.container.style.width = "auto";
            // reduce the height if it is reached page end
            let tooBig = posTop + this.container.offsetHeight - (this.doc.body.offsetHeight + 8); // increase by 8 due to margin
            if (tooBig > 0) {
                this.container.style.height = (this.container.offsetHeight - tooBig) + "px";
            }
            // reduce width if it is too wide
            let tooWide = pos.left + this.container.offsetWidth - (this.doc.body.offsetWidth + 8);
            if (tooWide > 0) {
                this.container.style.width = (this.container.offsetWidth - tooWide) + "px";
            }
            // increase by 2px due to border size
            UrlEditor.Helpers.ensureIsVisible(this.container, this.doc.body, window.innerHeight + 2);
        }
        mouseEventHandler(evt) {
            let elem = evt.target;
            switch (elem.className) {
                case "suggestion":
                    this.inputElem.value = elem.suggestionText;
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "used");
                    // trigger event which will update param in the url (via view model)
                    let e = new Event("updated");
                    e.initEvent("updated", true, true);
                    this.inputElem.dispatchEvent(e);
                    break;
                case "delete":
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "delete");
                    this.deleteSuggestion(elem.parentElement);
                    // prevent from triggering same event on suggestion
                    evt.stopPropagation();
                    // prevent from closing suggestions drawer
                    evt.preventDefault();
                    break;
            }
        }
        keyboardNavigation(evt) {
            let handled;
            let elementToFocus;
            // allow user to navigate to other input elem
            if (evt.ctrlKey && evt.keyCode != 68) {
                return;
            }
            let suggestionToSelect;
            switch (evt.keyCode) {
                case 38: // up
                    handled = true;
                    suggestionToSelect = this.active ? this.active.previousElementSibling : this.container.lastElementChild;
                    break;
                case 40: // down
                    handled = true;
                    suggestionToSelect = this.active ? this.active.nextElementSibling : this.container.firstElementChild;
                    break;
                case 9: // tab
                case 13: // enter
                    if (this.active) {
                        handled = true;
                        this.originalText = this.active.suggestionText;
                        let nextInput = this.inputElem.nextElementSibling;
                        if (nextInput.tagName == "INPUT" && nextInput.type == "text") {
                            elementToFocus = nextInput;
                        }
                        else {
                            // hack: close suggestions pane when no next element
                            setTimeout(() => this.hide(), 1);
                        }
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "used");
                        // trigger event which will update param in the url (via view model)
                        let e = new Event("updated");
                        e.initEvent("updated", true, true);
                        this.inputElem.dispatchEvent(e);
                    }
                    break;
                case 27: // escape
                    handled = true;
                    // delay hiding to properly execute remaining code
                    setTimeout(() => this.hide(), 1);
                    break;
                case 68: // D
                    if (evt.ctrlKey && this.active) {
                        this.deleteSuggestion(this.active);
                        handled = true;
                    }
                    break;
            }
            this.active && this.active.classList.remove("hv");
            if (suggestionToSelect) {
                UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "selected");
                suggestionToSelect.classList.add("hv");
                // increase by 2px due to border size
                UrlEditor.Helpers.ensureIsVisible(suggestionToSelect, this.container, this.container.offsetHeight + 2);
            }
            else {
                this.container.scrollTop = 0;
            }
            this.active = suggestionToSelect;
            if (handled) {
                // just in case any of handled key combinations would have some default action
                evt.preventDefault();
                // prevent from further handling
                evt.stopPropagation();
                // put suggestion text into input elem
                this.inputElem.value = this.active ? this.active.suggestionText : this.originalText;
            }
            if (elementToFocus) {
                elementToFocus.focus();
            }
        }
        deleteSuggestion(suggestion) {
            let paramElem = this.inputElem.parentElement;
            // check if user wants to remove value suggestion
            if (this.inputElem == paramElem.valueElement) {
                this.autoSuggest.deleteSuggestion(paramElem.nameElement.value, suggestion.suggestionText);
            }
            else {
                // removing param-name suggestion
                this.autoSuggest.deleteSuggestion(suggestion.suggestionText);
            }
            // remove suggestion from DOM
            this.container.removeChild(suggestion);
            if (this.container.childElementCount == 0) {
                this.hide();
            }
        }
    }
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../shared/interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    var ParamOptions;
    (function (ParamOptions) {
        const clickAction = "clickAction";
        const setActiveState = "setActiveState";
        let doc;
        let menuElem;
        let paramOptions = [];
        function init(_doc) {
            doc = _doc;
            _doc.body.addEventListener("keydown", evt => isVisible() && handleKeyboard(evt), true);
        }
        ParamOptions.init = init;
        function registerOption(option) {
            paramOptions.push(option);
            paramOptions = paramOptions.sort((o1, o2) => o1.order - o2.order);
        }
        ParamOptions.registerOption = registerOption;
        function show(container, pressedButton, openingByKeyboard = false) {
            if (menuElem) {
                // update isActive states
                for (let i = 0; i < menuElem.children.length; i++) {
                    // check if handler exists (present only on fields which supports it)
                    if (menuElem.children[i][setActiveState]) {
                        menuElem.children[i][setActiveState](container);
                    }
                }
            }
            else {
                initializeOptions(container);
            }
            menuElem.currentContainer = container;
            menuElem.style.display = "block";
            // move menu to proper position
            let pos = pressedButton.getBoundingClientRect();
            // pos doesn't contain scroll value so we need to add it
            let posTop = pos.top + window.scrollY - 8 - 2; // 8px body margin; 2px border
            menuElem.style.top = posTop + "px";
            let posRight = pos.right - menuElem.parentElement.offsetWidth + 2; // 2px for border
            menuElem.style.right = posRight + "px";
            UrlEditor.Helpers.ensureIsVisible(menuElem, doc.body, window.innerHeight);
            // when opened by keyboard select first option
            if (openingByKeyboard) {
                menuElem.getElementsByTagName("li")[0].classList.add("hv");
            }
        }
        ParamOptions.show = show;
        function hide() {
            if (menuElem) {
                menuElem.style.display = "none";
                // remove selection if exists
                let slectedOption = getSelectedOption();
                slectedOption && slectedOption.classList.remove("hv");
            }
        }
        ParamOptions.hide = hide;
        function isVisible() {
            return menuElem && menuElem.style.display != "none";
        }
        function initializeOptions(container) {
            menuElem = doc.createElement("ul");
            menuElem.setAttribute("id", "paramMenu");
            paramOptions.forEach((option, index) => {
                let li = doc.createElement("li");
                li.id = "mpo_" + index;
                let span = doc.createElement("span");
                span.textContent = option.text;
                var isActive = option.isActive(container);
                if (isActive != undefined) {
                    let label = doc.createElement("label");
                    label.appendChild(span);
                    let checkbox = doc.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = isActive;
                    label.appendChild(checkbox);
                    li.appendChild(label);
                    // prepare handler for updating the field state
                    li[setActiveState] = (c) => checkbox.checked = option.isActive(c);
                }
                else {
                    li.appendChild(span);
                }
                li[clickAction] = () => {
                    option.action(menuElem.currentContainer);
                    hide();
                };
                // using mouseup event as "click" one is triggered as well whenever input checkbox state changes (do avoid double action execution)
                li.addEventListener("mouseup", evt => {
                    evt.stopPropagation();
                    option.action(menuElem.currentContainer);
                    hide();
                }, true);
                menuElem.appendChild(li);
            });
            doc.body.appendChild(menuElem);
        }
        function handleKeyboard(evt) {
            // we don't want this event to trigger other handlers
            evt.stopPropagation();
            switch (evt.keyCode) {
                case 38: // up
                    select(-1);
                    break;
                case 40: // down
                    select(1);
                    break;
                case 13: // enter
                    let selectedOption = getSelectedOption();
                    if (selectedOption != undefined) {
                        selectedOption[clickAction]();
                    }
                    hide();
                    evt.preventDefault();
                    break;
                case 27: // esc
                    hide();
                    evt.preventDefault();
                    break;
            }
        }
        function select(direction) {
            let options = menuElem.getElementsByTagName("li");
            // look for currently active elem
            let activeOptionIndex = getSelectedOptionIndex(options);
            // deselect current elem
            options[activeOptionIndex].classList.remove("hv");
            // move in correct direction
            activeOptionIndex += direction;
            // make sure it not exceeds limits
            activeOptionIndex = activeOptionIndex < 0 ? options.length - 1 : activeOptionIndex >= options.length ? 0 : activeOptionIndex;
            options[activeOptionIndex].classList.add("hv");
        }
        function getSelectedOption() {
            let options = menuElem.getElementsByTagName("li");
            let selectedOptionIndex = getSelectedOptionIndex(options, undefined);
            return selectedOptionIndex != undefined ? options[selectedOptionIndex] : undefined;
        }
        function getSelectedOptionIndex(options, defaultIndex = 0) {
            options = options || menuElem.getElementsByTagName("li");
            let activeOptionIndex = defaultIndex;
            for (let i = 0, option; option = options[i]; i++) {
                if (option.classList.contains("hv")) {
                    activeOptionIndex = i;
                    break;
                }
            }
            return activeOptionIndex;
        }
    })(ParamOptions = UrlEditor.ParamOptions || (UrlEditor.ParamOptions = {}));
})(UrlEditor || (UrlEditor = {}));
var UrlEditor;
(function (UrlEditor) {
    /**
     * Replaces RegExp groups from given pattern with given values.
     *
     * @example
     *      (new RegExpGroupReplacer(".*#.*(test)")).replace("replace test after # this test should be replaced", ["string"])
     *      => "replace test after # this string should be replaced"
     */
    class RegExpGroupReplacer {
        constructor(pattern, isGlobal) {
            this.pattern = pattern;
            this.isGlobal = isGlobal;
            this.resultIndexes = [];
            this.groupsCount = 0;
            this.groupsCountAfterConversion = 0;
            this.rulePattern = /(\(.*?[^\\]\))/g;
            this.addRemaningPatternGroups();
        }
        /**
         * Replaces matched groups with custom values
         * @param subject String in which values will be replaced
         * @param replaceValues Values to insert or delegate
         */
        replace(subject, replaceValues, replaceString) {
            if (typeof replaceValues == "function") {
                replaceValues = this.getConvertedValues(subject, replaceValues);
            }
            if (typeof replaceString != "undefined" && replaceString !== "") {
                return replaceString.replace(/\$([0-9]+)/g, (matched, val) => replaceValues[val - 1]);
            }
            return this.replaceMatchedWithValues(subject, replaceValues);
        }
        /**
         * Replaces matched groups with given values
         * @param subject String in which values will be replaced
         * @param replaceValues Values to insert
         */
        replaceMatchedWithValues(subject, values) {
            return subject.replace(new RegExp(this.patternConverted, this.isGlobal ? "g" : ""), this.getReplaceString(values));
        }
        /**
         * Replaces matched groups with values returned by deleagte
         * @param subject String in which values will be replaced
         * @param converter Delegate to get value to insert
         */
        getConvertedValues(subject, converter) {
            let results = [];
            let match = subject.match(this.pattern);
            if (match) {
                for (let i = 1; i < match.length; i++) {
                    results.push(converter(match[i], i - 1));
                }
            }
            return results;
        }
        /**
         * Builds replace-value string (e.g. $1replaced$2)
         * @param newSubstrings Values to insert
         */
        getReplaceString(newSubstrings) {
            let result = "";
            for (let i = 1; i <= this.groupsCountAfterConversion; i++) {
                let index = this.resultIndexes.indexOf(i - 1);
                result += index != -1 ? newSubstrings[index] : "$" + i;
            }
            return result;
        }
        /**
         * Since we need to capture all parts of original string we need to add remaining groups.
         *
         * @example ".*#.*(test).*something" => "(.*#.*)(test)(.*something)"
         */
        addRemaningPatternGroups() {
            let groups = [];
            let index = 0;
            this.pattern.replace(this.rulePattern, (match, captured, i) => {
                let everythingBefore = this.pattern.substr(index, i - index);
                if (everythingBefore) {
                    groups.push("(" + everythingBefore + ")");
                }
                this.resultIndexes.push(groups.length);
                groups.push(captured);
                index = i + captured.length;
                this.groupsCount++;
                return match;
            });
            if (index < this.pattern.length) {
                groups.push(this.pattern.substr(index));
            }
            this.groupsCountAfterConversion = groups.length;
            this.patternConverted = groups.join("");
        }
    }
    UrlEditor.RegExpGroupReplacer = RegExpGroupReplacer;
})(UrlEditor || (UrlEditor = {}));
///<reference path="../shared/shared.ts" />
///<reference path="settings.ts" />
///<reference path="url_parser.ts" />
///<reference path="regexp.replacer.ts" />
var UrlEditor;
(function (UrlEditor) {
    /**
     * TODO:
     * 1. Action icon indicator showing available redirections
     */
    let converters = {};
    converters.leaveAsIs = val => val;
    converters.replaceWith = (val, arg) => {
        return arg;
    };
    converters.increment = (val, arg) => (parseInt(val) + parseInt(arg)).toString();
    converters.decrease = (val, arg) => (parseInt(val) - parseInt(arg)).toString();
    converters.urlEncode = (val) => encodeURIComponent(val);
    converters.urlDecode = (val) => UrlEditor.Helpers.safeExecute(() => decodeURIComponent(val), "Redirection/converter-urlDecode");
    converters.base64Encode = (val) => UrlEditor.Helpers.b64EncodeUnicode(val);
    converters.base64Decode = (val) => UrlEditor.Helpers.b64DecodeUnicode(val);
    const ContextMenuGroupName = "Redirections";
    /**
     * Redirection rule definition
     */
    class RedirectRule {
        constructor(ruleData) {
            this.ruleData = ruleData;
            this.name = ruleData.name;
            this.urlFilter = ruleData.urlFilter;
            this.isAutomatic = ruleData.isAutomatic;
        }
        /**
         * Checks if given url is supported by this rule
         * @param url Url to validate
         */
        isUrlSupported(url) {
            // check if rule is disabled
            if (this.ruleData.disabledReason) {
                return false;
            }
            let reg = new RegExp("^" + this.urlFilter.replace(/[*]/g, ".*") + "$");
            return reg.test(url);
        }
        /**
         * Gets new url where user will be redirected
         * @param url Url to transform
         */
        getUpdatedUrl(url) {
            return this.ruleData.regExp ?
                this.getUpdatedUrlAdvanced(url, this.ruleData) :
                this.getUpdatedUrlSimple(url, this.ruleData);
        }
        disable(reason) {
            this.ruleData.disabledReason = reason;
        }
        getData() {
            return this.ruleData;
        }
        /**
         * Regexp based url transformation
         * @param url Url to transform
         * @param data Rule details
         */
        getUpdatedUrlAdvanced(url, data) {
            //url = url.replace(new RegExp(data.regExp, "g"), data.replaceString);
            let r = new UrlEditor.RegExpGroupReplacer(data.regExp, data.isRegExpGlobal);
            url = r.replace(url, (val, index) => {
                try {
                    let converterData = data.replaceValues[index];
                    val = RedirectRule.converters[converterData.func](val, converterData.val);
                }
                catch (e) {
                    throw new Error("Failed to process value. " + e.message);
                }
                return val;
            }, data.replaceString);
            return url;
        }
        /**
         * Field based url transformation
         * @param url Url to transform
         * @param data Rule details
         */
        getUpdatedUrlSimple(url, data) {
            let uri = new UrlEditor.Uri(url);
            if (data.hostname) {
                uri.hostname(data.hostname);
            }
            if (data.port) {
                uri.port(data.port);
            }
            if (data.path) {
                uri.pathname(data.path);
            }
            if (data.protocol) {
                uri.protocol(data.protocol);
            }
            if (data.paramsToUpdate) {
                let urlParams = uri.params();
                Object.keys(data.paramsToUpdate).forEach(name => {
                    if (data.paramsToUpdate[name] == null) {
                        delete urlParams[name];
                    }
                    else {
                        urlParams[name] = [data.paramsToUpdate[name]]; // TODO allow to pass multiple values
                    }
                });
                uri.params(urlParams);
            }
            let result = uri.url();
            if (data.strReplace) {
                data.strReplace.forEach(keyValuePair => {
                    result = result.replace(keyValuePair[0], keyValuePair[1]);
                });
            }
            return result;
        }
    }
    RedirectRule.converters = converters;
    UrlEditor.RedirectRule = RedirectRule;
    class RedirectionManager {
        constructor(setts) {
            this.setts = setts;
        }
        save(data, name) {
            if (this.redirData) {
                // check if intention is to just delete rule or if rule was renamed
                if (data == null || (name && data.name != name)) {
                    // remove the old entry
                    delete this.redirData[name];
                }
                // check if it's not a delete operation
                if (data != null) {
                    this.redirData[data.name] = data;
                }
                this.setts.setValue("redirectionRules", JSON.stringify(this.redirData));
            }
        }
        getData() {
            if (!this.redirData) {
                this.redirData = this.setts.redirectionRules ? JSON.parse(this.setts.redirectionRules) : {};
            }
            return this.redirData;
        }
        getRedirectionRules() {
            if (!this.rules) {
                const data = this.getData();
                this.rules = Object.keys(data).map(name => new RedirectRule(data[name]));
            }
            return this.rules;
        }
        isUrlSupportedByAnyAutoRule(url, nameToSkip = null) {
            return this.getRedirectionRules().some(rule => rule.isAutomatic && rule.isUrlSupported(url) && (nameToSkip == null || rule.name != nameToSkip));
        }
    }
    UrlEditor.RedirectionManager = RedirectionManager;
    class RedirectionBackground {
        constructor(settings, background) {
            this.settings = settings;
            this.background = background;
            this.activeAutoRedirections = [];
            chrome.runtime.onMessage.addListener((msgData, sender, sendResponse) => this.handleMessage(msgData));
            chrome.commands.onCommand.addListener(command => this.onKeyboardShortcut(command));
            this.initializeRedirections();
        }
        /**
         * Keyboard shortcut handler.
         * @param command Command type/name.
         */
        onKeyboardShortcut(command) {
            if (command == UrlEditor.Command.RedirectUseFirstRule) {
                UrlEditor.Helpers.getActiveTab(tab => {
                    let contextMenuItems = this.background.getActiveActionContextMenuItems(tab, ContextMenuGroupName);
                    if (contextMenuItems[0]) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "keyboard", "first_rule");
                        contextMenuItems[0].onclick(null, tab);
                    }
                    else {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "keyboard", "no_rule_available");
                    }
                });
            }
        }
        /**
         * Initializes redirections.
         *
         * It uses fresh/new objects to be sure we use most recent settings.
         */
        initializeRedirections() {
            // remove old event handlers
            this.activeAutoRedirections.forEach(l => chrome.webRequest.onBeforeRequest.removeListener(l));
            this.activeAutoRedirections = [];
            // remove old context menus
            this.background.removeActionContextMenuItem(ContextMenuGroupName);
            this.redirMgr = new RedirectionManager(new UrlEditor.Settings(localStorage));
            const allRules = this.redirMgr.getRedirectionRules();
            allRules.forEach(rule => {
                // check if rule is url-triggering
                if (rule.isAutomatic) {
                    this.setupAutomaticRule(rule);
                }
                else {
                    this.setupContextMenuRuleItem(rule);
                }
            });
        }
        /**
         * Setup for url-trggered rule.
         * @param data Rule details
         */
        setupAutomaticRule(rule) {
            // create new wrapper and add it to the list (we need to do it to be able to remove listener later)
            this.activeAutoRedirections.push(requestDetails => {
                let newUrl = rule.getUpdatedUrl(requestDetails.url);
                if (newUrl != requestDetails.url) {
                    // prevent from redirection loop
                    if (this.redirMgr.isUrlSupportedByAnyAutoRule(newUrl)) {
                        rule.disable("Potential redirection loop detected. Produced url cannot be matched by any redirection rule.");
                        this.redirMgr.save(rule.getData());
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "blocked");
                        return null;
                    }
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "automatic");
                    return {
                        redirectUrl: newUrl
                    };
                }
                return null;
            });
            chrome.webRequest.onBeforeRequest.addListener(this.activeAutoRedirections[this.activeAutoRedirections.length - 1], // use newly added handler
            { urls: [rule.urlFilter] }, ["blocking"]);
        }
        /**
         * Setup for context menu rule.
         * @param data Rule details
         */
        setupContextMenuRuleItem(rule) {
            this.background.addActionContextMenuItem({
                clickHandler: (info, tab) => {
                    let newUrl = rule.getUpdatedUrl(tab.url);
                    if (tab.url != newUrl) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "click", "context_menu");
                        chrome.tabs.update(tab.id, { url: newUrl });
                    }
                },
                group: ContextMenuGroupName,
                label: "Redirect: " + rule.name,
                isEnabled: tab => rule.isUrlSupported(tab.url)
            });
        }
        /**
         * Handles messages/commands send by UI.
         * @param msg Incommong message/command
         */
        handleMessage(msg) {
            switch (msg) {
                case UrlEditor.Command.ReloadRedirectionRules:
                    this.initializeRedirections();
                    break;
            }
        }
    }
    UrlEditor.Plugins.Background.push(RedirectionBackground);
})(UrlEditor || (UrlEditor = {}));
/// <reference path="helpers.ts" />
/// <reference path="../shared/interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    const modifierKeys = [
        16,
        17,
        18,
    ];
    class RichTextboxViewModel {
        constructor(doc) {
            this.doc = doc;
            let fullUrl = UrlEditor.Helpers.ge("full_url");
            this.richText = new RichTextBox(fullUrl);
            doc.body.addEventListener("input", evt => this.onDomEvent(evt.target, evt.type));
            doc.body.addEventListener("DOMFocusIn", evt => this.onDomEvent(evt.target, evt.type));
            // handle clicks and cursor position changes in full url field
            fullUrl.addEventListener("mouseup", (evt) => this.onDomEvent(evt.currentTarget, evt.type));
            fullUrl.addEventListener("keyup", (evt) => {
                // Skip handling for modifier keys
                if (modifierKeys.indexOf(evt.keyCode) == -1) {
                    this.onDomEvent(evt.currentTarget, evt.type);
                }
            });
        }
        onDomEvent(elem, evtType) {
            if (UrlEditor.Helpers.isTextFieldActive()) {
                let action;
                let delay = false;
                switch (elem.id) {
                    case "full_url":
                        if (evtType == "DOMFocusIn" || evtType == "input") {
                            // we dont need to handle it
                            return;
                        }
                        action = () => {
                            let selection = this.richText.getSelectionIndexes();
                            this.highlight(selection.start, undefined);
                            // bring back original cursor pos
                            this.richText.select(selection.start, selection.end);
                        };
                        break;
                    case "hostname":
                    case "path":
                        action = () => this.highlightHostOrPath(elem);
                        // delay handling - we need to wait when all fields will be updated (by ViewModel)
                        delay = evtType == "input";
                        break;
                    default:
                        let paramContainer = elem.parentElement;
                        if (paramContainer.isParamContainer) {
                            action = () => this.highlightParams(elem);
                            // delay handling - we need to wait when all fields will be updated (by ViewModel)
                            delay = true;
                        }
                }
                if (action) {
                    if (delay) {
                        setTimeout(() => action(), 0);
                    }
                    else {
                        action();
                    }
                }
            }
        }
        highlightHostOrPath(elem) {
            let cursorPos = 0;
            let uri = new UrlEditor.Uri(this.richText.getText());
            cursorPos += uri.protocol().length + uri.host().length + 2; // 2 - for double slash after protocol
            if (elem.id == "path") {
                cursorPos += uri.pathname().length;
            }
            this.highlight(cursorPos, undefined);
        }
        highlightParams(elem) {
            let paramContainer = elem.parentElement;
            if (paramContainer.isParamContainer) {
                let paramIndex = 0;
                // set param position/number
                while (paramContainer.previousElementSibling) {
                    paramContainer = paramContainer.previousElementSibling;
                    // increment only when previous sibling is a real param container
                    paramIndex += paramContainer.isParamContainer ? 1 : 0;
                }
                this.highlight(undefined, paramIndex);
            }
        }
        highlight(pos, paramIndex) {
            let uri = new UrlEditor.Uri(this.richText.getText());
            let currentActiveElem = this.doc.activeElement;
            let markupPositions = uri.getHighlightMarkupPos(pos, paramIndex);
            this.richText.highlight(markupPositions);
        }
    }
    UrlEditor.RichTextboxViewModel = RichTextboxViewModel;
    class RichTextBox {
        constructor(elem) {
            if (typeof elem == "string") {
                this.elem = UrlEditor.Helpers.ge(elem);
            }
            else {
                this.elem = elem;
            }
            this.doc = this.elem.ownerDocument;
            this.window = this.doc.defaultView;
        }
        highlight(markupPos) {
            let originalText = this.elem.textContent;
            let result = "";
            let lastPos = 0;
            markupPos.forEach((elemPos) => {
                result += originalText.substr(lastPos, elemPos[0] - lastPos).htmlEncode() + "<b>" + originalText.substr(elemPos[0], elemPos[1] - elemPos[0]).htmlEncode() + "</b>";
                lastPos = elemPos[1];
            });
            result += originalText.substr(lastPos, originalText.length - lastPos).htmlEncode();
            // avoid updating DOM when it is not necessarry
            if (this.elem.innerHTML != result) {
                this.elem.innerHTML = result;
            }
        }
        getSelectionIndexes() {
            let posStart = 0;
            let posEnd = 0;
            let sel = this.window.getSelection();
            if (sel.rangeCount > 0) {
                let range = sel.getRangeAt(0);
                let preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(this.elem);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                posStart = preCaretRange.toString().length;
                preCaretRange.setEnd(range.endContainer, range.endOffset);
                posEnd = preCaretRange.toString().length;
            }
            return { start: posStart, end: posEnd };
        }
        getCursorPos(returnSelectionEnd = false) {
            let selection = this.getSelectionIndexes();
            return returnSelectionEnd ? selection.end : selection.start;
        }
        setCursorPos(pos) {
            this.select(pos, pos);
        }
        select(start, end) {
            if (start > end) {
                // gacefully fail
                return;
            }
            let range = this.doc.createRange();
            let startNode, endNode;
            // iterate over all nodes: text, element, etc
            for (let i = 0; i < this.elem.childNodes.length; i++) {
                let node = this.elem.childNodes[i];
                let currentNodeTextLength = node.textContent.length;
                if (start < currentNodeTextLength || end <= currentNodeTextLength) {
                    // if it is not text node we need to get the one inside
                    if (node.nodeType != Node.TEXT_NODE) {
                        node = node.childNodes[0];
                    }
                    if (!startNode) {
                        startNode = node;
                    }
                    if (end <= currentNodeTextLength) {
                        endNode = node;
                        break;
                    }
                }
                // change start value only if node hasn't been found yet
                start -= startNode ? 0 : currentNodeTextLength;
                end -= currentNodeTextLength;
            }
            if (startNode && endNode) {
                let sel = this.window.getSelection();
                // set same pos for start and end
                range.setStart(startNode, start);
                range.setEnd(endNode, end);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
        focus() {
            this.elem.focus();
        }
        getText() {
            return this.elem.textContent;
        }
        removeFormatting() {
            // remove all html markup from element content
            this.elem.textContent = this.elem.textContent;
        }
    }
    UrlEditor.RichTextBox = RichTextBox;
})(UrlEditor || (UrlEditor = {}));
/// <reference path="../shared/interfaces.shared.d.ts" />
/// <reference path="helpers.ts" />
/// <reference path="param_options.ts" />
/// <reference path="settings.ts" />
/// <reference path="tracking.ts" />
/// <reference path="autorefresh.ts" />
var UrlEditor;
(function (UrlEditor) {
    var paramEncodedPattern = /%[a-fA-F0-9]{2}/;
    var port80Pattern = /:80$/;
    var maxClientWidth = 780;
    var paramsMarginSum = 86; //5 * 4 + 2 * 3 + 2 * 22 + 2 * 8;
    /**
     * Returns following results for given params
     * 0 (CurrentTab) <- false, false
     * 1 (NewTab)     <- true,  false
     * 2 (NewWindow)  <- false, true
     * 2 (NewWindow)  <- true,  true
     */
    function whereToOpenUrl(ctrl, shift) {
        // :)
        return (1 * ctrl) + (2 * shift) - (ctrl & shift);
    }
    class ViewModel {
        constructor(url, doc, settings, submit) {
            this.url = url;
            this.doc = doc;
            this.settings = settings;
            this.submit = submit;
            this.mapIdToFunction = {
                "full_url": "url",
                "hostname": "host",
                "path": "pathname"
            };
            this.measureElem = UrlEditor.Helpers.ge("measure");
            // bind event handlers
            doc.body.addEventListener("click", evt => this.clickEventDispatcher(evt));
            doc.body.addEventListener("input", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("updated", evt => this.keyboardEventDispatcher(evt));
            doc.body.addEventListener("DOMFocusIn", evt => this.autoSelectInputValue(evt.target));
            doc.body.addEventListener("keydown", evt => {
                if (this.keyboardNavigation(evt)) {
                    return;
                }
                if (UrlEditor.Helpers.isTextFieldActive() && evt.keyCode == 13) {
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Submit, "keyboard");
                    submit(this.url, whereToOpenUrl(evt.ctrlKey, evt.shiftKey));
                    // we don't want a new line to be added in full_url input
                    evt.preventDefault();
                }
            });
            if (settings.autoSortParams) {
                this.sortParameters();
            }
            this.updateFields(false /*setUriFromFields*/);
            // initialize param options
            UrlEditor.ParamOptions.init(document);
            UrlEditor.ParamOptions.registerOption({
                text: "Url encoding",
                action: container => this.encodeDecodeParamValue(container, false),
                isActive: container => container.urlEncoded,
                order: 1
            });
            UrlEditor.ParamOptions.registerOption({
                text: "Base64 encoding",
                action: container => this.encodeDecodeParamValue(container, true),
                isActive: container => !!container.base64Encoded,
                order: 1
            });
            UrlEditor.ParamOptions.registerOption({
                text: "Delete",
                action: container => this.deleteParam(container),
                isActive: container => undefined,
                order: 1
            });
        }
        clickEventDispatcher(evt) {
            let elem = evt.target;
            // make sure ParamOptions menu is closed
            UrlEditor.ParamOptions.hide();
            if (elem.tagName == "INPUT") {
                var inputElem = elem;
                switch (inputElem.type) {
                    case "button":
                        this.buttonClickHandler(inputElem, evt);
                        break;
                }
            }
        }
        encodeDecodeParamValue(paramContainer, base64) {
            let value = paramContainer.valueElement.value;
            if (base64) {
                // TODO this check is not perfect as string may just look like encoded
                let isEncoded = UrlEditor.Helpers.isBase64Encoded(value);
                if (isEncoded) {
                    paramContainer.valueElement.value = UrlEditor.Helpers.b64DecodeUnicode(paramContainer.valueElement.value);
                }
                paramContainer.base64Encoded = !paramContainer.base64Encoded;
                // we always need to urlencode base64 values (because of the '=' chars)
                if (paramContainer.base64Encoded) {
                    paramContainer.urlEncoded = true;
                }
            }
            else {
                // we always need to urlencode base64 values (because of the '=' chars)
                paramContainer.urlEncoded = paramContainer.base64Encoded || !paramContainer.urlEncoded;
            }
            // delay execution
            setTimeout(() => {
                paramContainer.valueElement.focus();
                this.updateFields(true /*setUriFromFields*/);
            }, 0);
        }
        buttonClickHandler(pressedButton, evt) {
            // this handler is triggered for any button click on page
            var paramContainer = pressedButton.parentElement;
            if (paramContainer.isParamContainer) {
                UrlEditor.ParamOptions.show(paramContainer, pressedButton, /*openingByKeyboard*/ evt.clientX == 0 && evt.clientY == 0);
            }
            else {
                switch (pressedButton.id) {
                    case "add_param":
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AddParam, "click");
                        this.addNewParamFields();
                        break;
                    case "go":
                        // submit button
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Submit, "click");
                        this.submit(this.url, whereToOpenUrl(evt.ctrlKey, evt.shiftKey));
                        break;
                }
            }
        }
        keyboardEventDispatcher(evt) {
            // casting to the INPUT elem but it can be a div/full_url as well
            var elem = evt.target;
            if (UrlEditor.Helpers.isTextFieldActive()) {
                // clear error message
                this.setErrorMessage("", elem);
                this.updateFields();
            }
        }
        updateFields(setUriFromFields = true) {
            if (setUriFromFields) {
                this.setUriFromFields();
            }
            var activeElem = this.doc.activeElement;
            var isTextFieldActive = UrlEditor.Helpers.isTextFieldActive();
            if (activeElem.id == "full_url" || (!activeElem.parentElement.isParamContainer && !isTextFieldActive)) {
                this.populateInputFields(!isTextFieldActive);
            }
            if (activeElem.id != "full_url" || !isTextFieldActive) {
                UrlEditor.Helpers.ge("full_url").textContent = this.url.url();
                if (activeElem.id == "hostname") {
                    this.adjustElementWidthToItsContent(activeElem);
                }
            }
        }
        populateInputFields(setFocusOnLastParam = false) {
            // iterate over elements which should be populatad
            var elements = this.doc.getElementsByTagName("input");
            for (var i = 0, elem; elem = elements[i]; i++) {
                var funcName = this.mapIdToFunction[elem.id];
                // check if element has ID set, the mapping exists
                if (elem.id && funcName) {
                    // updating element value using a function name taken from mapping
                    this.setValueIfNotActive(elem, this.url[funcName]());
                    if (funcName == "host") {
                        // measure width and set fixed size (to make more space for path)
                        this.adjustElementWidthToItsContent(elem);
                    }
                }
            }
            this.populateParams(setFocusOnLastParam);
        }
        setValueIfNotActive(elem, value) {
            // check if it isn't currently active element (we don't want to overwrite text which user might be typing still)
            if (elem != this.doc.activeElement) {
                // just in case we remove the error class
                elem.classList.remove("error");
                elem.value = value;
            }
        }
        populateParams(setFocusOnLastOne = false) {
            var param;
            var params = UrlEditor.Helpers.ge("params");
            // clean old set of params
            params.innerHTML = "";
            var longestName = 0, longestValue = 0, longestBoth = 0;
            var urlParams = this.url.params();
            for (var name in urlParams) {
                urlParams[name].forEach((value, valueIndex) => {
                    name = UrlEditor.Helpers.safeExecute(() => decodeURIComponent(name), "populateParams/decode name");
                    param = this.createNewParamContainer(name);
                    // parameter name field
                    param.nameElement.value = name;
                    // always encode/decode params by default
                    param.urlEncoded = true;
                    if (param.urlEncoded) {
                        value = UrlEditor.Helpers.safeExecute(() => decodeURIComponent(value), "populateParams/decode value") || value;
                    }
                    // parameter value field
                    param.valueElement.value = value;
                    param.valueElement["param-value-position"] = valueIndex;
                    // measuring
                    var nameWidth = this.getTextWidth(name);
                    if (nameWidth > longestName) {
                        longestName = nameWidth;
                    }
                    var valueWidth = this.getTextWidth(param.valueElement.value);
                    if (valueWidth > longestValue) {
                        longestValue = valueWidth;
                    }
                    var bothWidth = nameWidth + valueWidth;
                    if (bothWidth > longestBoth) {
                        longestBoth = bothWidth;
                    }
                    params.appendChild(param);
                });
            }
            longestBoth += paramsMarginSum;
            if (longestBoth > params.clientWidth) {
                this.doc.body.style.width = Math.min(longestBoth, maxClientWidth) + "px";
            }
            if (setFocusOnLastOne) {
                if (param) {
                    param.nameElement.focus();
                }
                else {
                    UrlEditor.Helpers.ge("hostname").focus();
                }
            }
        }
        createNewParamContainer(name) {
            var param = document.createElement("div");
            param.className = "param";
            param.innerHTML = '<input type="text" name="name" class="name" autocomplete="off" spellcheck="false" /> <input type="text" name="value" class="value" autocomplete="off" spellcheck="false" /> <input type="button" value="&#x270E;" />';
            // parameter name field
            param.nameElement = param.firstElementChild;
            // parameter value field
            param.valueElement = param.nameElement.nextElementSibling;
            param.isParamContainer = true;
            return param;
        }
        deleteParam(elem) {
            // try to get next or previous param container
            var paramToFocus = elem.nextElementSibling || elem.previousElementSibling;
            if (paramToFocus) {
                paramToFocus.nameElement.focus();
            }
            elem.parentElement.removeChild(elem);
            this.updateFields();
        }
        setErrorMessage(err, elem) {
            // setting error message
            UrlEditor.Helpers.ge("err").textContent = err ? "Error: " + err : "";
            // if DOM element was passed we're setting or removing the error indicator color
            if (elem) {
                if (err) {
                    elem.classList.add("error");
                }
                else {
                    elem.classList.remove("error");
                }
            }
        }
        getTextWidth(text) {
            this.measureElem.textContent = text;
            // spaces have to be replaced otherwise they won't increase the width
            this.measureElem.innerHTML = this.measureElem.innerHTML.replace(/ /g, "&nbsp;");
            return this.measureElem.offsetWidth;
        }
        adjustElementWidthToItsContent(elem) {
            var width = this.getTextWidth(elem.value || elem.textContent) + 12; // + 10 padding and +2 border
            elem.style.width = width + "px";
        }
        keyboardNavigation(evt) {
            switch (evt.keyCode) {
                case 9: // tab
                    return true;
                case 187: // = (+)
                    if (evt.ctrlKey) { // add new param
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AddParam, "keyboard");
                        this.addNewParamFields();
                        return true;
                    }
                    else {
                        // jump to param value elem
                        let paramContainer = evt.target.parentElement;
                        if (this.settings.autoJumpToValueOnEqual &&
                            paramContainer &&
                            paramContainer.isParamContainer &&
                            paramContainer.nameElement === evt.target) {
                            if (!paramContainer.hasJumpedToValueOnce) {
                                paramContainer.hasJumpedToValueOnce = true;
                                paramContainer.valueElement.focus();
                                // prevent from putting the char in the target field
                                evt.preventDefault();
                            }
                        }
                    }
                    break;
                case 189: // -
                    // delete current param
                    if (evt.ctrlKey) {
                        var parent = evt.target.parentElement;
                        // check if it is a param container element
                        if (parent && parent.isParamContainer) {
                            UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.RemoveParam, "keyboard");
                            this.deleteParam(parent);
                            return true;
                        }
                    }
                    break;
                case 79: // o
                    if (evt.ctrlKey) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Navigate, "keyboard", "options_page");
                        if (chrome.runtime.openOptionsPage) {
                            chrome.runtime.openOptionsPage();
                        }
                        else {
                            window.open(chrome.runtime.getURL("options.html"));
                        }
                    }
                    break;
                case 66: // b
                    if (evt.ctrlKey && UrlEditor.Helpers.isTextFieldActive()) {
                        var parent = evt.target.parentElement;
                        // check if it is a param container element
                        if (parent && parent.isParamContainer) {
                            UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Encoding, "keyboard", "base64");
                            var input = evt.target;
                            input.value = UrlEditor.Helpers.isBase64Encoded(input.value) ? UrlEditor.Helpers.b64DecodeUnicode(input.value) : UrlEditor.Helpers.b64EncodeUnicode(input.value);
                            this.updateFields();
                            return true;
                        }
                    }
                    break;
                case 83:
                    if (evt.ctrlKey) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Sort, "keyboard");
                        this.sortParameters();
                        // take focus of the input to trigger params refresh
                        evt.target.blur();
                        this.updateFields(false /*setUriFromFields*/);
                    }
                    break;
            }
            var elem = evt.target;
            if (evt.ctrlKey && [37, 38, 39, 40].indexOf(evt.keyCode) != -1) {
                var nextElem;
                UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Navigate, "keyboard", "fields");
                switch (evt.keyCode) {
                    case 38: // up
                        var nextContainer = elem.parentElement.previousElementSibling;
                        // we need to handle case when user would like to go from params collection to basic fields
                        if (elem.parentElement.parentElement.id == "params" && !nextContainer) {
                            nextContainer = elem.parentElement.parentElement.previousElementSibling;
                        }
                        nextElem = this.getElementInTheSameColumn(elem, nextContainer);
                        // if on full url field loop to the last available field on the bottom
                        if (!nextElem) {
                            let lastParamContainer = UrlEditor.Helpers.ge("params").lastElementChild;
                            if (lastParamContainer) {
                                nextElem = lastParamContainer.nameElement;
                            }
                            else {
                                nextElem = UrlEditor.Helpers.ge("hostname");
                            }
                        }
                        break;
                    case 40: // down
                        var nextContainer = elem.parentElement.nextElementSibling;
                        // we need to handle case when user would like to go from basic fields to params collection
                        if (nextContainer && nextContainer.id == "params") {
                            nextContainer = nextContainer.firstElementChild;
                        }
                        nextElem = this.getElementInTheSameColumn(elem, nextContainer);
                        // if on last param then loop to host or full url field
                        if (!nextElem) {
                            // take full url field if the current one is hostname
                            nextElem = UrlEditor.Helpers.ge(elem.id == "hostname" ? "full_url" : "hostname");
                        }
                        break;
                    case 37: // left
                        nextElem = elem.previousElementSibling;
                        break;
                    case 39: // right
                        nextElem = elem.nextElementSibling;
                        break;
                }
                evt.preventDefault();
                if (nextElem) {
                    nextElem.focus();
                }
                return true;
            }
            return false;
        }
        getElementInTheSameColumn(currentElem, container) {
            if (currentElem && container) {
                let textFieldElements = ["INPUT", "DIV"];
                let index = UrlEditor.Helpers.getIndexOfSiblingGivenType(currentElem, textFieldElements);
                return UrlEditor.Helpers.findNthElementOfType(container, textFieldElements, index);
            }
        }
        addNewParamFields() {
            var container = this.createNewParamContainer();
            // by default all new params are encoded
            container.urlEncoded = true;
            UrlEditor.Helpers.ge("params").appendChild(container);
            container.firstElementChild.focus();
        }
        sortParameters() {
            var sortedParams = {};
            var currentParams = this.url.params();
            Object.keys(currentParams).sort().forEach(name => {
                // sort values as well
                sortedParams[name] = currentParams[name].sort();
            });
            this.url.params(sortedParams);
        }
        autoSelectInputValue(input) {
            if (this.settings.autoSelectValue && UrlEditor.Helpers.isTextFieldActive() && input.id != "full_url") {
                input.selectionStart = 0;
                input.selectionEnd = input.value.length;
            }
        }
        setUriFromFields() {
            let currentInput = this.doc.activeElement;
            if (currentInput) {
                let func = this.mapIdToFunction[currentInput.id];
                if (func) {
                    this.url[func](currentInput.tagName == "INPUT" ? currentInput.value : currentInput.textContent);
                }
                else {
                    let params = {};
                    let paramsWrapper = UrlEditor.Helpers.ge("params");
                    [].forEach.call(paramsWrapper.childNodes, (container) => {
                        if (container.nameElement && container.nameElement.value != "") {
                            let paramName = this.encodeURIComponent(container.nameElement.value);
                            // make sure it exists
                            params[paramName] = params[paramName] || [];
                            let value = container.valueElement.value;
                            // force url-encoding if value contins ampersand
                            if (value.indexOf("&") != -1 && !container.base64Encoded) {
                                container.urlEncoded = true;
                            }
                            // check if we should encode it
                            if (container.base64Encoded) {
                                if (UrlEditor.Helpers.isBase64Encoded(value)) {
                                    // sometimes string can only look like a base64 encoded and in such cases exception can be thrown
                                    try {
                                        container.valueElement.value = UrlEditor.Helpers.b64DecodeUnicode(value);
                                    }
                                    catch (e) {
                                        value = UrlEditor.Helpers.b64EncodeUnicode(value);
                                    }
                                }
                                else {
                                    value = UrlEditor.Helpers.b64EncodeUnicode(value);
                                }
                            }
                            // we always need to urlencode base64 values (because of the '=' chars)
                            if (container.urlEncoded || container.base64Encoded) {
                                value = this.encodeURIComponent(value);
                            }
                            params[paramName].push(value);
                        }
                    });
                    this.url.params(params);
                }
            } // if
        } // function
        /**
         * Does URI encoding but leaves "+"
         */
        encodeURIComponent(value) {
            return encodeURIComponent(value).replace(/%2B/g, "+");
        }
    } // class
    UrlEditor.ViewModel = ViewModel;
})(UrlEditor || (UrlEditor = {})); // module
