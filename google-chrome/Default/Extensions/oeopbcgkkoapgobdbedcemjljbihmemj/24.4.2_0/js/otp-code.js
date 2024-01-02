// Copyright Jason Savard
"use strict";

function closeWindow() {
    document.body.append(getMessage("done"));

    setTimeout(() => {
        chrome.windows.getCurrent(windowResponse => {
            chrome.windows.remove(windowResponse.id);
        });

        setTimeout(() => {
            document.body.append(createBR(), createBR(), `You can close this window!`);
    
            try {
                window.close();
            } catch (error) {
                console.warn("couldn't close window: ", error);
            }
        }, 500);
    }, 500);
}

docReady(() => {
    const optCode = getUrlValue("otpCode");
    const otpCodeField = byId("otp-code");
    otpCodeField.value = optCode;
    otpCodeField.focus();
    otpCodeField.select();
    document.execCommand("copy");

    closeWindow();
});