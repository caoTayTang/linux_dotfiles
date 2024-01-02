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
///<reference path="../modules/autosuggest.ts" />
///<reference path="../shared/autosuggest.shared.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        var Suggestions;
        (function (Suggestions) {
            const UNBIND = "[Unbind] ";
            const HOST_ALIAS_KEY = "[suggestionAlias]";
            const Page = UrlEditor.Shared.AutoSuggest.Page;
            const AutoSuggestData = UrlEditor.Shared.AutoSuggest.Data;
            let autoSuggestData;
            let settings;
            let domainsElem;
            let paramNamesElem;
            let bindToDomainElem;
            let paramValuesContainer;
            function init(setts) {
                settings = setts;
                let recentlyUsedParamsModule = UrlEditor.Helpers.ge("recentlyUsedParamsModule");
                recentlyUsedParamsModule.addEventListener("click", handleClick);
                recentlyUsedParamsModule.addEventListener("change", evt => handleChange(evt.target));
                domainsElem = UrlEditor.Helpers.ge("autoSuggestPages");
                paramNamesElem = UrlEditor.Helpers.ge("autoSuggestParams");
                bindToDomainElem = UrlEditor.Helpers.ge("autoSuggestPageToBind");
                paramValuesContainer = UrlEditor.Helpers.ge("autoSuggestParamValues");
                autoSuggestData = new AutoSuggestData(settings);
                resetFields();
            }
            Suggestions.init = init;
            function confirmWrapper(message) {
                return confirm(message);
            }
            Suggestions.confirmWrapper = confirmWrapper;
            function handleChange(elem) {
                switch (elem.tagName) {
                    case "SELECT":
                        handleSelect(elem);
                        break;
                    case "INPUT":
                        let input = elem;
                        if (input.name == "import_data") {
                            importSuggestionsData(input);
                        }
                        break;
                }
            }
            function handleClick(evt) {
                let elem = evt.target;
                if (elem.tagName == "INPUT") {
                    switch (elem.name) {
                        case "saveBinding":
                            if (saveBinding()) {
                                domainsElem.selectedIndex = 0;
                                handleSelect(domainsElem);
                            }
                            break;
                        case "delete":
                            handleSuggestionDelete(elem);
                            break;
                        case "export_data":
                            exportSuggestionsData();
                            break;
                    }
                }
            }
            function handleSelect(elem) {
                let page;
                if (elem.tagName == "SELECT") {
                    switch (elem.name) {
                        case "page":
                            if (elem.value.startsWith("--")) {
                                resetFields(/*skipDomains*/ true);
                                return;
                            }
                            page = autoSuggestData.getPage(elem.value);
                            populateComboBox(paramNamesElem, page.getParamNames(), "-- select param --", elem.value);
                            // clear param list
                            paramValuesContainer.innerHTML = "";
                            let selectedIndex = 0;
                            let defaultText = "-- select website to (un)bind --";
                            let filteredWebsites = autoSuggestData.getDomains()
                                // remove subject page
                                .filter(x => x != elem.value && (!page.isAlias(x) || page.getTopDomain(x) == elem.value))
                                // add "unbind" if bind already
                                .map(x => {
                                if (x == page.getTopDomain() || page.getTopDomain(x) == elem.value) {
                                    x = "[Unbind] " + x;
                                }
                                return x;
                            });
                            populateComboBox(bindToDomainElem, filteredWebsites, defaultText, elem.value, selectedIndex);
                            break;
                        case "param":
                            let domainName = elem["source"];
                            page = autoSuggestData.getPage(domainName);
                            let paramData = page.getParamValues(elem.value) || [];
                            // clear param list
                            paramValuesContainer.innerHTML = "";
                            paramData.forEach(value => {
                                let paramVal = document.createElement("div");
                                let input = document.createElement("input");
                                input.type = "text";
                                input.disabled = true;
                                input.value = value;
                                input.name = "paramValue";
                                paramVal.appendChild(input);
                                let deleteBtn = document.createElement("input");
                                deleteBtn.type = "button";
                                deleteBtn.value = "Delete";
                                deleteBtn.name = "delete";
                                paramVal.appendChild(deleteBtn);
                                paramValuesContainer.appendChild(paramVal);
                            });
                            break;
                    }
                }
            }
            function handleSuggestionDelete(elem) {
                if (!autoSuggestData.exists(domainsElem.value)) {
                    // gracefully fail
                    return;
                }
                let saveData = false;
                let page = autoSuggestData.getPage(domainsElem.value);
                let subjectElem = elem.previousElementSibling;
                // check if deleting page
                if (subjectElem == domainsElem) {
                    let message = "Do you want to dletete all (" + page.getParamNames().length + ") parameters for page: " + subjectElem.value;
                    if (page.isAlias() || Suggestions.confirmWrapper(message)) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "delete page data");
                        page.delete();
                        // remove element from the list
                        let select = subjectElem;
                        select.remove(select.selectedIndex);
                        // remove all param values
                        let paramsSelect = paramNamesElem;
                        paramNamesElem.innerHTML = "";
                        paramNamesElem.value = "";
                        // remove all visible values
                        paramValuesContainer.innerHTML = "";
                        saveData = true;
                    }
                }
                // check if deleting param
                else if (subjectElem == paramNamesElem && page.getParams()[paramNamesElem.value]) {
                    let message = "Do you want to detete all (" + page.getParamValues(paramNamesElem.value).length + ") values together with parameter: " + subjectElem.value;
                    if (Suggestions.confirmWrapper(message)) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "delete param data");
                        page.deleteParam(paramNamesElem.value);
                        // remove element from the list
                        let select = subjectElem;
                        select.remove(select.selectedIndex);
                        // remove all visible values
                        paramValuesContainer.innerHTML = "";
                        saveData = true;
                    }
                }
                // check if deleting value
                else if (page.getParamValues(paramNamesElem.value).indexOf(subjectElem.value) != -1) {
                    if (Suggestions.confirmWrapper("Do you want to delete '" + subjectElem.value + "' value from param '" + paramNamesElem.value + "'")) {
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.AutoSuggest, "delete param value");
                        page.deleteParamValue(paramNamesElem.value, subjectElem.value);
                        subjectElem.parentElement.parentElement.removeChild(subjectElem.parentElement);
                        saveData = true;
                    }
                }
                if (saveData) {
                    autoSuggestData.save();
                }
            }
            function populateComboBox(combo, data, defaultValue = "--", comboSource = "", selectedIndex = undefined) {
                combo.innerHTML = "";
                combo["source"] = comboSource;
                data = data || [];
                // add dummy element on the beginning
                data.unshift(defaultValue);
                data.forEach(optionValue => {
                    let option = document.createElement("option");
                    option.value = option.textContent = optionValue;
                    combo.appendChild(option);
                });
                if (selectedIndex != undefined) {
                    combo.selectedIndex = selectedIndex;
                }
            }
            function saveBinding() {
                let subjectPage = domainsElem.value;
                let targetPage = bindToDomainElem.value;
                let unbinding = false;
                if (subjectPage.startsWith("-- ") || targetPage.startsWith("-- ")) {
                    console.warn("Bind subject must be a valid, existing page");
                    return false;
                }
                if (targetPage.startsWith(UNBIND)) {
                    targetPage = targetPage.substr(UNBIND.length);
                    unbinding = true;
                }
                if (targetPage && autoSuggestData.exists(targetPage)) {
                    if (unbinding) {
                        autoSuggestData.getPage(subjectPage).unbind(targetPage);
                    }
                    else {
                        autoSuggestData.getPage(subjectPage).bindWith(targetPage);
                    }
                    autoSuggestData.save();
                }
                return true;
            }
            function exportSuggestionsData() {
                let json = JSON.stringify(autoSuggestData.getData(), null, 2), blob = new Blob([json], { type: "application/json" }), url = window.URL.createObjectURL(blob), a = document.createElement("a");
                a.style.display = "none";
                a.href = url;
                a.download = "UrlEditorPro_SuggestionsData.json";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
            function importSuggestionsData(input) {
                if (!input.files || !input.files.length) {
                    return;
                }
                let file = input.files[0];
                let reader = new FileReader();
                // Closure to capture the file information.
                reader.onload = function (evt) {
                    let data;
                    try {
                        data = JSON.parse(evt.target.result);
                    }
                    catch (err) {
                        alert("Import failed. Failed to parse file content. \n\n" + err.message);
                        return;
                    }
                    autoSuggestData.setData(data).save();
                    alert("Import succeessful");
                    resetFields();
                };
                // Read in the image file as a data URL.
                reader.readAsText(file);
            }
            function resetFields(skipDomains = false) {
                if (!skipDomains) {
                    populateComboBox(domainsElem, autoSuggestData.getDomains(), "-- select domain --");
                }
                populateComboBox(paramNamesElem, [], "-- select domain first --");
                populateComboBox(bindToDomainElem, [], "-- select domain first --");
                paramValuesContainer.innerHTML = "";
            }
        })(Suggestions = Options.Suggestions || (Options.Suggestions = {}));
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="interfaces.shared.d.ts" />
var UrlEditor;
(function (UrlEditor) {
    let Plugins;
    (function (Plugins) {
        Plugins.ViewModel = [];
        Plugins.Background = [];
    })(Plugins = UrlEditor.Plugins || (UrlEditor.Plugins = {}));
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
var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        class Validator {
            constructor(output) {
                this.isValid = true;
                this.errorMessages = [];
                this.markedFields = [];
                this.outputElem = typeof (output) == "string" ? UrlEditor.Helpers.ge(output) : output;
                if (this.outputElem) {
                    this.outputElem.textContent = "";
                }
            }
            isNotEmpty(elem, mark = true) {
                return this.isValidCustom(elem, () => elem.value != "", `Field "${elem.previousSibling.textContent}" cannot be empty.`, mark);
            }
            isNumber(elem, allowEmptyVal = true, mark = true) {
                let parsedVal = parseInt(elem.value);
                return this.isValidCustom(elem, () => (elem.value == "" && allowEmptyVal) || parsedVal.toString() == elem.value, `Field "${elem.previousSibling.textContent}" is not a number.`, mark);
            }
            isValidCustom(elem, isValid, errorMessage, mark = true) {
                let valid = isValid(elem.value);
                if (mark) {
                    if (valid) {
                        elem.classList.remove("not_valid");
                    }
                    else {
                        this.markedFields.push(elem);
                        elem.classList.add("not_valid");
                    }
                }
                if (!valid) {
                    this.addError(errorMessage);
                }
                if (!valid) {
                    this.isValid = false;
                }
                return valid;
            }
            clear() {
                this.markedFields.forEach(f => f.classList.remove("not_valid"));
            }
            addError(msg) {
                this.errorMessages.push(msg);
                if (this.outputElem) {
                    if (this.outputElem.textContent) {
                        msg = "\n" + msg;
                    }
                    this.outputElem.textContent += msg;
                }
            }
        }
        Options.Validator = Validator;
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
///<reference path="../validator.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        var Redirection;
        (function (Redirection) {
            let elems = {
                container: null,
                testUrl: null,
                resultUrl: null,
                name: null,
                urlFilter: null,
                isAutomatic: null,
                hotKey: null,
                protocol: null,
                hostname: null,
                port: null,
                path: null,
                addParam: null,
                addReplaceString: null,
                regExp: null,
                isRegExpGlobal: null,
                replaceString: null,
                submit: null,
                deleteRule: null,
                cancel: null,
                slider: null,
                errorMessages: null
            };
            const commonFileds = ["name", "urlFilter", "isAutomatic"];
            const simpleRuleFields = ["hotKey", "protocol", "hostname", "port", "path"];
            class RuleEditor {
                constructor(manager, onSave) {
                    this.manager = manager;
                    this.onSave = onSave;
                }
                open(ruleData, advanced = false) {
                    if (!elems.name) {
                        this.initializeStaticFields();
                    }
                    if (advanced || (ruleData && ruleData.regExp)) {
                        elems.container.classList.add("adv");
                        this.isAdvanced = true;
                    }
                    this.ruleData = ruleData;
                    if (this.ruleData) {
                        this.populateFormFields(this.ruleData);
                    }
                    elems.slider.style.left = "-100%";
                    elems.deleteRule.disabled = !this.ruleData;
                }
                close() {
                    this.clearFields();
                    elems.slider.style.left = "";
                }
                save(deleteCurrentRule = false) {
                    this.manager.save(deleteCurrentRule ? null : this.getReplaceData(), this.ruleData ? this.ruleData.name : null);
                    this.close();
                    this.onSave();
                    chrome.runtime.sendMessage(UrlEditor.Command.ReloadRedirectionRules);
                }
                handleClick(evt) {
                    switch (evt.target.name) {
                        case "addParam":
                            this.addDoubleInputFields(elems.addParam, "params");
                            break;
                        case "addReplaceString":
                            this.addDoubleInputFields(elems.addReplaceString, "strings");
                            break;
                        case "cancel":
                            this.close();
                            break;
                        case "submit":
                            this.save();
                            break;
                        case "deleteRule":
                            this.save(true /*deleteCurrentRule*/);
                            break;
                    }
                    evt.stopPropagation();
                }
                handleChange(evt) {
                    evt.stopPropagation();
                    this.validateEditFields();
                }
                initializeStaticFields() {
                    elems.container = UrlEditor.Helpers.ge("rules_editor");
                    let resultNodes = elems.container.querySelectorAll("textarea, input");
                    let editElementsNames = Object.keys(elems);
                    for (let i = 0, field; field = resultNodes[i]; i++) {
                        if (editElementsNames.indexOf(field.name) != -1) {
                            elems[field.name] = field;
                        }
                    }
                    elems.slider = elems.container.parentElement;
                    elems.errorMessages = UrlEditor.Helpers.ge("errorMessages");
                    elems.hotKey.addEventListener("keydown", evt => this.handleHotKeyAssignment(evt));
                    elems.container.addEventListener("click", evt => this.handleClick(evt));
                    elems.container.addEventListener("input", evt => this.handleChange(evt));
                }
                clearFields() {
                    this.ruleData = null;
                    commonFileds.concat(simpleRuleFields).forEach(name => {
                        if (elems[name].checked === true) {
                            elems[name].checked = false;
                        }
                        elems[name].value = "";
                    });
                    elems.errorMessages.innerHTML = "";
                    elems.submit.disabled = true;
                    if (this.isAdvanced) {
                        let row = elems.regExp.parentElement.previousElementSibling;
                        while (row.nextElementSibling) {
                            let input = row.nextElementSibling.getElementsByTagName("input")[0];
                            input.value = "";
                            if (row.nextElementSibling.classList.contains("replace_groups")) {
                                row.parentElement.removeChild(row.nextElementSibling);
                            }
                            else {
                                row = row.nextElementSibling;
                            }
                        }
                        this.isAdvanced = false;
                        elems.container.classList.remove("adv");
                    }
                    else {
                        elems.container.querySelectorAll(".params").forEach(e => e.parentElement.removeChild(e));
                        elems.container.querySelectorAll(".strings").forEach(e => e.parentElement.removeChild(e));
                    }
                    if (this.validator) {
                        // remove all plugins
                        this.validator.clear();
                    }
                }
                populateFormFields(ruleData) {
                    let regExpRuleAlias = ruleData;
                    let redirRuleAlias = ruleData;
                    if (ruleData.disabledReason) {
                        elems.errorMessages.textContent = this.ruleData.disabledReason;
                    }
                    let fieldsToPopulate = simpleRuleFields.concat(commonFileds);
                    if (this.isAdvanced) {
                        fieldsToPopulate.push("regExp", "isRegExpGlobal", "replaceString");
                    }
                    // populate basic fields
                    fieldsToPopulate.forEach(name => {
                        if (ruleData[name] != undefined) {
                            if (elems[name].type == "checkbox") {
                                elems[name].checked = ruleData[name];
                            }
                            else {
                                elems[name].value = ruleData[name];
                            }
                        }
                        else {
                            // clear field
                            if (elems[name].type == "checkbox") {
                                elems[name].checked = false;
                            }
                            else {
                                elems[name].value = "";
                            }
                        }
                    });
                    if (this.isAdvanced) {
                        if (regExpRuleAlias.replaceValues) {
                            this.getGroupReplacementDataAndUpdateFields(regExpRuleAlias);
                        }
                    }
                    else {
                        // get param replacement fields
                        if (redirRuleAlias.paramsToUpdate) {
                            Object.keys(redirRuleAlias.paramsToUpdate).forEach(name => this.addDoubleInputFields(elems.addParam, "params", name, redirRuleAlias.paramsToUpdate[name]));
                        }
                        // get string replace fields
                        if (redirRuleAlias.strReplace) {
                            redirRuleAlias.strReplace.forEach(replaceSet => this.addDoubleInputFields(elems.addReplaceString, "strings", replaceSet[0], replaceSet[1]));
                        }
                    }
                }
                getRegExpRuleData() {
                    let result = {
                        name: "",
                        urlFilter: "",
                        regExp: elems.regExp.value,
                        isRegExpGlobal: elems.isRegExpGlobal.checked
                    };
                    commonFileds.forEach(e => {
                        let value = null;
                        if (elems[e].type == "checkbox") {
                            result[e] = !!elems[e].checked;
                        }
                        else {
                            if (elems[e].value != "") {
                                result[e] = elems[e].value;
                            }
                        }
                    });
                    let regExpElem = elems.regExp;
                    if (document.activeElement == regExpElem || // if someone is editing regex rule
                        // or changing replace values or saves
                        ["groupVal", "replaceString", "submit"].indexOf(document.activeElement.getAttribute("name")) != -1) {
                        result.replaceValues = this.getGroupReplacementDataAndUpdateFields(result);
                    }
                    if (elems.replaceString.value != "") {
                        result.replaceString = elems.replaceString.value;
                    }
                    return result;
                }
                getGroupReplacementDataAndUpdateFields(ruleData) {
                    let regExpElem = elems.regExp;
                    let rowGroupValElem = regExpElem.parentElement;
                    let result;
                    let r = new UrlEditor.RegExpGroupReplacer(ruleData.regExp, ruleData.isRegExpGlobal);
                    // check if we should add fields
                    if (r.groupsCount > 0) {
                        result = result || [];
                        for (let i = 0; i < r.groupsCount; i++) {
                            // if there is no next element we need to create it
                            if (!rowGroupValElem.nextElementSibling ||
                                // if the next one is not correct type
                                !rowGroupValElem.nextElementSibling.classList.contains("replace_groups")) {
                                let funcName;
                                let funcArg;
                                if (ruleData.replaceValues && ruleData.replaceValues[i]) {
                                    funcName = ruleData.replaceValues[i].func;
                                    funcArg = ruleData.replaceValues[i].val;
                                }
                                let newRow = document.createElement("div");
                                newRow.className = "advanced replace_groups";
                                newRow.innerHTML = `
                        <label>Value</label>
                        <select name="groupFunc">
                            ${this.getGroupFunctionOptions(funcName)}
                        </select>
                        <input type="text" name="groupVal" value="${funcArg}" />`;
                                this.insertAfter(rowGroupValElem.parentElement, newRow, rowGroupValElem);
                                rowGroupValElem = newRow;
                                result.push({ func: "replaceWith", val: "" });
                            }
                            else {
                                rowGroupValElem = rowGroupValElem.nextElementSibling;
                                // add form values to data obj
                                result.push({
                                    func: rowGroupValElem.children[1]["value"],
                                    val: rowGroupValElem.children[2]["value"]
                                });
                            }
                        }
                    }
                    // remove redundant fields
                    while (rowGroupValElem.nextElementSibling && rowGroupValElem.nextElementSibling.classList.contains("replace_groups")) {
                        rowGroupValElem.parentElement.removeChild(rowGroupValElem.nextElementSibling);
                    }
                    return result;
                }
                getGroupFunctionOptions(selectedFunction) {
                    return Object.keys(UrlEditor.RedirectRule.converters).reduce((prev, curr, index, arr) => `${prev}<option value="${curr}"${curr == selectedFunction ? " selected" : ""}>${curr}</option>`, "");
                }
                insertAfter(parentElem, newChild, refChild) {
                    if (refChild.nextElementSibling) {
                        parentElem.insertBefore(newChild, refChild.nextElementSibling);
                    }
                    else {
                        parentElem.appendChild(newChild);
                    }
                }
                getReplaceData() {
                    if (this.isAdvanced) {
                        return this.getRegExpRuleData();
                    }
                    let result = { name: "", urlFilter: "" };
                    simpleRuleFields.concat(commonFileds).forEach(e => {
                        let value = null;
                        if (elems[e].type == "checkbox") {
                            result[e] = !!elems[e].checked;
                        }
                        else {
                            if (elems[e].value != "") {
                                result[e] = elems[e].value;
                            }
                        }
                    });
                    let paramInputs = elems.container.querySelectorAll(".params input[name='field1'], .params input[name='field2']");
                    for (var i = 0; i < paramInputs.length; i += 2) {
                        let nameElem = paramInputs[i];
                        if (nameElem.value) {
                            let valueElem = paramInputs[i + 1];
                            result.paramsToUpdate = result.paramsToUpdate || {};
                            result.paramsToUpdate[nameElem.value] = valueElem.disabled ? null : valueElem.value;
                        }
                    }
                    let strReplaceInputs = elems.container.querySelectorAll(".strings input[name='field1'], .strings input[name='field2']");
                    for (var i = 0; i < strReplaceInputs.length; i += 2) {
                        let nameElem = strReplaceInputs[i];
                        if (nameElem.value) {
                            let valueElem = strReplaceInputs[i + 1];
                            result.strReplace = result.strReplace || [];
                            result.strReplace.push([nameElem.value, valueElem.value]);
                        }
                    }
                    return result;
                }
                validateEditFields() {
                    const pattern = /^(\*|https?|file|ftp):\/\/\/?(\*|\*\.[^.][^\/\/:*?"<>|]+|[^.][^\/\/:*?"<>|]+)\/(\*$|.+)$/;
                    this.validator = new Options.Validator(elems.errorMessages);
                    if (!this.validator.isNotEmpty(elems.name) || !this.validator.isNotEmpty(elems.urlFilter)) {
                        return;
                    }
                    this.validator.isNumber(elems.port);
                    let proceed = this.validator.isValidCustom(elems.urlFilter, val => pattern.test(val), "Invalid filter pattern. Look at: https://developer.chrome.com/extensions/match_patterns");
                    if (this.isAdvanced) {
                        proceed = this.validator.isNotEmpty(elems.regExp) && proceed;
                    }
                    if (proceed) {
                        let data = this.getReplaceData();
                        if (elems.testUrl.value != "") {
                            let redir = new UrlEditor.RedirectRule(data);
                            if (this.validator.isValidCustom(elems.urlFilter, () => redir.isUrlSupported(elems.testUrl.value), "Filter is not passing on given test url")) {
                                elems.resultUrl.textContent = redir.getUpdatedUrl(elems.testUrl.value);
                            }
                        }
                    }
                    elems.submit.disabled = !this.validator.isValid;
                }
                addDoubleInputFields(buttonElem, className, field1Val = "", field2Val = "") {
                    let newRow = document.createElement("div");
                    newRow.className = className;
                    let label = document.createElement("label");
                    label.style.visibility = "hidden";
                    newRow.appendChild(label);
                    let container = document.createElement("div");
                    container.className = "split-half";
                    let field1 = document.createElement("input");
                    field1.type = "text";
                    field1.name = "field1";
                    field1.value = field1Val;
                    container.appendChild(field1);
                    let field2 = document.createElement("input");
                    field2.type = "text";
                    field2.name = "field2";
                    field2.value = field2Val === null ? "[null]" : field2Val;
                    field2.disabled = field2Val === null;
                    container.appendChild(field2);
                    newRow.appendChild(container);
                    let nullBtn = document.createElement("input");
                    nullBtn.type = "button";
                    nullBtn.value = "null";
                    nullBtn.className = "small";
                    nullBtn.addEventListener("click", () => {
                        if (field2.disabled) {
                            field2.disabled = false;
                            field2.value = "";
                        }
                        else {
                            field2.disabled = true;
                            field2.value = "[null]";
                        }
                        this.validateEditFields();
                    });
                    newRow.appendChild(nullBtn);
                    let rowContainer = buttonElem.parentElement.parentElement;
                    let button = document.createElement("input");
                    button.type = "button";
                    button.value = "-";
                    button.className = "small";
                    button.addEventListener("click", () => {
                        rowContainer.removeChild(newRow);
                        this.validateEditFields();
                    });
                    newRow.appendChild(button);
                    rowContainer.insertBefore(newRow, buttonElem.parentElement.nextElementSibling);
                }
                handleHotKeyAssignment(evt) {
                    // we don't want the box to be manually edited
                    evt.preventDefault();
                    if (evt.keyCode == 8) {
                        elems.hotKey.value = "";
                    }
                    if ((evt.ctrlKey || evt.altKey) && [17, 18].indexOf(evt.keyCode) == -1) {
                        let result = "";
                        result += evt.ctrlKey ? "Ctrl + " : "";
                        result += evt.shiftKey ? "Shift + " : "";
                        result += evt.altKey ? "Alt + " : "";
                        result += evt.keyCode; //String.fromCharCode(evt.keyCode);
                        elems.hotKey.value = result;
                    }
                }
            }
            Redirection.RuleEditor = RuleEditor;
        })(Redirection = Options.Redirection || (Options.Redirection = {}));
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
///<reference path="../shared/autosuggest.shared.ts" />
///<reference path="../modules/helpers.ts" />
///<reference path="../modules/redirection.ts" />
///<reference path="redirection/ruleeditor.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        var Redirection;
        (function (Redirection) {
            let settings;
            let redirManager;
            let ruleEditor;
            let editElems = {
                redirectionsModule: null,
                rulesList: null,
                addRule: null
            };
            function init(setts) {
                settings = setts;
                editElems.redirectionsModule = UrlEditor.Helpers.ge("redirectionsModule");
                editElems.redirectionsModule.addEventListener("click", handleClick);
                redirManager = new UrlEditor.RedirectionManager(setts);
                editElems.rulesList = UrlEditor.Helpers.ge("rules_list");
                ruleEditor = new Redirection.RuleEditor(redirManager, () => populateRulesList());
                populateRulesList();
            }
            Redirection.init = init;
            function handleClick(evt) {
                let evtTarget = evt.target;
                if (evtTarget.tagName != "INPUT") {
                    return;
                }
                switch (evtTarget.name) {
                    case "addRule":
                        ruleEditor.open();
                        break;
                    case "addRuleRegEx":
                        ruleEditor.open(null, true /*advanced*/);
                }
            }
            function populateRulesList() {
                let data = redirManager.getData();
                editElems.rulesList.innerHTML = "";
                Object.keys(data).forEach(name => {
                    let ruleData = data[name];
                    let li = document.createElement("li");
                    if (ruleData.disabledReason) {
                        li.setAttribute("class", "disabled");
                    }
                    let nameElem = document.createElement("div");
                    nameElem.textContent = name;
                    nameElem.title = nameElem.textContent;
                    li.appendChild(nameElem);
                    let filterElem = document.createElement("div");
                    filterElem.textContent = ruleData.urlFilter;
                    filterElem.title = filterElem.textContent;
                    li.appendChild(filterElem);
                    li.addEventListener("click", evt => {
                        // prevent from calling the regular handler
                        evt.stopPropagation();
                        ruleEditor.open(ruleData);
                    });
                    editElems.rulesList.appendChild(li);
                });
            }
        })(Redirection = Options.Redirection || (Options.Redirection = {}));
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
/// <reference path="modules/settings.ts" />
/// <reference path="modules/autosuggest.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="options/suggestions.ts" />
/// <reference path="options/redirection.ts" />
var UrlEditor;
(function (UrlEditor) {
    var Options;
    (function (Options) {
        var settings;
        var autoSuggestData;
        let onInitializedHandlers = [];
        /**
         * Automatically populates input fields if their name matches setting name.
         */
        function initialize(storage) {
            let version = chrome.runtime.getManifest().version;
            settings = new UrlEditor.Settings(storage);
            // it is better to set variable before page view event (init)
            UrlEditor.Tracking.setCustomDimension(UrlEditor.Tracking.Dimension.Version, version);
            UrlEditor.Tracking.init(settings.trackingEnabled, "/options.html", true, version);
            document.body.addEventListener("change", evt => onChangeHandler(evt));
            document.body.addEventListener("click", evt => onClickHandler(evt));
            var inputs = document.getElementsByTagName("INPUT");
            for (var i = 0, input; input = inputs[i]; i++) {
                if (input.name && settings[input.name] != undefined) {
                    switch (input.type) {
                        case "checkbox":
                            input.checked = settings[input.name];
                            toggleRelatedElem(input);
                            break;
                        case "radio":
                            if (input.value == settings[input.name]) {
                                input.checked = true;
                                toggleRelatedElem(input);
                            }
                            break;
                    }
                }
            }
            let commandToElemIDMap = {
                "_execute_browser_action": "action-shortcut",
                "GoToHomepage": "goToHome-shortcut",
                "RedirectUseFirstRule": "redirect-shortcut"
            };
            // populate all global commands/shortcuts
            chrome.commands.getAll(commands => {
                commands.forEach(command => {
                    if (commandToElemIDMap[command.name]) {
                        let shortcut = command.shortcut;
                        if (shortcut) {
                            let elem = UrlEditor.Helpers.ge(commandToElemIDMap[command.name]);
                            elem.innerHTML = ""; // removing default link to settings
                            elem.innerText = command.shortcut;
                        }
                    }
                });
            });
            UrlEditor.Helpers.find("[data-link]").forEach(elem => elem.addEventListener("click", () => chrome.tabs.update({ url: elem.getAttribute("data-link") })));
            Options.Suggestions.init(settings);
            Options.Redirection.init(settings);
        }
        function onChangeHandler(evt) {
            var elem = evt.target;
            if (elem.tagName == "INPUT" && settings[elem.name] != undefined) {
                // save setting
                switch (elem.type) {
                    case "checkbox":
                        settings.setValue(elem.name, elem.checked);
                        UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Settings, elem.name, elem.checked.toString());
                        toggleRelatedElem(elem);
                        break;
                    case "radio":
                        if (elem.checked) {
                            UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Settings, elem.name, elem.value);
                            settings.setValue(elem.name, elem.value);
                        }
                        toggleRelatedElem(elem);
                        break;
                }
                // apply setting
                switch (elem.name) {
                    case "icon":
                        chrome.browserAction.setIcon({
                            path: elem.value
                        });
                        break;
                }
            }
        }
        function onClickHandler(evt) {
            var elem = evt.target;
            // general click tracking
            if (elem.getAttribute) {
                var trackId = elem.getAttribute("track");
                if (trackId) {
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Settings, trackId);
                }
            }
        }
        function toggleRelatedElem(elem) {
            var paramsAttr = elem.getAttribute("toggleElem"); // format: elemId[|show/hide]
            if (paramsAttr) {
                var params = paramsAttr.split("|");
                var toggleElem = document.getElementById(params[0]);
                var forceValue = params[1];
                if (forceValue == undefined) {
                    toggleElem.style.display = elem.checked ? "block" : "none";
                }
                else {
                    toggleElem.style.display = forceValue.toLowerCase() == "show" ? "block" : "none";
                }
            }
        }
        document.addEventListener(window.top == window.self && !window["__karma__"] ? "DOMContentLoaded" : "init", (evt) => initialize(evt.detail || localStorage));
    })(Options = UrlEditor.Options || (UrlEditor.Options = {}));
})(UrlEditor || (UrlEditor = {}));
