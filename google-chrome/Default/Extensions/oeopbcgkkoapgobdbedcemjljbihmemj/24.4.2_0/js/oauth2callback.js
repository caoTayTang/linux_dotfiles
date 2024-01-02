"use strict";

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

async function processOAuthUserResponse(oAuthForMethod, accessTokenParams, oauthFollowupMethod) {
    const accessTokenResponse = await oAuthForMethod.getAccessToken(accessTokenParams);
    const tokenResponse = accessTokenResponse.tokenResponse;
    const sendMessageParams = await oauthFollowupMethod(tokenResponse);
    return new Promise((resolve, reject) => {
        if (isPopupOrOptionsOpen()) {
            // append oauth token in case needed
            sendMessageParams.tokenResponse = tokenResponse;
            chrome.runtime.sendMessage(sendMessageParams, () => {
                closeWindow();
                resolve();
            });
        } else {
            location.href = chrome.runtime.getURL("popup.html?source=grantedAccess");
            resolve();
        }
    });
}

function isPopupOrOptionsOpen() {
	return chrome.extension.getViews().some(thisWindow => {
        if (thisWindow.location.href.includes("popup.html")
            || thisWindow.location.href.includes("options.html")
            || thisWindow.location.href.includes("grant-access.html")) {
			return true;
		}
	});
}

function showError(error) {
    console.error("showError", error);
    document.body.classList.remove("page-loading-animation");
    document.body.style.color = "red";
    if (error.jError == JError.NETWORK_ERROR) {
        const $link = document.createElement("a");
        $link.href = "https://jasonsavard.com/wiki/Network_problem?ref=gmail";
        $link.target = "_blank";
        $link.textContent = getMessage("moreInfo");
        emptyAppend(document.body, getMessage("networkProblem"), " ", $link);
    } else {
        document.body.textContent = error;
    }
}

(async () => {
    await initUI();

    var code = getUrlValue("code");
    if (code) {	
        const securityToken = getUrlValue("security_token");
        const accessTokenParams = {
            code:   code,
            scopes: getUrlValue("scopes")
        }

        try {
            if (securityToken == await oAuthForEmails.getSecurityToken()) {
                await processOAuthUserResponse(oAuthForEmails, accessTokenParams, async tokenResponse => {
                    // do nothing
                    return {command: "grantPermissionToEmails"};
                });
            } else if (securityToken == await oAuthForProfiles.getSecurityToken()) {
                await processOAuthUserResponse(oAuthForProfiles, accessTokenParams, async tokenResponse => {
                    const data = await oAuthForProfiles.send({
                        userEmail: tokenResponse.userEmail,
                        url: "https://people.googleapis.com/v1/people/me",
                        data: {
                            "personFields":	"names,photos"
                        }
                    });
                    if (data) {
                        console.log(data);
                        if (data.photos && data.photos[0].url) {
                            const account = getAccountByEmail(tokenResponse.userEmail);
                            await account.saveSetting("profileInfo", {
                                displayName:	data.names[0].displayName,
                                imageUrl:		data.photos[0].url
                            });
                            return {command: "profileLoaded"};
                        } else {
                            throw new Error("No profile picture found");
                        }
                    }
                });
            } else if (securityToken == await oAuthForContacts.getSecurityToken()) {
                await processOAuthUserResponse(oAuthForContacts, accessTokenParams, async tokenResponse => {
                    await postPermissionsGrantedForContacts(tokenResponse.userEmail);
                    return {
                        command: "grantPermissionToContacts"
                    };
                });
            } else {
                throw "security_token not matched!";
            }
        } catch (error) {
            showError(error);
        }
    } else {
        const url = "https://jasonsavard.com/wiki/Granting_access?ref=permissionDenied&ext=gmail";
        
        if (isPopupOrOptionsOpen()) {
            await openUrl(url);
        } else {
            await openUrl(url, parseInt(localStorage._currentWindowId));
        }
        
        closeWindow();
    }
})();