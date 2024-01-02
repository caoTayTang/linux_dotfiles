"use strict";

var extensionName = getMessage("nameNoTM");
var permissionWindow;
var userResponsedToPermissionWindow;

function closeWindow() {
	var windowId = localStorage["_permissionWindowId"];
	if (windowId) {
		localStorage.removeItem("_permissionWindowId");
		chrome.windows.remove(parseInt(windowId));
	}
    document.body.classList.remove("page-loading-animation");

    setTimeout(() => {
        document.body.append(getMessage("done"), createBR(), createBR(), `You can close this window!`);

        try {
            window.close();
        } catch (error) {
            console.warn("couldn't close window: ", error);
        }
    }, 500);
}

chrome.windows.onRemoved.addListener(windowId => {
	if (permissionWindow && permissionWindow.id == windowId) {
		// closed permission window
		permissionWindow = null;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.info("onMessage", message);
    if (message.command == "grantPermissionToEmails") {

        sendMessageToBG("initOauthHybridAccount", {tokenResponse: message.tokenResponse}).then(() => {
            //grantPermissionToEmails(message.tokenResponse).then(() => {
                sendResponse();
                closeWindow();
            //});
        });

        return true;
    }
});

(async () => {
    selectorAll("title, .titleLink").forEach(el => el.textContent = extensionName);

    await initUI();

    byId("email-account").textContent = getUrlValue("email");

    onClick("#help", () => {
		location.href = "https://jasonsavard.com/forum/categories/checker-plus-for-gmail-feedback?ref=grant-access";
	});

    onClick("#grant-access", async function () {
        requestPermission({
            email: getUrlValue("email"),
            useGoogleAccountsSignIn: true
        });
    });

})();