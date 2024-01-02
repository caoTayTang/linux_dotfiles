"use strict";

var extensionName = getMessage("nameNoTM");

(async () => {
    selectorAll("title, .titleLink").forEach(el => el.textContent = extensionName);

    await initUI();

    onClick("#help", () => {
		location.href = "https://jasonsavard.com/wiki/Checker_Plus_for_Gmail?ref=GmailCheckerDetectionMethod";
	});

    byId("auto-detect-form").action = getUrlValue("actionUrl");
    byId("at").value = getUrlValue("at");
})();