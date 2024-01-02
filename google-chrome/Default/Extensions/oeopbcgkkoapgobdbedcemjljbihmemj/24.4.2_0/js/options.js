"use strict";

var monitorLabelsEnabled;
var justInstalled = getUrlValue("action") == "install";
var permissionWindow;
var userResponsedToPermissionWindow;
var playing;
var donationClickedFlagForPreventDefaults;

var langs =
[['Afrikaans',       ['af-ZA']],
 ['አማርኛ',           ['am-ET']],
 ['Azərbaycanca',    ['az-AZ']],
 ['বাংলা',            ['bn-BD', 'বাংলাদেশ'],
                     ['bn-IN', 'ভারত']],
 ['Bahasa Indonesia',['id-ID']],
 ['Bahasa Melayu',   ['ms-MY']],
 ['Català',          ['ca-ES']],
 ['Čeština',         ['cs-CZ']],
 ['Dansk',           ['da-DK']],
 ['Deutsch',         ['de-DE']],
 ['English',         ['en-AU', 'Australia'],
                     ['en-CA', 'Canada'],
                     ['en-IN', 'India'],
                     ['en-KE', 'Kenya'],
                     ['en-TZ', 'Tanzania'],
                     ['en-GH', 'Ghana'],
                     ['en-NZ', 'New Zealand'],
                     ['en-NG', 'Nigeria'],
                     ['en-ZA', 'South Africa'],
                     ['en-PH', 'Philippines'],
                     ['en-GB', 'United Kingdom'],
                     ['en-US', 'United States']],
 ['Español',         ['es-AR', 'Argentina'],
                     ['es-BO', 'Bolivia'],
                     ['es-CL', 'Chile'],
                     ['es-CO', 'Colombia'],
                     ['es-CR', 'Costa Rica'],
                     ['es-EC', 'Ecuador'],
                     ['es-SV', 'El Salvador'],
                     ['es-ES', 'España'],
                     ['es-US', 'Estados Unidos'],
                     ['es-GT', 'Guatemala'],
                     ['es-HN', 'Honduras'],
                     ['es-MX', 'México'],
                     ['es-NI', 'Nicaragua'],
                     ['es-PA', 'Panamá'],
                     ['es-PY', 'Paraguay'],
                     ['es-PE', 'Perú'],
                     ['es-PR', 'Puerto Rico'],
                     ['es-DO', 'República Dominicana'],
                     ['es-UY', 'Uruguay'],
                     ['es-VE', 'Venezuela']],
 ['Euskara',         ['eu-ES']],
 ['Filipino',        ['fil-PH']],
 ['Français',        ['fr-FR']],
 ['Basa Jawa',       ['jv-ID']],
 ['Galego',          ['gl-ES']],
 ['ગુજરાતી',           ['gu-IN']],
 ['עברית',           ['he-IL']],
 ['Hrvatski',        ['hr-HR']],
 ['IsiZulu',         ['zu-ZA']],
 ['Íslenska',        ['is-IS']],
 ['Italiano',        ['it-IT', 'Italia'],
                     ['it-CH', 'Svizzera']],
 ['ಕನ್ನಡ',             ['kn-IN']],
 ['ភាសាខ្មែរ',          ['km-KH']],
 ['Latviešu',        ['lv-LV']],
 ['Lietuvių',        ['lt-LT']],
 ['മലയാളം',          ['ml-IN']],
 ['मराठी',             ['mr-IN']],
 ['Magyar',          ['hu-HU']],
 ['ລາວ',              ['lo-LA']],
 ['Nederlands',      ['nl-NL']],
 ['नेपाली भाषा',        ['ne-NP']],
 ['Norsk bokmål',    ['nb-NO']],
 ['Polski',          ['pl-PL']],
 ['Português',       ['pt-BR', 'Brasil'],
                     ['pt-PT', 'Portugal']],
 ['Română',          ['ro-RO']],
 ['සිංහල',          ['si-LK']],
 ['Slovenščina',     ['sl-SI']],
 ['Basa Sunda',      ['su-ID']],
 ['Slovenčina',      ['sk-SK']],
 ['Suomi',           ['fi-FI']],
 ['Svenska',         ['sv-SE']],
 ['Kiswahili',       ['sw-TZ', 'Tanzania'],
                     ['sw-KE', 'Kenya']],
 ['ქართული',       ['ka-GE']],
 ['Հայերեն',          ['hy-AM']],
 ['தமிழ்',            ['ta-IN', 'இந்தியா'],
                     ['ta-SG', 'சிங்கப்பூர்'],
                     ['ta-LK', 'இலங்கை'],
                     ['ta-MY', 'மலேசியா']],
 ['తెలుగు',           ['te-IN']],
 ['Tiếng Việt',      ['vi-VN']],
 ['Türkçe',          ['tr-TR']],
 ['اُردُو',            ['ur-PK', 'پاکستان'],
                     ['ur-IN', 'بھارت']],
 ['Ελληνικά',         ['el-GR']],
 ['български',         ['bg-BG']],
 ['Pусский',          ['ru-RU']],
 ['Српски',           ['sr-RS']],
 ['Українська',        ['uk-UA']],
 ['한국어',            ['ko-KR']],
 ['中文',             ['cmn-Hans-CN', '普通话 (中国大陆)'],
                     ['cmn-Hans-HK', '普通话 (香港)'],
                     ['cmn-Hant-TW', '中文 (台灣)'],
                     ['yue-Hant-HK', '粵語 (香港)']],
 ['日本語',           ['ja-JP']],
 ['हिन्दी',             ['hi-IN']],
 ['ภาษาไทย',         ['th-TH']]];

chrome.windows.onRemoved.addListener(windowId => {
	if (permissionWindow && permissionWindow.id == windowId) {
		// closed permission window
		permissionWindow = null;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.info("onMessage", message);
    if (message.command == "grantPermissionToEmails") {
        grantPermissionToEmails(message.tokenResponse).then(() => {
            sendResponse();
        });
        return true;
    } else if (message.command == "featuresProcessed") {
        donationClickedFlagForPreventDefaults = true;
        document.querySelectorAll("[mustDonate]").forEach(el => {
            el.removeAttribute("mustDonate");
        });
        sendResponse();
    }
});

function reloadExtension() {
	if (chrome.runtime.reload) {
		chrome.runtime.reload();
	} else {
		niceAlert("You must disable/re-enable the extension in the extensions page or restart the browser");
	}
}

async function waitForStorageSync() {
    await sleep(100);
}

function sendNotificationTest(testType, e) {
    const sendParams = {
        testType:           testType,
        requirementText:    getMessage("notificationTryItOutInstructions"),
        showAll:            e.ctrlKey
    }

    sendMessageToBG("showNotificationTest", sendParams).catch(error => {
        niceAlert(error);
    }).finally(() => {
        hideLoading();
    });
}

async function initPage(tabName) {
	console.log("initPage: " + tabName);
	if (!byId(tabName + "Page")) {
		initTemplate(tabName + "PageTemplate");

		// patch for mac: because polymer dropdowns default values were not correctly populating
		setTimeout(() => {
			initPaperElement(selectorAll("#" + tabName + "Page [indexdb-storage], #" + tabName + "Page [permissions]"));
		}, 1);

		if (await storage.get("donationClicked")) {
            selectorAll("[mustDonate]").forEach(element => element.removeAttribute("mustDonate"));
        }

		if (tabName == "welcome") {
			const navLang = await storage.get("language");
            const $lang = byId("lang");
			if ($lang.querySelector("[value='" + navLang + "']")) {
				$lang.selected = navLang;
			} else if ($lang.querySelector(`[value='${navLang.substring(0, 2)}']`)) {
				$lang.selected = navLang.substring(0, 2);
			} else {
				$lang.value = "en";
			}

			onClick("#lang paper-item", async function () {
                try {
                    delete window.initMiscPromise;
                    await initUI();
                    storage.remove("tabletViewUrl");
                    await sendMessageToBG("resetInitMiscWindowVars");
                    sendMessageToBG("updateBadge");
                } catch (error) {
                    showError(error);
                }
            });

			onClick("#notificationsGuide", function() {
				showOptionsSection("notifications");
				sendGA("guide", "notifications");
			});

			onClick("#makeButtonOpenGmailGuide", function () {
				showOptionsSection("button");
				show("#browserButtonActionToolTip");
				byId("browserButtonActionToolTip").show();
				sendGA("guide", "openGmail");
			});

			onClick("#guideForPrimaryCategory", async function () {
				showOptionsSection("accounts");

				await sleep(1000);
                if (accounts.length >= 2) {
                    show("#accountsListToolTip");
                    byId("accountsListToolTip").show();
    
                    await sleep(1500);
                }

                const $inboxLabelToolTip = byId("inboxLabelToolTip");
                if ($inboxLabelToolTip) {
                    show($inboxLabelToolTip);
                    $inboxLabelToolTip.show();
                }

                await sleep(1500);
                /*
                if (!byId("categoriesLabel").classList.contains("opened")) {
                    byId("categoriesLabel").click();
                }

                show("#primaryLabelToolTip");
                byId("primaryLabelToolTip").show();
                */

				sendGA("guide", "primaryCategory");
			});
			
		} else if (tabName == "notifications") {
			loadVoices();
			// seems we have to call chrome.tts.getVoices twice at a certain 
			if (DetectClient.isLinux()) {
				setTimeout(function() {
					loadVoices();
				}, seconds(1));
			}

			var notificationSound = await storage.get("notificationSound");
			if (notificationSound) {
				show("#soundOptions");
			} else {
				hide("#soundOptions");
			}

			onClick("#playNotificationSound", function () {
				if (playing) {
					sendMessageToBG("stopNotificationSound");
					playing = false;
					this.setAttribute("icon", "av:play-arrow");
				} else {
					playSound();
				}
			});

			addEventListeners("#notificationSoundVolume", "change", async function () {
				await waitForStorageSync();
				playSound();
			});

			const $soundOptions = await generateSoundOptions();
			selector(".defaultSoundOptionWrapper").append($soundOptions);

			const $voiceOptions = await generateVoiceOptions();
			selector(".defaultVoiceOptionWrapper")?.append($voiceOptions);

			if (await storage.get("notificationVoice")) {
				show("#voiceOptions");
			} else {
				hide("#voiceOptions");
			}

            const $notificationVoice = byId("notificationVoice");
            if ($notificationVoice) {
                onDelegate($notificationVoice, "click", "paper-item", function () {
                    const voiceName = byId("voiceMenu").selected;
                    //var voiceName = $(this).val(); // commented because .val would not work for non-dynamically values like addVoice etc.
    
                    if (voiceName) {
                        if (voiceName == "addVoice") {
                            openUrl("https://jasonsavard.com/wiki/Voice_Notifications");
                        } else {
    
                            if (voiceName.includes("Multilingual TTS Engine")) {
                                byId("pitch").setAttribute("disabled", "true");
                                byId("rate").setAttribute("disabled", "true");
                            } else {
                                byId("pitch").removeAttribute("disabled");
                                byId("rate").removeAttribute("disabled");
                            }
    
                            playVoice();
                        }
                        fadeIn("#voiceOptions");
                    } else {
                        hide("#voiceOptions");
                    }
                });
            }

			onClick("#playVoice", function () {
				chrome.runtime.sendMessage({command: "chromeTTS", isSpeaking:true}, isSpeaking => {
                    if (isSpeaking) {
                        chrome.runtime.sendMessage({command: "chromeTTS", stop:true});
                        byId("playVoice").setAttribute("icon", "av:stop");
                    } else {
                        playVoice();
                    }
                });
			});

            addEventListeners("#voiceOptions paper-slider", "change", async function () {
				await waitForStorageSync();
				playVoice();
            });

            async function initRecycleNotifs() {
                if (await storage.get("showNotificationDuration") == "infinite") {
                    show("#recycleNotification");
                } else {
                    hide("#recycleNotification");
                }

            }

            initRecycleNotifs();

            onClick("#showNotificationDuration_rich paper-item", async function () {
                await waitForStorageSync();
                initRecycleNotifs();
            });
            
            onClick("#moveIntoActionCenter", async function() {
                if (this.checked) {
                    await niceAlert("This will also set the option 'Close after' to 'never'.");
                    if (await storage.get("notificationWakesUpScreenTemporarily")) {
                        storage.set("notificationWakesUpScreenTemporarily", false);
                        byId("notificationWakesUpScreenTemporarily").checked = false;
                    }
                    selector("#rich-close-after-x paper-item[value='infinite']").click();
                }
            });

            // refer to https://jasonsavard.com/forum/discussion/comment/28786#Comment_28786
            onClick("#notificationWakesUpScreenTemporarily", async function() {
                if (this.checked && await storage.get("moveIntoActionCenter")) {
                    niceAlert("This will disable the move into action center");
                    storage.set("moveIntoActionCenter", false);
                    byId("moveIntoActionCenter").checked = false;
                }
            });
            
			onClick("#runInBackground", function () {
				var that = this;
				// timeout to let permissions logic determine check or uncheck the before
				setTimeout(function () {
					if (that.checked) {
						openDialog("runInBackgroundDialogTemplate");
					}
				}, 1);
			});

			onClick("#showContactPhotos", function() {
				chrome.permissions.request({ origins: [Origins.CONTACT_PHOTOS] }, granted => {
					if (granted) {
						showMessage(getMessage("done"));

                        const content = new DocumentFragment();

                        const $icon = document.createElement("iron-icon");
                        $icon.setAttribute("icon", "more-vert");

                        content.append("Make sure to also grant access to each Gmail account:", createBR(), "Popup Window > Email Account Menu ", $icon, " > Show Contact Photos");
						niceAlert(content);
					}
				});
			});

			async function initNotifications(startup) {
				var showMethod;
				var hideMethod;
				if (startup) {
					showMethod = "show";
					hideMethod = "hide";
				} else {
					showMethod = "slideDown";
					hideMethod = "slideUp";
				}
				
				var desktopNotification = await storage.get("desktopNotification");
				if (desktopNotification == "") {
					globalThis[hideMethod](byId("desktopNotificationOptions"));
				} else if (desktopNotification == "text") {
					globalThis[showMethod](byId("desktopNotificationOptions"));
					globalThis[showMethod](byId("textNotificationOptions"));
					globalThis[hideMethod](byId("richNotificationOptions"));
				} else if (desktopNotification == "rich") {
					globalThis[showMethod](byId("desktopNotificationOptions"));
					globalThis[hideMethod](byId("textNotificationOptions"));
					globalThis[showMethod](byId("richNotificationOptions"));
				}
			}
			
			initNotifications(true);

			function requestTextNotificationPermission(showTest, e) {
				Notification.requestPermission(permission => {
					if (permission == "granted") {
						if (showTest) {
                            sendNotificationTest("text", e);
						}
					} else {
                        const content = new DocumentFragment();

                        const $link = document.createElement("a");
                        $link.href = "https://support.google.com/chrome/answer/3220216";
                        $link.style.color = "blue";
                        $link.textContent = "Chrome notifications";

                        content.append("Permission denied! Refer to ", $link, " to enable them." + " (permission: " + permission + ")");
						niceAlert(content);
					}
				});
			}
			
			onClick("#desktopNotification paper-item", async function(e) {
                await waitForStorageSync();
				initNotifications();
				if (await storage.get("desktopNotification") == "text") {
					requestTextNotificationPermission(false, e);
				}
			});
			
			onClick("#testNotification", async function(e) {
                await waitForStorageSync();
                const desktopNotification = await storage.get("desktopNotification")
				if (desktopNotification == "text") {
					requestTextNotificationPermission(true, e);
				} else if (desktopNotification == "rich") {
                    showLoading();
                    sendNotificationTest("rich", e);
				}
			});
			
			onClick("#showNotificationDuration_text paper-item", function() {
				const value = this.getAttribute("value");
				byId("showNotificationDuration_rich").setAttribute("selected", value);
			});

			onClick("#showNotificationDuration_rich paper-item", function() {
                const value = this.getAttribute("value");
				byId("showNotificationDuration_text").setAttribute("selected", value);
                if (value == "infinite") {
                    niceAlert("This setting might require your to also change your system notification settings. Click Ok for instructions.").then(() => {
                        openUrl("https://jasonsavard.com/wiki/System_Notifications?ref=neverDisappear");
                    });
                }
			});

            if (await storage.get("accountAddingMethod") == "autoDetect" && byId("showNotificationEmailImagePreview")) {
                chrome.permissions.contains({ origins: [Origins.NOTIFICATION_IMAGES] }, function (result) {
                    if (!result) {
                        byId("showNotificationEmailImagePreview").checked = false;
                    }
                });
			}

			addEventListeners("#showNotificationEmailImagePreview", "change", async function() {
				var checkbox = this;
				if (checkbox.checked && await storage.get("accountAddingMethod") == "autoDetect") {
					chrome.permissions.request({origins: [Origins.NOTIFICATION_IMAGES]}, granted => {
						if (granted) {
							// do nothing
							return true;
						} else {
							checkbox.checked = false;
							storage.set("showNotificationEmailImagePreview", false);
							return false;
						}
					});
				}
			});

            addEventListeners("#showSnoozedNotifications", "change", async function () {
				if (this.checked && await storage.get("accountAddingMethod") == "autoDetect") {
					openGenericDialog({
						content: getMessage("switchToAddAccounts"),
						okLabel: getMessage("addAccount"),
						showCancel: true
					}).then(response => {
						if (response == "ok") {
							openUrl("options.html?ref=showSnoozedNotifications&highlight=addAccount#accounts");
						}
					});
					this.checked = false;
				}
			});

		} else if (tabName == "dnd") {
			setTimeout(function() {
				if (location.href.match("highlight=DND_schedule")) {
					byId("dndSchedule").click();
				}
			}, 500);

			if (await storage.get("dndDuringCalendarEvent")) {
				byId("dndDuringCalendarEvent").checked = true;
			}
			
            addEventListeners("#dndDuringCalendarEvent", "change", function() {
				let checked = this.checked;
				sendMessageToCalendarExtension({action:"getInfo"}).then(response => {
					if (response) {
						storage.set("dndDuringCalendarEvent", checked);
					} else {
						this.checked = false;
						requiresCalendarExtension("dndDuringCalendarEvent");
					}
				}).catch(error => {
                    requiresCalendarExtension("dndDuringCalendarEvent");
                });
			});

			onClick("#dndSchedule", async function () {
				var $dialog = initTemplate("dndScheduleDialogTemplate");
				var $timetable = $dialog.querySelector("#dndTimetable");
				emptyNode($timetable);

				const DND_timetable = await storage.get("DND_timetable");

                let $header = document.createElement("div");
                $header.classList.add("header", "layout", "horizontal");

                let $time = document.createElement("div");
                $time.classList.add("time");

				$header.append($time);

				for (var a = 1; a < 8; a++) {
                    const $dayHeader = document.createElement("div");
                    $dayHeader.classList.add("day");

                    const $allDay = document.createElement("paper-icon-button");
                    $allDay.classList.add("allDay");
                    $allDay.setAttribute("icon", "done-all");
					$allDay.setAttribute("day", a % 7);
                    onClick($allDay, async function () {
						if (await donationClicked("DND_schedule")) {
							let allDayChecked = this.checked;
							let day = this.getAttribute("day");
							selectorAll(`#dndScheduleDialog paper-checkbox[day='${day}']`).forEach(el => {
								el.checked = !allDayChecked;
							});
							this.checked = !this.checked;
						}
					});
					$dayHeader.append($allDay, dateFormat.i18n.dayNamesShort[a % 7]);
					$header.append($dayHeader);
				}

				$timetable.append($header);

				for (var hour = 0; hour < 24; hour++) {
                    let $row = document.createElement("div");
                    $row.classList.add("row");

                    const date = new DateZeroTime();
                    date.setHours(hour);

                    let $time = document.createElement("div");
                    $time.classList.add("time");
					$time.textContent = date.toLocaleTimeStringJ();

					$row.append($time);

					for (var b = 0; b < 7; b++) {
						let day = (b + 1) % 7;
                        let $checkbox = document.createElement("paper-checkbox");
						$checkbox.setAttribute("day", day);
						$checkbox.setAttribute("hour", hour);
                        onClick($checkbox, async function () {
							if (!await donationClicked("DND_schedule")) {
								this.checked = false;
							}
						});

						if (DND_timetable && DND_timetable[day][hour]) {
							$checkbox.checked = true;
						}

						$row.append($checkbox);
					}
                    let $allWeek = document.createElement("paper-icon-button");
                    $allWeek.classList.add("allWeek");
                    $allWeek.setAttribute("icon", "done-all");
                    onClick($allWeek, async function () {
						if (await donationClicked("DND_schedule")) {
							let allWeekChecked = this.checked;
							this.closest(".row").querySelectorAll("paper-checkbox").forEach(el => {
								el.checked = !allWeekChecked;
							});
							this.checked = !this.checked;
						}
					});

					$row.append($allWeek);
					$timetable.append($row);
				}

                onClickReplace($dialog.querySelector(".resetDND"), function () {
					selectorAll("#dndScheduleDialog paper-checkbox").forEach(el => {
						el.checked = false;
					});
				});

                onClick($dialog.querySelector(".okDialog"), async function () {
					let atleastOneChecked = false;
					let DND_timetable = {};
					selectorAll("#dndScheduleDialog paper-checkbox").forEach(el => {
						let day = el.getAttribute("day");
						let hour = el.getAttribute("hour");
                        DND_timetable[day] ||= {};
						DND_timetable[day][hour] = el.checked;
						if (el.checked) {
							atleastOneChecked = true;
						}
					});
					// just a flag to indicate schedule is on/off
					await storage.set("DND_schedule", atleastOneChecked);
					// store actual hours
					await storage.set("DND_timetable", DND_timetable);

					sendMessageToBG("updateBadge");
				});

				openDialog($dialog);
			});

		} else if (tabName == "button") {

            addEventListeners("#hide_count, #showButtonTooltip", "change", async function () {
                await waitForStorageSync();
                sendMessageToBG("updateBadge");
			});

            addEventListeners("#showOnlyRecentUnreadEmails", "change", async function () {
                await waitForStorageSync();
                pollAndLoad({showNotification:false, refresh:true});
			});

			onClick("#badgeIcon paper-icon-item", async function () {
				await waitForStorageSync();
				if (this.getAttribute("value") == "custom") {
					buttonIcon.setIcon({ force: true });
                    sendMessageToBG("updateBadge");

					this.closest("paper-dropdown-menu").close();

					const $dialog = initTemplate("customButtonDialogTemplate");

                    onClickReplace($dialog.querySelector("#chooseSignedOutIcon"), function (event) {
						byId("signedOutButtonIconInput").click();
						event.preventDefault();
                        event.stopPropagation();
					});

                    onClickReplace($dialog.querySelector("#chooseNoUnreadEmail"), function (event) {
						byId("noUnreadButtonIconInput").click();
						event.preventDefault();
                        event.stopPropagation();
					});

					onClickReplace($dialog.querySelector("#chooseUnreadEmail"), function (event) {
						byId("unreadButtonIconInput").click();
						event.preventDefault();
                        event.stopPropagation();
					});

                    addEventListeners($dialog.querySelectorAll("#signedOutButtonIconInput, #noUnreadButtonIconInput, #unreadButtonIconInput"), "change", function (e) {
						console.log(e.target.files);
						var buttonId = e.target.id;
						var file = e.target.files[0];
						var fileReader = new FileReader();

						fileReader.onload = function () {
							console.log("result: ", this.result);

							var canvas = document.createElement("canvas");
							var img = new Image();
							img.onload = async function () {
								var widthHeightToSave;
								if (this.width <= 19) {
									widthHeightToSave = 19;
								} else {
									widthHeightToSave = 38;
								}
								canvas.width = canvas.height = widthHeightToSave;

								var context2 = canvas.getContext("2d");
								context2.drawImage(this, 0, 0, widthHeightToSave, widthHeightToSave);

								console.log("dataurl: " + canvas.toDataURL().length);

								async function storeIcon(all) {
									if (all || buttonId == "signedOutButtonIconInput") {
										await storage.set("customButtonIconSignedOut", canvas.toDataURL());
									}
									if (all || buttonId == "noUnreadButtonIconInput") {
										await storage.set("customButtonIconNoUnread", canvas.toDataURL());
									}
									if (all || buttonId == "unreadButtonIconInput") {
										await storage.set("customButtonIconUnread", canvas.toDataURL());
									}

									//selector("input[name='icon_set'][value='custom']").click();
									await updateCustomIcons();
                                    buttonIcon.setIcon({ force: true });
                                    sendMessageToBG("updateBadge");
								}

								if (await storage.get("customButtonIconSignedOut") || await storage.get("customButtonIconNoUnread") || await storage.get("customButtonIconUnread")) {
									storeIcon();
									showMessage(getMessage("done"));
								} else {
									openGenericDialog({
										content: "Use this icon for all email states?",
										okLabel: "Yes to all",
										cancelLabel: "Only this one"
									}).then(response => {
										if (response == "ok") {
											storeIcon(true);
										} else {
											storeIcon();
										}
										niceAlert(getMessage("done"));
									});
								}

							}

							img.onerror = function (e) {
								console.error(e);
								niceAlert("Error loading image, try another image!");
							}

							img.src = this.result;
							//img.src = "chrome://favicon/size/largest/https://inbox.google.com";
							//img.src = "https://ssl.gstatic.com/bt/C3341AA7A1A076756462EE2E5CD71C11/ic_product_inbox_16dp_r2_2x.png";

						}

						fileReader.onabort = fileReader.onerror = function (e) {
							console.error("fileerror: ", e);
							if (e.currentTarget.error.name == "NotFoundError") {
								alert("Temporary error, please try again.");
							} else {
								alert(e.currentTarget.error.message + " Try again.");
							}
						}

						fileReader.readAsDataURL(file);

					}, "custom-icons-change");

					openDialog($dialog).then(function (response) {
						if (response != "ok") {
							openUrl("https://jasonsavard.com/wiki/Button_icon#Add_your_own_custom_icons");
						}
					});
				} else {
                    buttonIcon.setIcon({ force: true });
                    sendMessageToBG("updateBadge");
				}
				byId("currentBadgeIcon").setAttribute("src", await buttonIcon.generateButtonIconPath());
			});
			
			initPopupWindowOptions();

			onClick("#browserButtonAction paper-item", async function () {
				await waitForStorageSync();
				initPopupWindowOptions(this.getAttribute("value"));
				initPopup();
			});

			onClick(".browserButtonActionIfNoEmail paper-item", async function () {
				await waitForStorageSync();
				initPopup();
			});

			updateCustomIcons();

			onClick("#testButtonIconAnimation", async function() {
				niceAlert("Don't look here, look at the top right :)")
				await sleep(seconds(1));
                buttonIcon.startAnimation({testAnimation:true});
			});

            function setSampleBadgeColors(color) {
                const $sampleUnreadColor = byId("sample-unread-count");
                $sampleUnreadColor.style["background-color"] = color;

                const button = byId("unread-count-background-color").shadowRoot.querySelector("paper-icon-button");
                button.style.borderRadius = "50%";

                if (isColorTooLight(color, 0.60)) {
                    $sampleUnreadColor.style.color = "black";
                    button.style.backgroundColor = "#555";
                } else {
                    $sampleUnreadColor.style.color = "white";
                    button.style.backgroundColor = "transparent";
                }
            }

			setSampleBadgeColors(await storage.get("unreadCountBackgroundColor"));

			byId("unread-count-background-color").setAttribute("color", await storage.get("unreadCountBackgroundColor"));
            addEventListeners("#unread-count-background-color", "color-changed", async e => {
                const color = e.detail.value;
                await storage.set("unreadCountBackgroundColor", color);
                setSampleBadgeColors(color);
                sendMessageToBG("updateBadge");
            });

		} else if (tabName == "general") {
			setTimeout(function () {
				if (location.href.match("highlight=quickContact")) {
					byId("quickComposeWrapper").classList.add("highlight");
					setTimeout(function () {
						byId("quickComposeEmail").focus();
					}, 200);
                }
			}, 500);

			initPopupWindowOptions();

			async function initSetPositionAndSizeOptions() {
				if (await storage.get("setPositionAndSize")) {
					show("#setPositionAndSizeOptions");
					show("#testOutPopupWindow");
				} else {
					hide("#setPositionAndSizeOptions");
					hide("#testOutPopupWindow");
				}
			}

			initSetPositionAndSizeOptions();

            addEventListeners("#setPositionAndSize", "change", async function () {
				await waitForStorageSync();
				initSetPositionAndSizeOptions();
			});

			onClick("#testOutPopupWindow", function() {
				openTabOrPopup({url:"https://mail.google.com?view=cm&fs=1&tf=1", name:"test", testingOnly:true});
			});
            
			function reinitContextMenu() {
				console.log("reinitContextMenu");
				clearTimeout(window.initQuickContactContextMenuTimeout);
				window.initQuickContactContextMenuTimeout = setTimeout(function () {
                    // Must be called from bg or i was loosing menu items would not respond??
                    sendMessageToBG("initQuickContactContextMenu", { update: true });
				}, 200);

			}

            addEventListeners("#showContextMenuItem", "change", function () {
				reinitContextMenu();
			});

            ["blur", "keydown"].forEach(type => {
                addEventListeners("#quickComposeEmail, #quickComposeEmailAlias", type, function () {
                    console.log("keydown", type);
                    reinitContextMenu();
                });
            });

            addEventListeners("#autoCollapseConversations", "change", function() {
				if (!this.checked) {
					niceAlert("Done. But, but not recommended because it will slow the loading of message.");
				}
			});

            addEventListeners("#progressivelyLoadEmails", "change", function() {
				if (!this.checked) {
					niceAlert("Done. But, but not recommended because it will slow the loading of the window.");
				}
			});

            addEventListeners("#starringAppliesInboxLabel", "change", async function (e) {
                await waitForStorageSync();
				var that = this;
				if (await storage.get("accountAddingMethod") == "autoDetect") {
					niceAlert("Only available with enabling adding accounts method in Accounts tab");

					// reset it now
					that.checked = false;
					storage.remove("starringAppliesInboxLabel");
				}
			});
            
            addEventListeners("#showEOM, #hideSentFrom", "change", async function () {
                await waitForStorageSync();
                pollAndLoad({showNotification:false, refresh:true});
            });

		} else if (tabName == "accounts") {
			setTimeout(function () {
				if (location.href.match("highlight=addAccount")) {
					highlightAddAccount();
				}
			}, 500);
			
			onClick("#signIn", function() {
				openUrl(Urls.SignOut);
			});
			
			onClick(".refresh", function(e) {
				pollAndLoad({showNotification:true, refresh:true});
				e.preventDefault();
                e.stopPropagation();
			});
			
			onClick("#signInNotWorking", function() {
				openUrl("https://jasonsavard.com/wiki/Auto-detect_sign_in_issues");
			});

			initDisplayForAccountAddingMethod();
			
			onClick("#accountAddingMethod paper-radio-button", async (e) => {
                await waitForStorageSync();
                const accountAddingMethod = await storage.get("accountAddingMethod");

                if (accountAddingMethod == "oauth") {
                    await sendMessageToBG("switchToOauth");
                    await initAllAccounts();
                }

				await resetSettings(accounts);
				await alwaysPromise(pollAndLoad({showNotification:false, refresh:true}));

                // might have added hybrid accounts from auto-detect and that we don't watch, so now after switching to oauth we need to watch them
                if (accountAddingMethod == "oauth" && await storage.get("poll") == "realtime") {
                    await asyncForEach(accounts, async (account) => {
                        if (!await account.isBeingWatched()) {
                            await account.enablePushNotifications();
                        }
                    });
                }

				await initDisplayForAccountAddingMethod();
                sendMessageToBG("restartCheckEmailTimer", true);
			});
			
            addEventListeners("#pollingInterval paper-listbox", "iron-activate", async function(e) {
				console.log("iron-activate");
				const pollingInterval = e.detail.selected;
				if (pollingInterval == "realtime" && !await supportsRealtime()) {
					niceAlert("Not available with this browser");
				} else if (byId("accountAddingMethod").selected == "autoDetect" && pollingInterval == "realtime") {
					e.preventDefault();
					highlightAddAccount();
					niceAlert(getMessage("switchToAddAccounts"));
				} else {
					const previousPollingInterval = await storage.get("poll");

                    try {
                        if (previousPollingInterval != "realtime" && pollingInterval == "realtime") {
                            await asyncForEach(accounts, async (account) => {
                                if (!await account.isBeingWatched()) {
                                    await account.enablePushNotifications();
                                }
                            });
                        } else {
                            if (previousPollingInterval == "realtime" && pollingInterval != "realtime") {
                                accounts.forEach(account => {
                                    account.stopWatchAlarm();
                                });
                            }
                        }

						console.log("all good")
						await storage.set("poll", pollingInterval);
						sendMessageToBG("restartCheckEmailTimer", true);
                    } catch (error) {
						console.error(error)
						selector("#pollingInterval paper-listbox").select( previousPollingInterval );
						niceAlert("Could not enable real-time!" + " (error: " + error + ")");
                    }
				}
			});

			onClick("#addAccount", async function () {
                const accounts = await retrieveAccounts();
                // already added an account (assuming chrome profile) so go directly to google accounts prompt
				if (supportsChromeSignIn() && !accounts?.length) {
                    openPermissionsDialog().then(response => {
						console.log("openpermissresponse", response);
						if (response?.useGoogleAccountsSignIn) {
							// nothing already handled in onMessage
						} else {
							grantPermissionToEmails(response.tokenResponse);
						}
					});
				} else {
					requestPermission({ useGoogleAccountsSignIn: true });
				}
			});

			onClick("#syncSignInOrder", function () {
				showLoading();
				syncSignInOrderForAllAccounts().then(() => {
					showMessage(getMessage("done"));
				}).catch(error => {
					niceAlert("Try signing out and into your Gmail accounts and then do this sync again. error: " + error);
				}).then(() => {
					hideLoading();
				});
            });
            
        } else if (tabName == "skinsAndThemes") {

            const $skinsListing = byId("skinsAndThemesListing");

            showLoading();
            try {
                const skins = await Controller.getSkins();
                skins.forEach(skin => {
                    const $row = document.createElement("tr");
                    $row.classList.add("skinLine");

                    const $name = document.createElement("td");
                    $name.classList.add("name");
                    $name.textContent = skin.name;

                    const $skinImageWrapper = document.createElement("td");
                    $skinImageWrapper.classList.add("skinImageWrapper");

                    const $skinImageLink = document.createElement("a");
                    $skinImageLink.classList.add("skinImageLink");

                    const $skinImage = document.createElement("img");
                    $skinImage.classList.add("skinImage");

                    $skinImageLink.append($skinImage);
                    $skinImageWrapper.append($skinImageLink);

                    const $author = document.createElement("td");
                    $author.classList.add("author");

                    const $installs = document.createElement("td");
                    $installs.textContent = skin.installs;

                    const $addSkinWrapper = document.createElement("td");

                    const $addSkin = document.createElement("paper-icon-button");
                    $addSkin.classList.add("addSkin");
                    $addSkin.setAttribute("icon", "add");

                    $addSkinWrapper.append($addSkin);

                    $row.append($name, $skinImageWrapper, $author, $installs, $addSkinWrapper);

                    $row._skin = skin;

                    if (skin.image) {
                        $skinImage.src = skin.image;
                        $skinImageLink.href = skin.image;
                        $skinImageLink.target = "_previewWindow";
                    }
    
                    const $authorLink = document.createElement("a");
                    $authorLink.textContent = skin.author;
                    if (skin.author_url) {
                        $authorLink.href = skin.author_url;
                        $authorLink.target = "_preview";
                        $skinImage.style["cursor"] = "pointer";
                    }
                    $author.append( $authorLink );
                    onClick($addSkin, () => {
                        window.open("https://jasonsavard.com/wiki/Skins_and_Themes?ref=skinOptionsTab", "emptyWindow");
                    });
    
                    $skinsListing.append($row);
                });
            } catch (error) {
                $skinsListing.append("Problem loading skins: " + error);
            }

            hideLoading();
			
		} else if (tabName == "voiceInput") {
			if (!('webkitSpeechRecognition' in window)) {
				byId("voiceInput").setAttribute("disabled", true);
			}


			initVoiceInputOptions();

            if (await storage.get("voiceInput")) {
                byId("voiceInput").checked = true;
            }

            addEventListeners("#voiceInput", "change", async function () {
				if (this.checked) {
                    chrome.permissions.request({permissions: ["webRequest"]}, async function(granted) {
                        if (granted) {
                            await storage.enable("voiceInput");
                            // note: when removing webRequest it stays accessible until extension is reloaded
                            sendMessageToBG("initWebRequest");
        
                            chrome.tabs.query({ url: "https://mail.google.com/*" }, function (tabs) {
                                tabs.forEach(tab => {
                                    insertSpeechRecognition(tab.id);
                                });
                            });

                            initVoiceInputOptions();
                        }
                    });
				} else {
                    await storage.disable("voiceInput");
					// wait for pref to be saved then reload tabs
					await waitForStorageSync();
					chrome.tabs.query({ url: "https://mail.google.com/*" }, function (tabs) {
						tabs.forEach(tab => {
							chrome.tabs.reload(tab.id);
						});
                    });
                    
                    initVoiceInputOptions();
				}
			});

			// init languages
			if (window.voiceInputLanguage) {
				var voiceInputDialectPref = await storage.get("voiceInputDialect", getPreferredLanguage());
				var voiceInputLanguageIndex;
				var voiceInputDialectIndex;
				for (var i = 0; i < langs.length; i++) {
					voiceInputLanguage.options[i] = new Option(langs[i][0], i);
					//console.log("lang: " + langs[i][0]);
					for (var a = 1; a < langs[i].length; a++) {
						//console.log("dial: " + langs[i][a][0]);
						if (langs[i][a][0] == voiceInputDialectPref) {
							voiceInputLanguageIndex = i;
							voiceInputDialectIndex = a - 1;
							break;
						}
					}
				}

				voiceInputLanguage.selectedIndex = voiceInputLanguageIndex;
				updateVoiceInputCountry();
				voiceInputDialect.selectedIndex = voiceInputDialectIndex;

                addEventListeners("#voiceInputLanguage", "change", function () {
					updateVoiceInputCountry();
					if (voiceInputLanguage.options[voiceInputLanguage.selectedIndex].text == "English") {
						voiceInputDialect.selectedIndex = 6;
					}
					onVoiceInputLanguageChange();
				});

                addEventListeners("#voiceInputDialect", "change", function () {
					onVoiceInputLanguageChange();
				});
			}
		} else if (tabName == "admin") {
			onClick("#deleteAllCustomSounds", async function () {
				await storage.remove("customSounds");
				location.reload();
            });

            async function speedVar(name) {
                const begin = window.performance.now();
                await storage.get(name);
                return (window.performance.now() - begin)/1000+"secs";
            }
            
            onClick("#testSerialization", async () => {
                speed = await speedVar("browserButtonAction");
                speed2 = await speedVar("checkerPlusBrowserButtonActionIfNoEmail");
                speed3 = await speedVar("gmailPopupBrowserButtonActionIfNoEmail");
                speed4 = await speedVar("desktopNotification");
                speed5 = await speedVar("notificationSound");
                speed6 = await speedVar("notificationVoice");
                speed7 = await speedVar("accountAddingMethod");
                speed8 = await speedVar("donationClicked");
                speed9 = await speedVar("extensionUpdates");
                speed10 = await speedVar("icon_set");
                speed11 = await speedVar("showContactPhoto");
                speed12 = await speedVar("showNotificationEmailImagePreview");
                speed13 = await speedVar("previewing_marks_as_read");

                var begin = Date.now();
                let accounts = await retrieveAccounts();
                var end = Date.now();

                var timeSpent=(end-begin)/1000+"secs";



                begin = Date.now();
                accounts = await storage.get("accounts");
                // copy array (remove reference to storage.get) acocunts could be modified and since they were references they would also modify the storage.get > cache[]  So if we called storage.get on the same variable it would return the modified cached variables instead of what is in actual storage
                accounts = accounts.slice();
            
                console.log("retrieveAccounts " + "accounts", accounts);
                const promises = accounts.map(async account => {
                    const accountObj = new Account();
                    begin2 = Date.now();
                    copyObj(account, accountObj);
                    end2 = Date.now();
                    timeSpent22 = (end2-begin2)/1000+"secs";
    
                    begin3 = Date.now();
                    accountObj.init({
                        accountNumber:  account.id,
                        email:          account.email
                    });
                    end3 = Date.now();
                    timeSpent33 = (end3-begin3)/1000+"secs";
                
                    accountObj.setHistoryId(account.historyId);
            
                    begin4 = Date.now();
                    if (account.mails) {
                        try {
                            account.mails = await Encryption.decryptObj(account.mails, dateReviver);
                            begin4b = Date.now();
                            const mailObjs = convertMailsToObjects(account.mails, accountObj);
                            end4b = Date.now();
                            timeSpent4b = (end4b-begin4b)/1000+"secs";
                            accountObj.setMail(mailObjs);
                        } catch (error) {
                            console.warn("ignore decrypt error", error);
                        }
                    } else {
                        accountObj.setMail([]);
                    }
                    end4 = Date.now();
                    timeSpent44 = (end4-begin4)/1000+"secs";
            
                    if (account.unsnoozedEmails) {
                        try {
                            account.unsnoozedEmails = await Encryption.decryptObj(account.unsnoozedEmails, dateReviver);
                            accountObj.setUnsnoozedEmails(convertMailsToObjects(account.unsnoozedEmails, accountObj));
                        } catch (error) {
                            console.warn("ignore decrypt error2", error, account.unsnoozedEmails);
                        }
                    } else {
                        accountObj.setUnsnoozedEmails([]);
                    }
            
                    begin5 = Date.now();
                    if (account.labels) {
                        accountObj.setLabels(JSON.parse(account.labels, dateReviver));
                        delete accountObj.labels; // delete this public attribute because setLabels above places it in the private attribute - to avoid confusion
                    }
                    end5 = Date.now();
                    timeSpent55 = (end5-begin5)/1000+"secs";

                    return accountObj;
                });

                await Promise.all(promises)

                end = Date.now();
                let timeSpent4 = (end-begin)/1000+"secs";


                console.log("accounts", accounts);
                let size = 0;
                JSON.stringify(accounts, function(key, value) {
                    console.log(key + ": " + typeof value, value);
                    if (value) {
                        if (value.length) {
                            console.log("len: " + value.length)
                            size += value.length;
                        }
                        if (value.byteLength) {
                            console.log("bytelen: " + value.byteLength);
                            size += value.byteLength;
                        }
                    }
                    return value;
                });

                begin = Date.now();
                await storage.get("accounts");
                end = Date.now();
                let timeSpent2 = (end-begin)/1000+"secs";

                niceAlert(`${speed}<br>${speed2}<br>${speed3}<br>${speed4}<br>${speed5}<br>${speed6}<br>${speed7}<br>${speed8}<br>${speed9}<br>${speed10}<br>${speed11}<br>${speed12}<br>${speed13}<br>accounts: ${accounts.length}<br>${timeSpent}<br>${timeSpent2}<br>${timeSpent4}<br>${timeSpent33}<br>${timeSpent44}<br>${timeSpent55}<br>${timeSpent4b}<br>size: ${new Intl.NumberFormat().format(size)}`);
            });

            onClick("#testReadAll", async () => {
                begin = Date.now();
                await wrappedDB.readAllObjects("settings");
                end = Date.now();
                let timeSpent = (end-begin)/1000+"secs";

                niceAlert(`${timeSpent}`);
            });

            onClick("#revokeAllAccess", async () => {
                if (await storage.get("accountAddingMethod") == "autoDetect") {
                    const response = await sendMessageToBG("removeAllAccountsAccess");
            
                    if (response?.error) {
                        niceAlert("Problem: " + response?.error);
                    } else {
                        niceAlert("Done. The auto-detect mode uses default access to mail.google.com when you installed the extension. Therefore you would have to remove the extension to complete this task.");
                    }
                } else {
                    openGenericDialog({
                        content: "This will revoke access to all accounts. You could instead uncheck the accounts in the Accounts section.",
                        okLabel: getMessage("continue"),
                        showCancel: true
                    }).then(async dialogResponse => {
                        if (dialogResponse == "ok") {
                            showLoading();
    
                            const response = await sendMessageToBG("removeAllAccounts");
                            await initAllAccounts();
                    
                            if (response?.error) {
                                niceAlert("Problem: " + response?.error);
                            } else {
                                pollAndLoad({showNotification: false});
                                niceAlert("Done");
                            }
                        }
                    });
                }
            });

            onClick("#resetSettings", async () => {
                localStorage.clear();
                
                //wrappedDB.db.close();
                const req = indexedDB.deleteDatabase(wrappedDB.db.name);
                req.onsuccess = function () {
                    niceAlert("Click OK to restart the extension").then(() => {
                        reloadExtension();
                    });
                };
                req.onerror = function () {
                    niceAlert("Couldn't delete database");
                };
                req.onblocked = function () {
                    // even if blocked, seems storage is still erased
                    niceAlert("Click OK to restart the extension (code: sb)").then(() => {
                        reloadExtension();
                    });
                };
            });

			onClick("#saveSyncOptions", function (event) {
				syncOptions.save("manually saved").then(function () {
					openGenericDialog({
						title: getMessage("done"),
						content: "Make sure you are signed into the browser for the sync to complete",
						cancelLabel: getMessage("moreInfo")
					}).then(response => {
						if (response == "cancel") {
							if (DetectClient.isFirefox()) {
								openUrl("https://support.mozilla.org/kb/access-mozilla-services-firefox-accounts");
							} else {
								openUrl("https://support.google.com/chrome/answer/185277");
							}
						}
					});
				}).catch(function (error) {
					showError("Error: " + error);
				});
				event.preventDefault();
                event.stopPropagation();
			});

			onClick("#loadSyncOptions", function (event) {
				syncOptions.fetch(function (response) {
					// do nothing last fetch will 
					console.log("syncoptions fetch response", response);
				}).catch(function (response) {
					console.log("catch response", response);
					// probably different versions
					if (response && response.items) {
						return new Promise(function (resolve, reject) {
                            const content = new DocumentFragment();
                            content.append(response.error, createBR(), createBR(), "You can force it but it might create issues in the extension and the only solution will be to re-install without loading settings!")

							openGenericDialog({
								title: "Problem",
								content: content,
								okLabel: "Force it",
								showCancel: true
							}).then(function (dialogResponse) {
								if (dialogResponse == "ok") {
									resolve(response.items);
								} else {
									reject("cancelledByUser");
								}
							});
						});
					} else {
						throw response;
					}
				}).then(function (items) {
					console.log("syncoptions then");
					return syncOptions.load(items);
				}).then(function () {
					niceAlert("Click OK to restart the extension").then(() => {
						reloadExtension();
					});
				}).catch(function (error) {
					console.log("syncoptions error: " + error);
					if (error != "cancelledByUser") {
						openGenericDialog({
							content: "error loading options: " + error
						});
					}
				});

				event.preventDefault();
                event.stopPropagation();
			});

			onClick("#exportLocalStorage", function () {
				downloadObject(localStorage, "localStorage.json");
			})
			onClick("#importLocalStorage", function () {
				var localStorageText = byId("jsonString").value;
				if (localStorageText) {
					var localStorageImportObj = JSON.parse(localStorageText);
					localStorage.clear();
					for (const item in localStorageImportObj) {
						localStorage.setItem(item, localStorageImportObj[item]);
					}
					niceAlert("Done. Reload the extension to use these new settings!");
				} else {
					niceAlert("Must enter JSON string!")
				}
			})

			onClick("#importIndexedDB", function () {
				var jsonString = byId("jsonString").value;
				if (jsonString) {
					var jsonObject = JSON.parse(jsonString);

					syncOptions.importIndexedDB(jsonObject).then(function () {
						niceAlert("Done. Reload the extension to use these new settings!");
					}).catch(function (error) {
						niceAlert(error);
					});

				} else {
					niceAlert("Must enter JSON string!")
				}
			});

			onClick("#exportIndexedDB", function () {
				syncOptions.exportIndexedDB({ exportAll: true }, function (response) {
					if (response.error) {
						niceAlert(response.error);
					} else {
						downloadObject(response.data, "indexedDB.json");
					}
				});
			});

			onClick("#maxUnauthorizedAccount paper-item", async function () {
				await waitForStorageSync();
				pollAndLoad({ showNotification: true });
			});

            addEventListeners("#console_messages", "change", async () => {
                await waitForStorageSync();
                await niceAlert("Click OK to restart the extension");
                reloadExtension();
            });

            addEventListeners("#disableOnline", "change", async () => {
                await waitForStorageSync();
                await niceAlert("Click OK to restart the extension");
                reloadExtension();
            });

            byId("cacheStorage").checked = localStorage["cacheIndexedDB"] != "false";

            addEventListeners("#cacheStorage", "change", function() {
                if (this.checked) {
                    localStorage["cacheIndexedDB"] = "true";
                } else {
                    //localStorage.removeItem("cacheIndexedDB");
                    localStorage["cacheIndexedDB"] = "false";
                }
            });
		}
	}
}

function showOptionsSection(tabName) {
	console.log("showtabName: " + tabName)
	byId("mainTabs").selected = tabName;
	byId("pages").selected = tabName;

    selectorAll(".page").forEach(el => el.classList.remove("active"));
	setTimeout(() => {
		selector(".page.iron-selected")?.classList.add("active");
	}, 1);

    //document.body.scrollTop = 0;
    selector("app-header-layout app-header").scrollTarget.scroll({top:0})

	initPage(tabName);
	// wait for tab animation
	setTimeout(() => {
		selector("app-header").notifyResize();
    }, 500);
    
    // timeout required because the pushstate created chopiness
    requestIdleCallback(() => {
        history.pushState({}, "blah", "#" + tabName);
    }, {
        timeout: 500
    })

	const emailParam = getUrlValue("accountEmail");
	if (tabName == "accounts") {
        // reinit accounts because welcome page might have loaded before polling accounts finished
        initAllAccounts().then(() => {
            if (emailParam) {
                loadAccountsOptions({ selectedEmail: emailParam });
            } else {
                setTimeout(function () {
                    loadAccountsOptions();
                }, 500)
            }
        });
	} else if (tabName == "dnd") {
        // reinit accounts because welcome page might have loaded before polling accounts finished
        initAllAccounts().then(() => {
            setTimeout(() => {
                const dndAccounts = byId("dnd-accounts");
                emptyNode(dndAccounts);

                asyncForEach(accounts, async (account, i) => {
                    const $div = document.createElement("div");

                    const $checkbox = document.createElement("paper-checkbox");
                    $checkbox.setAttribute("email", account.getEmail());
                    $checkbox.checked = await account.getSetting("dnd-by-account");
                    onClick($checkbox, event => {
                        account.saveSetting("dnd-by-account", $checkbox.checked);
                    });

                    $div.append($checkbox);

                    $div.append(account.getEmail());
                    dndAccounts.append($div);
                });
            }, 500)
        });
    }
}

function initSelectedTab() {
	var tabId = location.href.split("#")[1];
	
	if (tabId) {
		showOptionsSection(tabId);
	} else {
		showOptionsSection("notifications");
	}
}

function getSelectedAccount() {
	return byId("monitorLabels")._account;
}

async function pollAndLoad(params) {
	console.log("pollAndLoad");
	showLoading();
    
    try {
        await sendMessageToBG("pollAccounts", params);
        await initAllAccounts();
		loadAccountsOptions(params);
    } catch (error) {
        showError(error);
    } finally {
        hideLoading();
    }
}

function addPaperItem(params) { // node, value, label, prepend
	var paperItem;
	
	if (params.icon) {
		paperItem = document.createElement("paper-icon-item");

        const $ironIcon = document.createElement("iron-icon");
        $ironIcon.setAttribute("slot", "item-icon");
        $ironIcon.setAttribute("icon", params.icon);

		emptyAppend(paperItem, $ironIcon, params.label); // patch seems polymer would add shadydom when creating the paper-icon-item so i had to remove it
	} else {
		paperItem = document.createElement("paper-item");
		const textNode = document.createTextNode(params.label);
		paperItem.appendChild(textNode);
	}
	
	paperItem.setAttribute("value", params.value);
	
	if (params.prepend) {
		params.node.insertBefore(paperItem, params.node.firstChild);
	} else {
		params.node.appendChild(paperItem);
	}
}

function addSeparator(node, prepend) {
	const paperItem = document.createElement("paper-item");
	paperItem.setAttribute("class", "separator");
	paperItem.setAttribute("disabled", "");
	
	if (prepend) {
		node.insertBefore(paperItem, node.firstChild);
	} else {
		node.appendChild(paperItem);
	}
}

async function generateSoundOptions(account, labelValue) {
	let template = byId("soundsDropDown");
	if (template) {
		template = template.cloneNode(true);
        template.content.querySelector("paper-dropdown-menu").setAttribute("label", getMessage("notificationSound"));
		const paperMenuDiv = template.content.querySelector("paper-listbox");
	
		const sounds = await storage.get("customSounds");
		if (sounds?.length) {
			addSeparator(paperMenuDiv);
            sounds.forEach(sound => {
				addPaperItem({node:paperMenuDiv, value:"custom_" + sound.name, label:sound.name});
			});
		}
		
		addSeparator(paperMenuDiv);
		addPaperItem({node:paperMenuDiv, value:"custom", label:getMessage("uploadSound"), icon:"cloud-upload"});
		addPaperItem({node:paperMenuDiv, value:"record", label:getMessage("recordSound"), icon:"av:mic"});

		var $dropdown = document.importNode(template.content, true);
		var $paperMenu = $dropdown.querySelector("paper-listbox");
	
		initMessages($dropdown.querySelectorAll("paper-item, paper-icon-item"));
		
		const defaultValue = await storage.get("notificationSound");
		
		if (account) {
			const settingValue = await account.getSettingForLabel("sounds", labelValue, defaultValue);
			$paperMenu.setAttribute("selected", settingValue);
		} else {
			$paperMenu.setAttribute("selected", defaultValue);
		}
		
		if (account) {
			initPaperElement($paperMenu, {mustDonate:true, account:account, key:"sounds", label:labelValue});
		}
		
		onClick($paperMenu.querySelectorAll("paper-item, paper-icon-item"), async function(event) {
			const $paperMenu = this.closest("paper-listbox");
			const soundName = this.getAttribute("value");

			if (DetectClient.isWindows() && !soundName) {
                let showWarning;
                const desktopNotification = await storage.get("desktopNotification");
				if (account) { // show warning if sound off and specific label notifs off
					showWarning = await account.getSettingForLabel("notifications", labelValue, desktopNotification);
				} else { // show warning if general sound off and notifiations off
					showWarning = desktopNotification;
				}
				if (showWarning) {
					// commented because I'm using "silent = true" for notifications
					//niceAlert("Note: Windows also has notification sounds. To disable them follow these <a href='https://jasonsavard.com/wiki/Notification_Sounds'>instructions</a>.");
				}
			}

			if (!account) {
				byId("playNotificationSound").style.display = "block";

				if (soundName) {
					fadeIn("#soundOptions");
				} else {
					hide("#soundOptions");
				}
			}

			if (soundName && soundName != "custom" && soundName != "record") {
				playSound(soundName);
			}

			if (soundName == "custom") {
				if (!account || await storage.get("donationClicked")) {
					openSoundDialog({$paperMenu:$paperMenu, account:account, labelValue:labelValue});
				} else {
					// do nothing cause the initOptions will take care of contribute dialog
				}
			} else if (soundName == "record") {
				if (!account || await storage.get("donationClicked")) {
					var mediaStream;
					var mediaRecorder;
					var chunks = [];
					var blob;
					
					var $dialog = initTemplate("recordSoundDialogTemplate");
					var $recordSoundWrapper = $dialog.querySelector(".recordSoundWrapper");
					var $recordSound = $dialog.querySelector("#recordSoundButton");
                    onClickReplace($recordSound, function() {
						if ($recordSoundWrapper.classList.contains("recording")) {
							mediaRecorder.stop();
						} else {
							//navigator.mediaDevices.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
							navigator.mediaDevices.getUserMedia({audio: true}).then(responseMediaStream => {
								mediaStream = responseMediaStream;
                                replaceEventListeners($dialog, "iron-overlay-closed", function() {
									mediaStream.getAudioTracks()[0].stop();
									$recordSoundWrapper.classList.remove("recordedSound", "recording");
								});
								
								chunks = [];
								mediaRecorder = new MediaRecorder(mediaStream);
								mediaRecorder.start();
								mediaRecorder.ondataavailable = function(e) {
									chunks.push(e.data);
									
									mediaStream.getTracks().forEach(function(track) {
										track.stop();
									});
									
									blob = new Blob(chunks, { 'type' : 'audio/webm' }); //  'audio/webm'  OR   audio/ogg; codecs=opus
									blobToBase64(blob).then(response => {
										$dialog.querySelector("source").src = response;
										
										$recordSoundWrapper.classList.remove("recording");
										$recordSoundWrapper.classList.add("recordedSound");
										
										$dialog.querySelectorAll(".buttons").forEach(el => el.removeAttribute("hidden"));

                                        $dialog.querySelector("audio").load();
										return $dialog.querySelector("audio").play();
									}).catch(error => {
										showError(error);
									});
								}
								mediaRecorder.onwarning = function(e) {
								    console.warn('mediarecord wraning: ' + e);
								};
								mediaRecorder.onerror = function(e) {
									console.error('mediarecord error: ' + e);
									showError(e);
								};
								
								$recordSoundWrapper.classList.remove("recordedSound");
								$recordSoundWrapper.classList.add("recording");
							}).catch(error => {
								showError(error.name);
							});
						}
					});
					
					onClickReplace($dialog.querySelector(".okDialog"), function() {
						if (byId("recordedSoundTitle").validate()) {
							addCustomSound({
                                $paperMenu: $paperMenu,
                                account: account,
                                labelValue: labelValue,
                                title: byId("recordedSoundTitle").value,
                                data: $dialog.querySelector("source").src,
                                overwrite:true
                            });
							$dialog.close();
							showMessage(getMessage("done"));
						}
					});
					
					openDialog($dialog).then();
				}
			} else if (!account) {
				storage.set("notificationSound", soundName).catch(error => {
					showError(error);
				});
			}
		});
		
		onClick("#browserButtonAction", function() {
			hide("#browserButtonActionToolTip");
		});
		
	}
	
	return $dropdown;
}

async function generateVoiceOptions(account, labelValue) {
	var template = byId("voiceHearOptionsDropDown");
	if (template) {
        template = template.cloneNode(true);
        template.content.querySelector("paper-dropdown-menu").setAttribute("label", getMessage("hearEmail"));
		const paperMenuDiv = template.content.querySelector("paper-listbox");
	
		if (account) {
			addSeparator(paperMenuDiv, true);
			addPaperItem({node:paperMenuDiv, value:"", label:getMessage("off"), prepend:true});
		}

		var $dropdown = document.importNode(template.content, true);
		var $paperMenu = $dropdown.querySelector("paper-listbox");
	
		initMessages($dropdown.querySelectorAll("*"));
		
		var defaultValue = await storage.get("voiceHear");
		
		if (account) {
			const settingValue = await account.getSettingForLabel("voices", labelValue, defaultValue);
			$paperMenu.setAttribute("selected", settingValue);
		} else {
			$paperMenu.setAttribute("selected", defaultValue);
		}
		
        onClick($paperMenu.querySelectorAll("paper-item"), function() {
			var $paperMenu = this.closest("paper-listbox");
			var voiceValue = this.getAttribute("value");
			
			var storagePromise;
			if (account) {
				storagePromise = account.saveSettingForLabel("voices", labelValue, voiceValue);
			} else {
				storagePromise = storage.set("voiceHear", voiceValue);
			}
			storagePromise.catch(error => {
				showError(error);
			});
		});
	}
	
	return $dropdown;	
}

// desc: stores labelvalue in monitorlabelline node
async function generateMonitorLabelOptions(account, title, labelValue, icon) {
	if (icon == "NONE") {
		icon = "";
	} else if (!icon) {
		icon = "icons:label";
	}

    const $monitorLabelLine = document.createElement("div");
    $monitorLabelLine.classList.add("monitorLabelLine", "layout", "horizontal", "center");

    const $monitoredLabelCheckbox = document.createElement("paper-checkbox");
    $monitoredLabelCheckbox.classList.add("monitoredLabelCheckbox", "flex");
    $monitoredLabelCheckbox.title = title;

    const $labelWrapper = document.createElement("div");
    $labelWrapper.classList.add("layout", "horizontal");

    const $labelIcon = document.createElement("iron-icon");
    $labelIcon.classList.add("labelIcon");
    $labelIcon.setAttribute("icon", icon);

    const $label = document.createElement("div");
    $label.classList.add("label");
    $label.textContent = title;

    $labelWrapper.append($labelIcon, " ", $label);
    $monitoredLabelCheckbox.append($labelWrapper);

    const $soundOptionsWrapper = document.createElement("div");
    $soundOptionsWrapper.classList.add("soundOptionsWrapper");

    const $voiceOptionsWrapper = document.createElement("div");
    $voiceOptionsWrapper.classList.add("voiceOptionsWrapper");

    const $notificationWrapper = document.createElement("div");

    const $notificationButton = document.createElement("paper-icon-button");
    $notificationButton.setAttribute("icon", "social:notifications");
    $notificationButton.classList.add("toggleIcon", "notification");

    const $notificationButtonTooltip = document.createElement("paper-tooltip");
    $notificationButtonTooltip.setAttribute("animation-delay", "0");
    $notificationButtonTooltip.classList.add("desktopNotificationsTooltip");
    $notificationButtonTooltip.textContent = getMessage("showDesktopNotifications");

    $notificationWrapper.append($notificationButton, $notificationButtonTooltip);

    const $tabWrapper = document.createElement("div");

    const $tabButton = document.createElement("paper-icon-button");
    $tabButton.setAttribute("icon", "icons:tab");
    $tabButton.classList.add("toggleIcon", "tab");

    const $tabButtonTooltip = document.createElement("paper-tooltip");
    $tabButtonTooltip.setAttribute("animation-delay", "0");
    $tabButtonTooltip.classList.add("tabTooltip");
    $tabButtonTooltip.textContent = getMessage("tabToolTip");

    $tabWrapper.append($tabButton, $tabButtonTooltip);

    $monitorLabelLine.append($monitoredLabelCheckbox, " ", $soundOptionsWrapper, " ", $voiceOptionsWrapper, " ", $notificationWrapper, " ", $tabWrapper);

    
	if (!await storage.get("donationClicked")) {
		$soundOptionsWrapper.setAttribute("mustDonate", "");
	}

	if (labelValue == SYSTEM_INBOX) {
        const $inboxLabelToolTip = document.createElement("paper-tooltip");
        $inboxLabelToolTip.id = "inboxLabelToolTip";
        $inboxLabelToolTip.setAttribute("position", "right");
        $inboxLabelToolTip.setAttribute("manual-mode", "true");
        $inboxLabelToolTip.textContent = `${getMessage("uncheckInboxLabel")}. This is used for the classic Gmail inbox`;

        $monitorLabelLine.append($inboxLabelToolTip);
	}
	if (labelValue == SYSTEM_IMPORTANT_IN_INBOX) {
		$monitorLabelLine.classList.add("importantInInbox");
	}
	if (labelValue == SYSTEM_PRIMARY) {
		$monitorLabelLine.classList.add("primaryCategory");

        const $primaryLabelToolTip = document.createElement("paper-tooltip");
        $primaryLabelToolTip.id = "primaryLabelToolTip";
        $primaryLabelToolTip.setAttribute("position", "right");
        $primaryLabelToolTip.setAttribute("manual-mode", "true");
        $primaryLabelToolTip.textContent = `${getMessage("checkPrimaryOrMore")}. This adds them to the count and the popup window`;

		$monitorLabelLine.append($primaryLabelToolTip);
	}

	$monitorLabelLine._labelValue = labelValue;

	if (monitorLabelsEnabled.includes(labelValue)) {		
		$monitoredLabelCheckbox.checked = true;

		var $soundOptions = await generateSoundOptions(account, labelValue);
		var $voiceOptions = await generateVoiceOptions(account, labelValue);
		
		$soundOptionsWrapper.append($soundOptions);
		$voiceOptionsWrapper.append($voiceOptions);
	} else {
		$monitorLabelLine.classList.add("disabledLine");
	}
	
	// sound notifications are handled inside generateSoundOptions()
	// voice notifications are handled inside generateVoiceOptions()
	
	var settingValue;

	// desktop notifications
	settingValue = await account.getSettingForLabel("notifications", labelValue, await storage.get("desktopNotification"));
	if (settingValue) {
		$notificationButton.setAttribute("enabled", "");
	}

    onClick($notificationButton, function() {
		toggleAttr(this, "enabled");
		const enabled = this.getAttribute("enabled") != undefined;
		account.saveSettingForLabel("notifications", labelValue, enabled).catch(error => {
			showError(error);
		});
	});

	// tabs
	settingValue = await account.getSettingForLabel("tabs", labelValue, false);
	toggleAttr($tabButton, "enabled", settingValue);

    onClick($tabButton, async function() {
		if (await storage.get("donationClicked")) {
			toggleAttr(this, "enabled");
			const enabled = this.getAttribute("enabled") != undefined;
			account.saveSettingForLabel("tabs", labelValue, enabled);
		} else {
			openContributeDialog("tabForLabel");
		}
	});

	return $monitorLabelLine;
}

function getEnabledLabels() {
	var values = [];
	
	// loop through lines to pull data and then see if checkbox inside line is checked
	selectorAll(".monitorLabelLine").forEach(function(el) {
		const labelValue = el._labelValue;
		if (el.querySelector(".monitoredLabelCheckbox[checked]")) {
			values.push(labelValue);
		}
	});
	return values;
}

function addCollapse($monitorLabels, opened, title, id) {
    const $header = document.createElement("div");
    $header.classList.add("layout", "horizontal", "accountsLabelsHeader", "expand");
    $header.style.cssText = "padding:10px 20px;position:relative;cursor:pointer";

    if (id) {
        $header.id = id;
    }
    $header.append(document.createElement("paper-ripple"));

    const $expand = document.createElement("iron-icon");
    $expand.setAttribute("icon", "expand-more");
    $expand.style["margin-left"] = "5px";

    $header.append(title, $expand)

	$monitorLabels.append($header);

	const $collapse = document.createElement("iron-collapse");
	if (opened) {
		$collapse.setAttribute("opened", "");
		$header.classList.add("opened");
	}
	
    onClick($header, function() {
		$collapse.toggle();
		$header.classList.toggle("opened");
	});
	
	$monitorLabels.append($collapse);
	return $collapse;
}

async function loadLabels(params) {
	console.log("load labels");
	var account = params.account;
	
	const $monitorLabels = byId("monitorLabels");
    if ($monitorLabels) {
        $monitorLabels._account = account;
	
        if (account) {
            emptyNode($monitorLabels);
            
            monitorLabelsEnabled = await account.getMonitorLabels();
    
            var $option, $collapse;
    
            var systemLabelsOpened = !await account.isUsingGmailCategories()
                || monitorLabelsEnabled.includes(SYSTEM_INBOX)
                || monitorLabelsEnabled.includes(SYSTEM_IMPORTANT)
                || monitorLabelsEnabled.includes(SYSTEM_IMPORTANT_IN_INBOX)
                || monitorLabelsEnabled.includes(SYSTEM_ALL_MAIL);
            $collapse = addCollapse($monitorLabels, systemLabelsOpened, getMessage("systemLabels"));
            
            $option = await generateMonitorLabelOptions(account, getMessage("inbox"), SYSTEM_INBOX, "icons:inbox");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("importantMail"), SYSTEM_IMPORTANT, "icons:info-outline");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("importantMail") + " " + getMessage("in") + " " + getMessage("inbox"), SYSTEM_IMPORTANT_IN_INBOX, "icons:info-outline");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("allMail"), SYSTEM_ALL_MAIL, "communication:present-to-all");
            $collapse.append($option);
            
            var categoryLabelsOpened = !systemLabelsOpened || await account.isMaybeUsingGmailCategories() || hasMainCategories(monitorLabelsEnabled);
            $collapse = addCollapse($monitorLabels, categoryLabelsOpened, getMessage("categories"), "categoriesLabel");
    
            $option = await generateMonitorLabelOptions(account, getMessage("primary"), SYSTEM_PRIMARY, "icons:inbox");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("social"), SYSTEM_SOCIAL, "social:people");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("promotions"), SYSTEM_PROMOTIONS, "maps:local-offer");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("updates"), SYSTEM_UPDATES, "icons:flag");
            $collapse.append($option);
            $option = await generateMonitorLabelOptions(account, getMessage("forums"), SYSTEM_FORUMS, "communication:forum");
            $collapse.append($option);
            
            $collapse = addCollapse($monitorLabels, true, getMessage("labels"));
    
            const $spinner = document.createElement("paper-spinner");
            $spinner.setAttribute("active", "");
            $spinner.style.cssText = "margin-left:20px";
    
            $monitorLabels.append($spinner);
            
            account.getLabels(params.refresh).then(async labels => {
                await asyncForEach(labels, async label => {
                    $option = await generateMonitorLabelOptions(account, label.name, label.id);
                    if (label.color) {
                        $option.querySelector(".labelIcon").style.color = label.color.backgroundColor;
                    }
                    $collapse.append($option);
                });
            }).catch(error => {
                console.error(error);
                const $div = document.createElement("div");
                $div.style.cssText = "color:red;padding:5px";
                $div.textContent = error;
                $monitorLabels.append($div);
            }).then(() => {
                $spinner.remove();
            });
        }
    }
}

function processEnabledSetting(node, settingName) {
	toggleAttr(node, "enabled");
	
	const enabled = node.getAttribute("enabled") != undefined;
	
	const account = getAccountByNode(node);
	account.saveSetting(settingName, enabled);

	setTimeout(function() {
		console.log("blur");
		node.closest("paper-item").blur();
	}, 1);

	// if already loaded this account's labels then cancel bubbling to paper-item
	if (getSelectedAccount().getEmail() == account.getEmail()) {
		return false;
	} else {
		return true;
	}
}

function getAccountByNode(node) {
	const email = node.closest("paper-item[email]")?.getAttribute("email");
	return getAccountByEmail(email, true);
}

async function requestGmailHostPermissions() {
    return new Promise((resolve, reject) => {
        chrome.permissions.request({
            origins: [Origins.GMAIL]
        }, result => {
            if (result) {
                show("#grant-host-permission");
                pollAndLoad({showNotification:true, refresh:true}).then(() => {
                    resolve(result);
                });
            } else {
                niceAlert("That's OK, you can try the Add Account option in the Accounts tab.");
                highlightAddAccount();
            }
        });
    });
}

async function loadAccountsOptions(loadAccountsParams = {}) {
	console.log("loadAccountsOptions", loadAccountsParams);
	let allAccounts = accounts;
	
	var $monitorLabels = byId("monitorLabels");

	// only do this if accounts detected or oauth because or we leave the signInToYourAccount message in the dropdown
	if (allAccounts.length || await storage.get("accountAddingMethod") == "oauth") {
		emptyNode($monitorLabels);
	}
	
	if (await storage.get("accountAddingMethod") == "autoDetect") {
		allAccounts = allAccounts.concat(ignoredAccounts);
	}
	
	if (allAccounts.length) {
		show("#syncSignInOrder");
	} else {
		hide("#syncSignInOrder");
	}
	
	window.accountsList = [];

	var selectedAccount;

    await asyncForEach(allAccounts, async (account, i) => {
		if ((i==0 && !loadAccountsParams.selectedEmail) || (loadAccountsParams.selectedEmail && loadAccountsParams.selectedEmail == account.getEmail())) {
			selectedAccount = account;
		}
		
		accountsList.push({
			email:                          account.getEmail(),
			openLabel:                      await account.getOpenLabel(),
			showSignatureAndFetchedData:    await account.getSetting("showSignature", "accountsShowSignature") && await account.hasSignature(),
			conversationView:               await account.getSetting("conversationView"),
			ignore:                         await storage.get("accountAddingMethod") == "autoDetect" && await account.getSetting("ignore")
		});
	});

    document.body.classList.toggle("only-one-account", accountsList.length <= 1);

	loadAccountsParams.account = selectedAccount;
	loadLabels(loadAccountsParams);

	window.accountsBind = document.querySelector('#accountsBind');
	// could only set this .data once and could not use .push on it or it breaks the bind

    if (accountsBind) {
        accountsBind.data = accountsList;
	
        setTimeout(async function() {
    
            var lastError;
            var lastErrorCode;
            
            if (accountsList.length) {
                initMessages(selectorAll("#accountsList *"));
                if (selectedAccount) {
                    byId("accountsList").select(selectedAccount.getEmail());
                } else {
                    byId("accountsList").select(accountsList.first().email);
                }


                const $accounts = byId("accountsList").querySelectorAll("paper-item[email]");
                const accountAddingMethod = await storage.get("accountAddingMethod");

                function handleDragStart(e) {
                    this.style.opacity = '0.4';
                  
                    globalThis.dragSrcEl = this;
                  
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/html', this.innerHTML);
                  }
            
                function handleDragEnd(e) {
                    this.style.opacity = '1';
                
                    $accounts.forEach(el => {
                        el.classList.remove('over');
                    });
                }
            
                function handleDragOver(e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    }

                    this.classList.add('over');
                    return false;
                }
            
                function handleDragEnter(e) {
                    //this.classList.add('over');
                }
            
                function handleDragLeave(e) {
                    this.classList.remove('over');
                }

                function handleDrop(e) {
                    e.stopPropagation();
                  
                    if (globalThis.dragSrcEl !== this) {
                        if (accountAddingMethod == "autoDetect") {
                            const content = new DocumentFragment();
                            content.append("Option 1: Change to the Add Account option above then drag the accounts to reorder them.");
                            content.append(createBR());
                            content.append("Option 2: Sign out and back into the accounts in the order you want to see them in the extension.");

                            niceAlert(content);
                            highlightAddAccount();
                        } else {
                            // swap
                            const sourceIndex = accounts.findIndex(account => account.getEmail() == globalThis.dragSrcEl.getAttribute("email"));
                            const destIndex = accounts.findIndex(account => account.getEmail() == this.getAttribute("email"));

                            // swap accounts
                            [accounts[sourceIndex], accounts[destIndex]] = [accounts[destIndex], accounts[sourceIndex]];
                            // swap accountslist to rebind
                            [accountsList[sourceIndex], accountsList[destIndex]] = [accountsList[destIndex], accountsList[sourceIndex]];

                            // must reset first
                            accountsBind.data = null;
                            accountsBind.data = accountsList;

                            delete window.initMiscPromise;
                            serializeAccounts(accounts);
                            sendMessageToBG("resetInitMiscWindowVars");

                            //globalThis.dragSrcEl.innerHTML = this.innerHTML;
                            //this.innerHTML = e.dataTransfer.getData('text/html');

                            byId("accountsList").select(-1);
                            byId("accountsList").querySelectorAll("paper-item[email]").forEach(el => el.blur());
                        }
                    }
                  
                    return false;
                }

                $accounts.forEach($account => {
                    const account = getAccountByNode($account);
                    if (account.error) {
                        lastError = account.getError().niceError + " " + account.getError().instructions;
                        lastErrorCode = account.errorCode;
                        $account.querySelector(".accountError").textContent = lastError;
                    } else {
                        $account.querySelector(".accountError").textContent = "";
                    }

                    $account.addEventListener('dragstart', handleDragStart);
                    $account.addEventListener('dragover', handleDragOver);
                    $account.addEventListener('dragenter', handleDragEnter);
                    $account.addEventListener('dragleave', handleDragLeave);
                    $account.addEventListener('dragend', handleDragEnd);
                    $account.addEventListener('drop', handleDrop);
                });
            }
    
            // patch because when paper-item was focused we couldn't get paper-tooltip to work inside the paper-item
            byId("accountsList").querySelectorAll("paper-item[email]").forEach(el => el.blur());

            onClickReplace("#grant-host-permission", () => {
                requestGmailHostPermissions();
            });
            
            if (await storage.get("accountAddingMethod") == "autoDetect") {
                if (await hasGmailHostPermission()) {
                    if (accountsList.length == 0 || (lastError && lastErrorCode != JError.CANNOT_ENSURE_MAIN_AND_INBOX_UNREAD)) {
                        hide("#grant-host-permission");
                        show("#accountErrorButtons");
                    } else {
                        hide("#grant-host-permission");
                        hide("#accountErrorButtons");
                    }
                } else {
                    show("#grant-host-permission");
                    hide("#accountErrorButtons");
                }
            } else {
                hide("#grant-host-permission");
                hide("#accountErrorButtons");
            }
            
            if (lastError) {
                showError(lastError);
            }
    
        }, 1);
    }
	
    document.body.classList.toggle("disabledSound", !await storage.get("notificationSound"));
	document.body.classList.toggle("disabledVoice", !await storage.get("notificationVoice"));
	document.body.classList.toggle("disabledNotification", !await storage.get("desktopNotification"));
	document.body.classList.toggle("browserButtonAction_gmailInbox", await storage.get("browserButtonAction") == BROWSER_BUTTON_ACTION_GMAIL_INBOX);
	
	console.log("accountslist event handlers")

    const $accountsList = byId("accountsList");
    if ($accountsList && !$accountsList._delegatesAttached) {

        onClick($accountsList, event => {
            console.log(event.target);
            const account = getAccountByNode(event.target);
            if (!account) {
                console.warn("there might be no accounts listed");
                return;
            }
            const $paperItem = event.target.closest("paper-item[email]");
            
            if (event.target.matches(".openLabel paper-item")) {
                const openLabel = event.target.getAttribute("value");
                account.saveSetting("openLabel", openLabel);
            } else if (event.target.matches(".ignoreAccount")) {
                (async () => {
                    const account = getAccountByNode(event.target);
                
                    if (account) {
                        if (event.target.checked) {
                            await account.saveSetting("ignore", false);
                            event.target.closest("paper-item").removeAttribute("ignore");
                            sendMessageToBG("pollAccounts", {showNotification : true});
                        } else {
                            if (await storage.get("accountAddingMethod") == "autoDetect") {
                                await account.saveSetting("ignore", true);
                                event.target.closest("paper-item").setAttribute("ignore", "");
                                sendMessageToBG("pollAccounts", {showNotification : true});
                            } else {
                                await sendMessageToBG("accountAction", {account: account, action: "remove"}, true);
                                pollAndLoad({showNotification:false});
                            }
                        }
                    } else {
                        niceAlert("Could not find account! Click OK to refresh").then(() => {
                            pollAndLoad({showNotification:true, refresh:true});
                        });
                    }
                })();
            } else {
                if (event.target.closest(".move-icon")) {
                    niceAlert(getMessage("dragToChangeOrder"));
                } else if (event.target.matches(".signature")) {
                    (async () => {
                        if (await account.getSetting("showSignature", "accountsShowSignature") && await account.hasSignature()) {
                            processEnabledSetting(event.target, "showSignature");
                            showMessage("Signatures disabled");
                        } else {
                            showLoading();
                            account.fetchSendAs().then(async sendAsData => {
                                if (await account.hasSignature()) {
                                    processEnabledSetting(event.target, "showSignature");
                                    showMessage("Signatures enabled");
                                } else {
                                    niceAlert("No signatures found! Have you created one in your Gmail?") // https://support.google.com/mail/answer/8395
                                }
                            }).catch(error => {
                                niceAlert(error);
                            }).then(() => {
                                hideLoading();
                            });
                        }
                    })();
                } else if (event.target.closest(".conversationView")) {
                    // since we must synchronously return on click we must poll after changes saved in processenable...
                    setTimeout(() => {
                        pollAndLoad({
                            showNotification: false,
                            refresh: true,
                            selectedEmail: getSelectedAccount().getEmail()
                        });
                    }, 200);

                    processEnabledSetting(event.target, "conversationView");
                }

                if (account.getEmail() != getSelectedAccount().getEmail()) {
                    if ($paperItem) {
                        loadAccountsParams.account = account;
                        loadLabels(loadAccountsParams);
                        
                        setTimeout(function() {
                            $paperItem.removeAttribute("focused");
                            $paperItem.blur();
                        }, 1)
                    }
                }
            }
        });

        onDelegate($monitorLabels, "change", ".monitoredLabelCheckbox", async function(event) {
		
            const account = getSelectedAccount();
            
            const $monitorLabelLine = event.target.closest(".monitorLabelLine");
            const labelValue = $monitorLabelLine._labelValue;
            
            if (event.target.checked) {
                const $soundOptions = await generateSoundOptions(account, labelValue);
                const $voiceOptions = await generateVoiceOptions(account, labelValue);
                
                $monitorLabelLine.querySelector(".soundOptionsWrapper").append($soundOptions);
                $monitorLabelLine.querySelector(".voiceOptionsWrapper").append($voiceOptions);
            } else {
                emptyNode($monitorLabelLine.querySelector(".soundOptionsWrapper"));
                emptyNode($monitorLabelLine.querySelector(".voiceOptionsWrapper"));
            }
            
            event.target.closest(".monitorLabelLine").classList.toggle("disabledLine", !event.target.checked);
            
            const values = getEnabledLabels();
            
            var inbox = values.includes(SYSTEM_INBOX);
            var important = values.includes(SYSTEM_IMPORTANT);
            var importantInInbox = values.includes(SYSTEM_IMPORTANT_IN_INBOX);
            var allMail = values.includes(SYSTEM_ALL_MAIL);
            var primary = values.includes(SYSTEM_PRIMARY);
            
            // warn if selecting more than more than one of the major labels
            var duplicateWarning = false;
            if ((inbox || allMail) && (important || importantInInbox || primary)) {
                duplicateWarning = true;
            } else if (important && importantInInbox) {
                duplicateWarning = true;
            }
    
            let hiddenTabUnchecked;
            if ((labelValue == SYSTEM_SOCIAL || labelValue == SYSTEM_PROMOTIONS || labelValue == SYSTEM_UPDATES || labelValue == SYSTEM_FORUMS) && !event.target.checked) {
                hiddenTabUnchecked = true;
            }
            
            if (duplicateWarning) {
                openGenericDialog({
                    title: getMessage("duplicateWarning"),
                    content: getMessage("duplicateLabelWarning")
                });
            } else if ((labelValue == SYSTEM_PRIMARY && event.target.checked) || (labelValue == SYSTEM_INBOX && !event.target.checked && primary) || hiddenTabUnchecked) {
                if (await account.hasHiddenTabs()) {
                    const $dialog = initTemplate("hiddenGmailTabsNoteDialogTemplate");
                    openDialog($dialog).then(response => {
                        if (response == "ok") {
                            chrome.tabs.create({url: "https://jasonsavard.com/wiki/Gmail_tabs?ref=primaryLabelChecked"});
                        }
                    });
                }
            }
    
            if (await storage.get("accountAddingMethod") == "autoDetect" && values.length > 5) {
                const content = new DocumentFragment();
                content.append("1) I recommend monitoring less than 5 labels for faster polling and avoiding lockouts");
                content.append(createBR());
                content.append("2) Consider using the ALL MAIL label instead");
                content.append(createBR());
                content.append("3) Try the add accounts option above");

                openGenericDialog({
                    title: "Too many labels! Here are some solutions:",
                    content: content
                });
            }
            
            if (allMail && values.length >= 2) {
                openGenericDialog({
                    content: "If you select ALL MAIL then you should unselect the other labels or else you will get duplicates!"
                });
            }
    
            try {
                await account.saveSetting("monitorLabel", getEnabledLabels());
                await sendMessageToBG("pollAccounts", {showNotification : true, refresh:true});
                await initAllAccounts();
                accounts.forEach(account => {
                    if (account.error) {
                        throw Error(account.getError().niceError + " - " + account.getError().instructions);
                    }
                });
            } catch (error) {
                showError(error);
            }
        });

        byId("accountsList")._delegatesAttached = true;
    }
}

function loadVoices() {
	console.log("loadVoices");
	if (chrome.tts) {
		chrome.tts.getVoices(function(voices) {
			
			var nativeFound = false;
			const options = [];
			
			for (const voice of voices) {
				if (voice.voiceName == "native") {
					nativeFound = true;
				} else {
					const optionsObj = {label:voice.voiceName, value:voice.voiceName};
					if (voice.extensionId) {
						optionsObj.value += "___" + voice.extensionId;
					}
					options.push(optionsObj);
				}
	      	}
			
			const t = document.querySelector('#t');
			// could only set this .data once and could not use .push on it or it breaks the bind
			
			if (t) {
				t.data = options;
			}
		});
	}
}

async function playSound(soundName) {
	console.log("playsound: " + soundName);
	if (!soundName) {
		soundName = await storage.get("notificationSound");
	}
	byId("playNotificationSound")?.setAttribute("icon", "av:stop");
    playing = true;
    try {
        await sendMessageToBG("playNotificationSound", soundName);
        playing = false;
        byId("playNotificationSound")?.setAttribute("icon", "av:play-arrow");
    } catch (error) {
        console.warn("might have clicked play multiple times", error);
    }
}

function playVoice() {
    byId("playVoice").setAttribute("icon", "av:stop");
    
    chrome.runtime.sendMessage({command: "chromeTTS", text: byId("voiceTestText").value}, response => {
        byId("playVoice").setAttribute("icon", "av:play-arrow");
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            showError(chrome.runtime.lastError.message);
        }
	});
}

function updateVoiceInputCountry() {
	for (var i = voiceInputDialect.options.length - 1; i >= 0; i--) {
		voiceInputDialect.remove(i);
	}
	var list = langs[voiceInputLanguage.selectedIndex];
	for (var i = 1; i < list.length; i++) {
		voiceInputDialect.options.add(new Option(list[i][1], list[i][0]));
	}
	voiceInputDialect.style.visibility = list[1].length == 1 ? 'hidden' : 'visible';
}

async function initVoiceInputOptions() {
	if (await storage.get("voiceInput")) {
		show("#voiceInputOptions");
	} else {
		hide("#voiceInputOptions");
	}
}

function onVoiceInputLanguageChange() {
	storage.set("voiceInputDialect", voiceInputDialect.value);
}

async function resetCustomSounds() {
	var found = false;
	var emailSettings = deepClone(await storage.get("emailSettings"));
	
	if (emailSettings) {	
		try {
			for (const email in emailSettings) {
				for (const label in emailSettings[email].sounds) {
					if (emailSettings[email].sounds[label].includes("custom_")) {
						found = true;
						emailSettings[email].sounds[label] = await storage.get("notificationSound");
					}
				}
			}								
		} catch (e) {
			logError("error with hasCustomSounds: " + e);
		}
	}
	
	if (found) {
		await storage.set("emailSettings", emailSettings);
	}
	
	return found;
}

function openSoundDialog(params) {
    const $notificationSoundInputButton = byId("notificationSoundInputButton");
    $notificationSoundInputButton._params = params;
    $notificationSoundInputButton.click();
}

async function updateCustomIcons() {
	
	async function updateCustomIcon(iconFlagId) {
		var url = await storage.get(iconFlagId);
		if (url) {
            const $icon = byId(iconFlagId);
            $icon.setAttribute("src", url);
            css($icon, {
                width: "19px",
                height: "19px"
            });
		}
	}

	updateCustomIcon("customButtonIconSignedOut");
	updateCustomIcon("customButtonIconNoUnread");
	updateCustomIcon("customButtonIconUnread");
	
	byId("currentBadgeIcon").setAttribute("src", await buttonIcon.generateButtonIconPath());
}

async function addCustomSound(params) {
	var title = params.title;
	
	let customSounds = deepClone(await storage.get("customSounds"));
	customSounds ||= [];

	var existingCustomSoundIndex = -1;
	customSounds.forEach((customSound, index) => {
		if (customSound.name == title) {
			existingCustomSoundIndex = index;
		}
	});

	if (params.overwrite && existingCustomSoundIndex != -1) {
		customSounds[existingCustomSoundIndex] = {name:title, data:params.data};
	} else {
		// look for same filenames if so change the name to make it unique
		if (existingCustomSoundIndex != -1) {
			title += "_" + String(Math.floor(Math.random() * 1000));
		}
		customSounds.push({name:title, data:params.data});
	}

	storage.set("customSounds", customSounds).then(() => {
		playSound("custom_" + title);
		if (params.account) {
			// label specific
			return params.account.saveSettingForLabel("sounds", params.labelValue, "custom_" + title).then(() => {
				selectorAll(".monitorLabelLine").forEach(async el => {
					const labelValue = el._labelValue;
					const soundDropdown = await generateSoundOptions(params.account, labelValue);
					el.querySelector(".soundOptionsWrapper paper-dropdown-menu")?.replaceWith( soundDropdown );
				});
				
			});
		} else {
			// default
			return storage.set("notificationSound", "custom_" + title).then(async () => {
				const soundDropdown = await generateSoundOptions();
				params.$paperMenu.closest("paper-dropdown-menu").replaceWith( soundDropdown );
			});
		}
	}).catch(error => {
		var error = "Error saving file: " + error + " Try a smaller file or another one or click the 'Not working' link.";
		niceAlert(error);
		logError(error);
	});
}

async function initDisplayForAccountAddingMethod() {
	console.log("initDisplayForAccountAddingMethod");

	if (await storage.get("accountAddingMethod") == "autoDetect") {
		document.body.classList.add("autoDetect");
		if (await storage.get("poll") == "realtime") {
			await storage.remove("poll");
		}
	} else {
		document.body.classList.remove("autoDetect");
	}

	const $pollingInterval = selector("#pollingInterval paper-listbox");
	if ($pollingInterval) {
		$pollingInterval.select(await calculatePollingInterval(accounts));
	}
}

async function grantPermissionToEmails(tokenResponse) {
	showLoading();
    userResponsedToPermissionWindow = true;

    if (await storage.get("accountAddingMethod") == "autoDetect") {
        sendMessageToBG("initOauthHybridAccount", {tokenResponse: tokenResponse}).then(() => {
            showMessage(getMessage("done"));
        });
    } else {
        try {
            const response = await sendMessageToBG("addAccountViaOauth", {tokenResponse: tokenResponse});
            await initAllAccounts();
    
            if (response?.syncSignInIdError) {
                niceAlert("Could not determine the sign in order, so assuming " + accounts.length);
            }
    
            // needed timeout because accountsList.bind wound not work when adding account
            setTimeout(() => {
                loadAccountsOptions({ selectedEmail: tokenResponse.userEmail });
            }, 500)
            initDisplayForAccountAddingMethod();
        } catch (error) {
            showError(error);
        } finally {
            hideLoading();
        }
    }
}

async function initOnlyWithCheckerPlusPopupWarning(params) {
    const browserButtonAction = await storage.get("browserButtonAction");
	if (browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS || browserButtonAction == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		show("#checkerPlusButtons");
		show("#emailPreview");
		show("#alwaysDisplayExternalContentWrapper");
	} else {
		hide("#checkerPlusButtons");
		hide("#emailPreview");
		hide("#alwaysDisplayExternalContentWrapper");
	}
}

async function initPopupWindowOptions(value) {
	if (!value) {
		value = await storage.get("browserButtonAction");
	}

	if (value == BROWSER_BUTTON_ACTION_CHECKER_PLUS || value == BROWSER_BUTTON_ACTION_CHECKER_PLUS_POPOUT) {
		show("#popupWindowOptionsForComposeReply");
		show("#checkerPlusBrowserButtonActionIfNoEmail");
		hide("#gmailPopupBrowserButtonActionIfNoEmail");
		show("#clickingCheckerPlusLogo");
		initOnlyWithCheckerPlusPopupWarning({ remove: true })
	} else if (value == BROWSER_BUTTON_ACTION_GMAIL_TAB || value == BROWSER_BUTTON_ACTION_GMAIL_IN_NEW_TAB || value == BROWSER_BUTTON_ACTION_GMAIL_DETACHED || value == BROWSER_BUTTON_ACTION_COMPOSE) {
		hide("#checkerPlusBrowserButtonActionIfNoEmail");
		hide("#gmailPopupBrowserButtonActionIfNoEmail");
		show("#popupWindowOptionsForComposeReply");
		hide("#clickingCheckerPlusLogo");
		initOnlyWithCheckerPlusPopupWarning({ add: true })
	} else {
		hide("#popupWindowOptionsForComposeReply");
		hide("#checkerPlusBrowserButtonActionIfNoEmail");
		show("#gmailPopupBrowserButtonActionIfNoEmail");
		show("#clickingCheckerPlusLogo");
		initOnlyWithCheckerPlusPopupWarning({ add: true })
	}
}

function highlightAddAccount() {
	byId("accountAddingMethod").classList.add("highlight");
	setTimeout(() => {
		byId("accountAddingMethod").classList.remove("highlight");
	}, seconds(3));
}

(async () => {

    await initUI();
    await polymerPromise;
    
    donationClickedFlagForPreventDefaults = await storage.get("donationClicked");
    
    // display grant access host permissions unless the user is already on the accounts page
    if (!location.href.includes("#accounts")) {
        chrome.permissions.contains({origins: [Origins.GMAIL]}, async result => {
            if (!result) {
                const response = await openDialog("hostPermissionsDialogTemplate");
                if (response == "ok") {
                    const granted = await requestGmailHostPermissions();
                    if (granted) {
                        niceAlert(`${getMessage("emailAccounts")}: ${accounts.length}. You can customize their settings in the Accounts tab.`);
                    }
                }
            }
        });
    }
    
    // Must be loaded outside of tab inits because this is used for Notification and Accounts tabs
    addEventListeners("#notificationSoundInputButton", "change", function () {
        var params = this._params;
        var file = this.files[0];
        var fileReader = new FileReader();

        fileReader.onloadend = async function () {

            var customSounds = await storage.get("customSounds");
            if (!customSounds) {
                customSounds = [];
            }

            var soundFilename = file.name.split(".")[0];

            params.title = soundFilename;
            params.data = this.result;
            addCustomSound(params);
        }

        fileReader.onabort = fileReader.onerror = function (e) {
            niceAlert("Problem loading file");
        }

        console.log("file", file)
        fileReader.readAsDataURL(file);
    });

    onClick("#mainTabs paper-tab", function(e) {
        const tabName = this.getAttribute("value");
        showOptionsSection(tabName);
    });

    if (justInstalled || (!await storage.get("_optionsOpened") && gtVersion(await storage.get("installVersion"), "22.1"))) {
        storage.setDate("_optionsOpened");
        showOptionsSection("welcome");
        
        if (justInstalled) {
            const newUrl = setUrlParam(location.href, "action", null);
            history.replaceState({}, 'Install complete', newUrl);
        }
                
        if (DetectClient.isOpera()) {
            if (!window.Notification) {
                niceAlert("Desktop notifications are not yet supported in this browser!");				
            }
            if (window.chrome && !window.chrome.tts) {
                niceAlert("Voice notifications are not yet supported in this browser!");				
            }

            openGenericDialog({
                title: "You are not using the stable channel of Chrome!",
                content:"Bugs might occur, you can use this extension, however, for obvious reasons, these bugs and reviews will be ignored unless you can replicate them on stable channel of Chrome.",
                cancelLabel:getMessage("moreInfo")
            }).then(response => {
                if (response != "ok") {
                    openUrl("https://jasonsavard.com/wiki/Unstable_browser_channel");
                }
            });
        }
        
        // check for sync data
        syncOptions.fetch().then(function(items) {
            console.log("fetch response", items);

            const content = new DocumentFragment();
            content.append("Would you like to use your previous extension options? ");

            const $note = document.createElement("div");
            $note.style.cssText = "margin-top:4px;font-size:12px;color:gray";
            $note.textContent = "(If you had previous issues you should do this later)";
            content.append($note);

            openGenericDialog({
                title: "Restore settings",
                content: content,
                showCancel: true
            }).then(function(response) {
                if (response == "ok") {
                    syncOptions.load(items).then(function(items) {
                        resetCustomSounds();
                        
                        openGenericDialog({
                            title: "Options restored!",
                            okLabel: "Restart extension"
                        }).then(response => {
                            reloadExtension();
                        });
                    });
                }
            });
        }).catch(error => {
            console.warn("error fetching: ", error);
        });

    } else {
        initSelectedTab();
    }
    
    window.onpopstate = function(event) {
        console.log(event);
        initSelectedTab();
    }
    
    window.addEventListener("focus", function(event) {
        console.log("window.focus");
        // reload voices
        loadVoices();
    });
    
    addEventListeners("#logo", "dblclick", async function() {
        if (await storage.get("donationClicked")) {
            await storage.remove("donationClicked");
        } else {
            await storage.set("donationClicked", true)
        }
        location.reload(true);
    });
    
    byId("version").textContent = `v.${chrome.runtime.getManifest().version}`;
    onClick("#version", function() {
        showLoading();
        if (chrome.runtime.requestUpdateCheck) {
            chrome.runtime.requestUpdateCheck(function(status, details) {
                hideLoading();
                console.log("updatechec:", details)
                if (status == "no_update") {
                    openGenericDialog({title:getMessage("noUpdates"), otherLabel:getMessage("moreInfo")}).then(function(response) {
                        if (response == "other") {
                            location.href = "https://jasonsavard.com/wiki/Extension_Updates";
                        }
                    })
                } else if (status == "throttled") {
                    openGenericDialog({title:"Throttled, try again later!"});
                } else {
                    openGenericDialog({title:"Response: " + status + " new version " + details.version});
                }
            });
        } else {
            location.href = "https://jasonsavard.com/wiki/Extension_Updates";
        }
    });

    onClick("#changelog", function(event) {
        openChangelog("GmailOptions");
        event.preventDefault();
        event.stopPropagation();
    });

    // detect x
    addEventListeners("#search", "search", function(e) {
        if (!this.value) {
            selectorAll("*").forEach(el => el.classList.remove("search-result"));
        }
    });

    function highlightTab(node) {
        console.log("node", node);
        let page;
        if (node.closest) {
            page = node.closest(".page");
        } else {
            page = node.parentElement.closest(".page");
        }
        
        if (page) {
            const tabName = page.getAttribute("value");
            // :not(.iron-selected)
            selector(`paper-tab[value='${tabName}']`).classList.add("search-result");
        }
    }

    function highlightPriorityNode(highlightNode) {
        return [
            "paper-dropdown-menu",
            "paper-button",
            "paper-checkbox",
            "select"
        ].some(priorityNodeName => {
            const $priorityNode = highlightNode.closest(priorityNodeName);
            if ($priorityNode) {
                $priorityNode.classList.add("search-result");
                return true;
            }
        });
    }

    async function search(search) {
        if (!window.initTabsForSearch) {
            await asyncForEach(document.querySelectorAll("paper-tab"), async (tab) => {
                await initPage(tab.getAttribute("value"));
            });
            window.initTabsForSearch = true;
        }

        selectorAll("*").forEach(el => el.classList.remove("search-result"));
        if (search.length >= 2) {
            search = search.toLowerCase();
            var elms = document.getElementsByTagName("*"),
            len = elms.length;
            for(var ii = 0; ii < len; ii++) {

                let label = elms[ii].getAttribute("label");
                if (label && label.toLowerCase().includes(search)) {
                    elms[ii].classList.add("search-result");
                    highlightTab(elms[ii]);
                }

                var myChildred = elms[ii].childNodes;
                const len2 = myChildred.length;
                for (var jj = 0; jj < len2; jj++) {
                    if (myChildred[jj].nodeType === 3) {
                        if (myChildred[jj].nodeValue.toLowerCase().includes(search)) {
                            let highlightNode = myChildred[jj].parentNode;
                            if (highlightNode.nodeName != "STYLE") {
                                let foundPriorityNode = highlightPriorityNode(highlightNode);
                                if (!foundPriorityNode) {
                                    const $priorityNode = highlightNode.closest("paper-tooltip");
                                    if ($priorityNode) {
                                        foundPriorityNode = highlightPriorityNode($priorityNode.target);
                                        if (!foundPriorityNode) {
                                            $priorityNode.target.classList.add("search-result");
                                        }
                                    } else {
                                        highlightNode.classList.add("search-result");
                                    }
                                }

                                console.log("highlightNode", highlightNode);
                                
                                highlightTab(myChildred[jj]);
                            }
                        }
                    }
                }
            }
        }
    }
    
    addEventListeners("#search", "keyup", function(e) {
        const searchValue = this.value;
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            search(searchValue);
        }, window.initTabsForSearch ? 0 : 300);

        clearTimeout(window.analyticsTimeout);
        window.analyticsTimeout = setTimeout(async () => {
            while (!window.initTabsForSearch) {
                await sleep(200);
            }
            if (searchValue) {
                sendGA("optionsSearch", searchValue);
                if (!selector(".search-result")) {
                    openGenericDialog({
                        title: "No results found in options",
                        showCancel: true,
                        okLabel: "Search FAQ & Forum"
                    }).then(response => {
                        if (response == "ok") {
                            window.open("https://jasonsavard.com/search?q=" + encodeURIComponent(searchValue), "emptyWindow");
                        }
                    });
                }
            }
        }, 1000);
    });
    
    setTimeout(function() {
        document.body.removeAttribute("jason-unresolved");
        document.body.classList.add("explode");
    }, 200)
})();