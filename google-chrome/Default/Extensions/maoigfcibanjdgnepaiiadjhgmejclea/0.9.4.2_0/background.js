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
/// <reference path="modules/settings.ts" />
/// <reference path="modules/url_parser.ts" />
/// <reference path="modules/redirection.ts" />
/// <reference path="modules/helpers.ts" />
/// <reference path="modules/tracking.ts" />
/// <reference path="../../typings/index.d.ts" />
/// <reference path="shared/interfaces.shared.d.ts" />
/// <reference path="shared/shared.ts" />
var UrlEditor;
(function (UrlEditor) {
    /**
     * Background (plugin manager)
     *
     * Problem which is being addressed here is lack of native mechanism of adding action context menu for single page/tab/url.
     * In addition it allows to subscribe to events like tabNavigate which does not exist natively.
     *
     * To avoid cluttering and mixing logic class supports plugins which should be used to implement specific functionalities.
     */
    class Background {
        constructor(settings = new UrlEditor.Settings(localStorage)) {
            this.settings = settings;
            this.eventListeners = {};
            this.contextMenus = {};
            let version = chrome.runtime.getManifest().version;
            // it is better to set variable before page view event (init)
            UrlEditor.Tracking.setCustomDimension(UrlEditor.Tracking.Dimension.Version, version);
            UrlEditor.Tracking.init(this.settings.trackingEnabled, "/background.html", false /*logEventsOnce*/, version);
            // Refresh context menu when user switches tabs
            this.addEventListener("tabChange", () => this.initializeContextMenu());
            // Refresh context menu on navigate action
            this.addEventListener("tabNavigate", () => this.initializeContextMenu());
            chrome.commands.onCommand.addListener(cmd => this.handleKeyboardCommand(cmd));
            chrome.tabs.onActivated.addListener(activeInfo => this.triggerEvent("tabChange", activeInfo.tabId));
            chrome.tabs.onUpdated.addListener((tabId, changedInfo) => changedInfo.url && this.triggerEvent("tabNavigate", tabId, changedInfo.url));
            UrlEditor.Plugins.Background.forEach(plugin => new plugin(settings, this));
        }
        /**
         * Adds event listener.
         * @param name Event name.
         * @param handler Evend callback function.
         */
        addEventListener(name, handler) {
            if (!this.eventListeners[name]) {
                this.eventListeners[name] = [];
            }
            this.eventListeners[name].push(handler);
        }
        /**
         * Registers new context menu item.
         * @param props Context menu item properties.
         */
        addActionContextMenuItem(props) {
            let tabId = (props.tabId || -1).toString();
            if (!this.contextMenus[tabId]) {
                this.contextMenus[tabId] = {};
            }
            if (!this.contextMenus[tabId][props.group]) {
                this.contextMenus[tabId][props.group] = {};
            }
            if (this.contextMenus[tabId][props.group][props.label]) {
                throw new Error(`Context menu item exists already [${tabId}|${props.group}|${props.label}]`);
            }
            this.contextMenus[tabId][props.group][props.label] = {
                title: props.label,
                contexts: ["browser_action"],
                onclick: props.clickHandler,
                isEnabled: (tab) => !props.isEnabled || props.isEnabled(tab)
            };
            this.throttledContextMenuInit();
        }
        /**
         * Returns active/enabled action-contextmenu items.
         * @param tab Tab for which context menu items should be returned.
         * @param group Context menu items group.
         */
        getActiveActionContextMenuItems(tab, group) {
            if (!this.contextMenus[tab.id] || !this.contextMenus[group]) {
                return [];
            }
            let groupItems = this.contextMenus[tab.id][group];
            return Object.keys(groupItems)
                .map(label => groupItems[label].isEnabled(tab) ? groupItems[label] : null)
                .filter(val => val !== null);
        }
        /**
         * Unregisters context menu item or group.
         * @param group Context menu item group.
         * @param label Context menu item label.
         * @param tabId Context menu item tab id.
         */
        removeActionContextMenuItem(group, label = null, tabId = -1) {
            let tabContextMenu = this.contextMenus[tabId.toString()];
            if (!tabContextMenu ||
                !tabContextMenu[group]) {
                // it looks like it is removed already
                return;
            }
            if (label == null) {
                // remove entire group
                delete tabContextMenu[group];
            }
            else if (tabContextMenu[group][label]) {
                delete tabContextMenu[group][label];
            }
            this.throttledContextMenuInit();
        }
        /**
         * Handle keyboard commands / shortcuts.
         * @param command Command type.
         */
        handleKeyboardCommand(command) {
            switch (command) {
                case UrlEditor.Command.GoToHomepage:
                    UrlEditor.Tracking.trackEvent(UrlEditor.Tracking.Category.Redirect, "keyboard", "homepage");
                    UrlEditor.Helpers.getActiveTab(tab => {
                        let uri = new UrlEditor.Uri(tab.url);
                        chrome.tabs.update(tab.id, { url: uri.protocol() + "//" + uri.host() });
                    });
                    break;
            }
        }
        /**
         * To avoid upating context menu every time when menu item is being added/removed
         * we delay execution by releasing thread.
         */
        throttledContextMenuInit() {
            clearTimeout(this.delayedUiUpdate);
            this.delayedUiUpdate = setTimeout((() => this.initializeContextMenu()), 0);
        }
        /**
         * Initializes/updates registered context menu items.
         */
        initializeContextMenu() {
            this.clearContextMenu();
            let allTabsContextMenus = this.contextMenus["-1"];
            UrlEditor.Helpers.getActiveTab(tab => {
                if (tab.id < 0) {
                    // Developers toolbar is being returned as -1
                    return;
                }
                // remove old items again to be sure nothing was added meanwhile
                this.clearContextMenu();
                let currentTabId = tab.id;
                let processedGroups = {};
                let tabContextMenus = this.contextMenus[currentTabId];
                // add menu items for current tab
                if (tabContextMenus) {
                    Object.keys(tabContextMenus).forEach(group => {
                        Object.keys(this.contextMenus[currentTabId][group]).forEach(label => {
                            this.addEnabledContextMenuItem(tab, tabContextMenus[group][label]);
                        });
                        // to keep groups together we add items from "all tabs"
                        if (allTabsContextMenus && allTabsContextMenus[group]) {
                            processedGroups[group] = 1;
                            Object.keys(allTabsContextMenus[group]).forEach(label => {
                                this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                            });
                        }
                    });
                }
                // adding "all tabs" manu items
                if (allTabsContextMenus) {
                    Object.keys(allTabsContextMenus).forEach(group => {
                        if (!processedGroups[group]) {
                            Object.keys(allTabsContextMenus[group]).forEach(label => {
                                this.addEnabledContextMenuItem(tab, allTabsContextMenus[group][label]);
                            });
                        }
                    });
                }
            });
        }
        /**
         * Removes all current context menu items.
         *
         * In addition make sure that all registered context menu items are clean and ready
         * to render (removes properties added when the item is rendered).
         */
        clearContextMenu() {
            chrome.contextMenus.removeAll();
            Object.keys(this.contextMenus).forEach(tab => {
                let allTabsContextMenus = this.contextMenus[tab];
                Object.keys(allTabsContextMenus).forEach(group => {
                    Object.keys(allTabsContextMenus[group]).forEach(label => {
                        delete allTabsContextMenus[group][label]["generatedId"];
                    });
                });
            });
        }
        /**
         * Conditionally adds context menu item.
         *
         * Iteam is added only if isEnabled method is not defined or when it returns true.
         * @param tab Current tab.
         * @param item Context menu item properties.
         */
        addEnabledContextMenuItem(tab, item) {
            if (!item.isEnabled || item.isEnabled(tab)) {
                let cloned = Object.assign({}, item);
                delete cloned["isEnabled"];
                chrome.contextMenus.create(cloned);
            }
        }
        /**
         * Triggers event causing all the particular event handlers to be called.
         * @param name Event name.
         * @param args Event arguments.
         */
        triggerEvent(name, ...args) {
            if (this.eventListeners[name]) {
                switch (name) {
                    case "tabChange":
                        {
                            let tabId = args[0];
                            // trigger only if actually has changed
                            if (this.currentTabId != tabId) {
                                this.currentTabId = tabId;
                                this.eventListeners[name].forEach(h => {
                                    UrlEditor.Helpers.safeExecute(() => {
                                        let handler = h;
                                        handler(tabId);
                                    }, "tabChange handler");
                                });
                            }
                        }
                        break;
                    case "tabNavigate":
                        {
                            let tabId = args[0];
                            let url = args[1];
                            this.eventListeners[name].forEach(h => {
                                UrlEditor.Helpers.safeExecute(() => {
                                    let handler = h;
                                    handler(tabId, url);
                                }, "tabNavigate handler");
                            });
                        }
                        break;
                }
            }
        }
    }
    const init = (storage) => {
        return new Background(new UrlEditor.Settings(localStorage));
    };
    if (window.top == window.self && !window["__karma__"]) {
        init(localStorage);
    }
    else {
        document.addEventListener("init", (evt) => init(evt.detail || localStorage));
    }
})(UrlEditor || (UrlEditor = {}));
