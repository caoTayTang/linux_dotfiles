// chrome.storage.sync.clear()
var usage = 0
var capReached = false
var usageValue = 3
var vBtf = 0.5
var index

chrome.runtime.setUninstallURL(`https://useblackbox.io/uninstall`)

var notificationData = {
	title: "Text Copied!",
	subtitle: "You can paste (ctrl or cmd + V)",
	body: "Save to History",
	url: "https://useblackbox.io/history"
}
var startDate
chrome.storage.sync.get((config) => {
	if (!config.method) {
		chrome.storage.sync.set({ method: "crop" })
	}
	if (!config.format) {
		chrome.storage.sync.set({ format: "jpeg" })
	}
	if (!config.save) {
		chrome.storage.sync.set({ save: "file" })
	}
	if (config.dpr === undefined) {
		chrome.storage.sync.set({ dpr: true })
	}
	// v1.9 -> v2.0
	if (config.save === "clipboard") {
		config.save = "url"
		chrome.storage.sync.set({ save: "url" })
	}
})

function inject(tab) {
	chrome.tabs.sendMessage(tab.id, { message: "init" }, (res) => {
		if (res) {
			clearTimeout(timeout)
		}
	})

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, { message: "init" })
		}, 100)
	}, 100)
}

function injectPlay(tab, time, query, text) {
	chrome.tabs.sendMessage(
		tab.id,
		{ message: "play", time: time, query: query, text: text },
		(res) => {
			if (res) {
				clearTimeout(timeout)
			}
		}
	)

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				message: "play",
				time: time,
				query: query,
				text: text
			})
		}, 100)
	}, 100)
}

function injectQ(tab, time) {
	chrome.tabs.sendMessage(
		tab.id,
		{ message: "searchq", time: time },
		(res) => {
			if (res) {
				clearTimeout(timeout)
			}
		}
	)

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				message: "searchq",
				time: time
			})
		}, 100)
	}, 100)
}

function injectProcessing(tab, status) {
	chrome.tabs.sendMessage(
		tab.id,
		{ message: "processing", status: status },
		(res) => {
			if (res) {
				clearTimeout(timeout)
			}
		}
	)

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				message: "processing",
				status: status
			})
		}, 100)
	}, 100)
}

function injectNotification(tab, data) {
	chrome.tabs.sendMessage(
		tab.id,
		{ message: "notification", data: data },
		(res) => {
			if (res) {
				clearTimeout(timeout)
			}
		}
	)

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				message: "notification",
				data: data
			})
		}, 100)
	}, 100)
}

function injectCopied(tab) {
	chrome.tabs.sendMessage(
		tab.id,
		{
			message: "copied",
			userId: userId,
			notificationData: notificationData
		},
		(res) => {
			if (res) {
				clearTimeout(timeout)
			}
		}
	)

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, {
				message: "copied",
				userId: userId
			})
		}, 100)
	}, 100)
}

function injectAC(tab) {
	chrome.tabs.sendMessage(tab.id, { message: "autocomplete" }, (res) => {
		if (res) {
			clearTimeout(timeout)
		}
	})

	var timeout = setTimeout(() => {
		chrome.tabs.insertCSS(tab.id, {
			file: "vendor/jquery.Jcrop.min.css",
			runAt: "document_start"
		})
		chrome.tabs.insertCSS(tab.id, {
			file: "css/content.css",
			runAt: "document_start"
		})

		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "vendor/jquery.Jcrop.min.js",
			runAt: "document_start"
		})
		chrome.tabs.executeScript(tab.id, {
			file: "content/content.js",
			runAt: "document_start"
		})

		setTimeout(() => {
			chrome.tabs.sendMessage(tab.id, { message: "autocomplete" })
		}, 100)
	}, 100)
}

//Login
let site = "https://useblackbox.io/"
var userId = ""
function generateUUID() {
	var d = new Date().getTime(); //Timestamp
	if(typeof performance!== 'undefined' && typeof performance.now === 'function'){
		d += performance.now(); //use high-precision timer if available
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c == 'x'? r : (r & 0x3 | 0x8)).toString(16);
	});

}

//Install Redirect
function redirectToLogin() {
	chrome.tabs.create({ url: site + "signin" })
}
chrome.runtime.onInstalled.addListener((details) => {
	chrome.storage.sync.get(["userId"], function (items) {
		if (Object.keys(items).length === 0) {
			fetch(site + "isLoggedIn").then(function (response) {
				response.json().then(function (data) {
					if (data.code == 50) {
						chrome.tabs.create({ url: site + "signup" })
					} else {
						userId = data.userId
						chrome.storage.sync.set({ userId: userId })
					}
				})
			})
		} else {
			userId = items.userId
		}
	})
})

function loginUser() {
	chrome.storage.sync.get(["userId"], function (items) {
		if (Object.keys(items).length === 0) {
			fetch(site + "isLoggedIn").then(function (response) {
				response.json().then(function (data) {
					if (data.code == 50) {
						redirectToLogin()
					} else {
						userId = data.userId
						chrome.storage.sync.set({ userId: userId })
					}
				})
			})
		} else {
			userId = items.userId
		}
	})
}

function capReach() {
	chrome.storage.sync.get(function (items) {
		var uid = items.userId
		if (items.usage) {
			fetch(site + `isCapped/${uid}/${items.usage}`).then(function (
				response
			) {
				response.json().then(function (data) {
					processingSite = data.processingSite
					if (data.message == "showcap") {
						// notificationData.body = 'Upgrade'
						// notificationData.url = 'https://www.useblackbox.io/upgrade'

						if (data.userStatus) {
							if (data.userStatus == "top") {
								resetDailyUsage()
								var capNumber = 9
								if (data.capUsage) {
									capNumber = data.capUsage
								}
								if (items.usage > capNumber) {
									capReached = true
									// notificationData.title = '0 Credits Left. You Reached Your Free Limit'
									// notificationData.subtitle = `Upgrade to Unlock Premium Features`
								}
							}
						}
						chrome.storage.sync.set({ isPremium: false })
						chrome.storage.sync.set({ usage: items.usage + 1 })
						chrome.tabs.getSelected(null, (tab) => {
							//clear the crosshair
							// inject(tab)
							if (data.userStatus) {
								if (data.userStatus == "top") {
									chrome.tabs.create({ url: data.url })
								} else {
									if (items.viewedCap == undefined) {
										chrome.tabs.create({ url: data.url })
										chrome.storage.sync.set({
											viewedCap: true
										})
									}
								}
							}
						})
					} else {
						//Paid User
						// notificationData.title = 'Text Copied!'
						// notificationData.subtitle = `You can paste anywhere (ctrl or cmd + V)`
						// notificationData.body = 'Go To Website'
						// notificationData.url = 'https://www.useblackbox.io/'
						capReached = false
						chrome.storage.sync.set({ isPremium: true })
					}
				})
			})
		} else {
			fetch(site + `isCapped/${uid}/0`).then(function (response) {
				response.json().then(function (data) {
					processingSite = data.processingSite
					if (data.message == "showcap") {
						notificationData.body = "Upgrade"
						notificationData.url =
							"https://www.useblackbox.io/upgrade"
						console.log("notificationData, ", notificationData)

						resetDailyUsage()
						if (items.usage > 9) {
							capReached = true
						}
						chrome.storage.sync.set({ isPremium: false })
						chrome.tabs.getSelected(null, (tab) => {
							//clear the crosshair
							chrome.tabs.create({ url: data.url })
							// inject(tab)
						})
					} else {
						//Paid User
						// notificationData.body = 'Go To Website'
						// notificationData.url = 'https://www.useblackbox.io/'
						capReached = false
						chrome.storage.sync.set({ isPremium: true })
					}
				})
			})
		}
	})
}

var startDateCap = new Date()
function resetDailyUsage() {
	chrome.storage.sync.get(function (items) {
		if (items.usage == 5) {
			startDateCap = new Date()
		} else if (items.usage > 9) {
			var endDateCap = new Date()
			var secondsCap =
				(endDateCap.getTime() - startDateCap.getTime()) / 1000
			if (secondsCap > 86400 * 30) {
				chrome.storage.sync.set({ usage: 0 })
				capReached = false
			}
		}
	})
}
setInterval(function () {
	resetDailyUsage()
}, 5000)

chrome.browserAction.onClicked.addListener((tab) => {
	capReach()
	if (userId == "") {
		loginUser()
		if (capReached == false) {
			inject(tab)
		}
	} else {
		if (capReached == false) {
			inject(tab)
		}
	}
})

var tabsave
var videoId
var currentTab = ""
var tabprocessing
var videosList = {}

chrome.commands.onCommand.addListener((command) => {
	if (command === "take-screenshot") {
		loginUser()
		capReach()

		chrome.tabs.getSelected(null, (tab) => {
			if (capReached == false) {
				inject(tab)
			}
		})
	} else if (command === "process-video") {
		var uId
		chrome.storage.sync.get(["userId"], function (items) {
			if (items.userId == undefined) {
				redirectToLogin()
			} else {
				uId = items.userId

				var myHeaders = new Headers()
				myHeaders.append("Content-Type", "application/json")
				var raw = JSON.stringify({ userId: uId })

				var requestOptions = {
					method: "POST",
					headers: myHeaders,
					body: raw,
					redirect: "follow"
				}

				fetch("https://useblackbox.io/hasSearch", requestOptions)
					.then((response) => response.text())
					.then((result) => {
						if (JSON.parse(result).status == true) {
							chrome.tabs.query(
								{ currentWindow: true, active: true },
								function (tabs) {
									tabprocessing = tabs[0]
									injectProcessing(
										tabprocessing,
										"Video is processing"
									)
									currentTab = tabs[0].url
									videoId = getYoutubeId(tabs[0].url)
									processingvideo(videoId)
									tabsave = tabs[0]
								}
							)
						}
					})
					.catch((error) => console.log("error", error))
			}
		})
	} else if (command === "process-visual") {
		var uId
		chrome.storage.sync.get(["userId"], function (items) {
			if (items.userId == undefined) {
				redirectToLogin()
			} else {
				uId = items.userId

				var myHeaders = new Headers()
				myHeaders.append("Content-Type", "application/json")
				var raw = JSON.stringify({ userId: uId })

				var requestOptions = {
					method: "POST",
					headers: myHeaders,
					body: raw,
					redirect: "follow"
				}

				fetch("https://useblackbox.io/hasSearch", requestOptions)
					.then((response) => response.text())
					.then((result) => {
						if (JSON.parse(result).status == true) {
							chrome.tabs.query(
								{ currentWindow: true, active: true },
								function (tabs) {
									videoId = getYoutubeId(tabs[0].url)
									processVisual(videoId) //visual processing trigger
								}
							)
						}
					})
					.catch((error) => console.log("error", error))
			}
		})
	} else if (command === "search") {
		var uId
		chrome.storage.sync.get(["userId"], function (items) {
			if (items.userId == undefined) {
				redirectToLogin()
			} else {
				uId = items.userId

				var myHeaders = new Headers()
				myHeaders.append("Content-Type", "application/json")
				var raw = JSON.stringify({ userId: uId })

				var requestOptions = {
					method: "POST",
					headers: myHeaders,
					body: raw,
					redirect: "follow"
				}

				fetch("https://useblackbox.io/hasSearch", requestOptions)
					.then((response) => response.text())
					.then((result) => {
						if (JSON.parse(result).status == true) {
							chrome.tabs.query(
								{ currentWindow: true, active: true },
								function (tabs) {
									chrome.tabs.sendMessage(tabs[0].id, {
										message: "search"
									})
								}
							)
						}
					})
			}
		})
	} else if (command == "autocomplete") {
		console.log("auto-complete")
		chrome.tabs.query(
			{ currentWindow: true, active: true },
			function (tabs) {
				injectAC(tabs[0])
			}
		)
	}
})

var freeCap = 30
const copyToClipboard = (str) => {
	const el = document.createElement("textarea")
	el.value = str
	document.body.appendChild(el)
	el.select()
	document.execCommand("copy")
	document.body.removeChild(el)
	chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
		injectCopied(tabs[0])
	})
	var endDate = new Date()
	var seconds = (endDate.getTime() - startDate.getTime()) / 1000
	usage += 1
	// chrome.storage.sync.set({ usage: userId })
	chrome.storage.sync.get(function (items) {
		if (items.usage) {
			chrome.storage.sync.set({ usage: items.usage + 1 })
		} else {
			chrome.storage.sync.set({ usage: 1 })
		}
	})
}

var processingSite = "https://www.blackboxapp.co"
async function getData(url) {
	startDate = new Date()
	var res = await fetch(url)
	var buff = await res.arrayBuffer()
	// clone so we can rename, and put into array for easy proccessing
	var file = [
		new File([buff], `${userId}.jpg`, {
			type: "image/jpeg"
		})
	]
	f = file

	//=============================================Start Sending To Request
	var formdata = new FormData()
	formdata.append("photo", file[0], `${userId}.jpg`)
	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}
	fetch(`${processingSite}/getsingleimage`, requestOptions)
		.then((response) => response.text())
		.then((result) => {
			if (result.length == 7 && samesend < 10) {
				samesend += 1
				getData(url)
			} else {
				if (JSON.parse(result).userId == userId) {
					resultArr = JSON.parse(result).text
					var cleanText = resultArr
						.split("\n")
						.slice(0, resultArr.split("\n").length)
						.join("\n")
					cleanText = cleanText.split("%3D").join("")
					copyToClipboard(cleanText)
				}
			}
		})
		.catch((error) => console.log("error", error))
}

function getYoutubeId(url) {
	if (url != null) {
		var regExp =
			/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
		var match = url.match(regExp)
		if (match && match[2].length == 11) {
			return match[2]
		} else {
			url = url.split("/")[url.split("/").length - 1]
			return url
		}
	}
}

var featureSet = 1
async function processingvideo(videoId) {
	var formdata = new FormData()
	formdata.append("passBackVideoId", videoId)
	formdata.append("feature", featureSet)

	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}

	fetch("https://blackboxapp.co/processingytvideo", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			var resultv = JSON.parse(result)
			if (resultv.message == "Video Processed") {
				injectProcessing(tabprocessing, "Video Processed")
			} else {
				if (resultv.message == "video can't be processed") {
					injectProcessing(tabprocessing, resultv.message)
				} else if (resultv.message == "video processing complete") {
					injectProcessing(tabprocessing, resultv.message)
				}
			}
			if (resultv.index) {
				index = resultv.index
			}
		})
		.catch((error) => console.log("error", error))
}

var resultArr
async function processvideo(videoId, search) {
	var formdata = new FormData()
	formdata.append("passBackVideoIdGlobal", videoId)
	formdata.append("passBackTextBoxSearch", search)
	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}
	fetch("https://blackboxapp.co/videoquery", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			resultArr = JSON.parse(result)
			chrome.tabs.query(
				{ currentWindow: true, active: true },
				function (tabs) {
					if (resultArr.length != 0) {
						injectPlay(
							tabs[0],
							resultArr[0].join(";"),
							search,
							resultArr[1].join(";")
						)
					} else {
						injectPlay(tabs[0], "", search, "")
					}
				}
			)
		})
		.catch((error) => console.log("error", error))
}

async function processvideoVisual(videoId, search) {
	var formdata = new FormData()
	formdata.append("videoId", videoId)
	formdata.append("query", search)
	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}
	fetch("http://34.66.142.207/videovisualquery", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			resultArr = JSON.parse(result)
			chrome.tabs.query(
				{ currentWindow: true, active: true },
				function (tabs) {
					if (resultArr.length != 0) {
						injectPlay(
							tabs[0],
							resultArr[0].join(";"),
							search,
							resultArr[1].join(";")
						)
					} else {
						injectPlay(tabs[0], "", search, "")
					}
				}
			)
		})
		.catch((error) => console.log("error", error))
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.status === "complete")
		chrome.tabs.sendMessage(tabId, { message: "TabUpdated" })
})

var samesend = 0
chrome.runtime.onMessage.addListener(async (req, sender, res) => {
	if (req.message === "capture") {
		chrome.storage.sync.get((config) => {
			chrome.tabs.getSelected(null, (tab) => {
				chrome.tabs.captureVisibleTab(
					tab.windowId,
					{ format: config.format },
					(image) => {
						// image is base64

						if (config.method === "view") {
							if (req.dpr !== 1 && !config.dpr) {
								crop(
									image,
									req.area,
									req.dpr,
									config.dpr,
									config.format,
									(cropped) => {
										res({
											message: "image",
											image: cropped
										})
									}
								)
							} else {
								res({ message: "image", image: image })
							}
						} else {
							crop(
								image,
								req.area,
								req.dpr,
								config.dpr,
								config.format,
								(cropped) => {
									samesend = 0
									getData(cropped)
									res({ message: "image", image: cropped })
								}
							)
						}
					}
				)
			})
		})
	} else if (req.message === "active") {
		if (req.active) {
			chrome.storage.sync.get((config) => {
				if (config.method === "view") {
					chrome.browserAction.setTitle({
						tabId: sender.tab.id,
						title: "Capture Viewport"
					})
					chrome.browserAction.setBadgeText({
						tabId: sender.tab.id,
						text: "⬒"
					})
				}
				// else if (config.method === 'full') {
				//   chrome.browserAction.setTitle({tabId: sender.tab.id, title: 'Capture Document'})
				//   chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: '⬛'})
				// }
				else if (config.method === "crop") {
					chrome.browserAction.setTitle({
						tabId: sender.tab.id,
						title: "Crop and Save"
					})
					chrome.browserAction.setBadgeText({
						tabId: sender.tab.id,
						text: "◩"
					})
				} else if (config.method === "wait") {
					chrome.browserAction.setTitle({
						tabId: sender.tab.id,
						title: "Crop and Wait"
					})
					chrome.browserAction.setBadgeText({
						tabId: sender.tab.id,
						text: "◪"
					})
				}
			})
		} else {
			chrome.browserAction.setTitle({
				tabId: sender.tab.id,
				title: "Copy Text from Videos"
			})
			chrome.browserAction.setBadgeText({
				tabId: sender.tab.id,
				text: ""
			})
		}
	} else if (req.message === "userSearched") {
		var idvideo = getYoutubeId(req.url)
		processvideo(idvideo, req.searchText)
	} else if (req.message === "userSearchedVisual") {
		var idvideo = getYoutubeId(req.url)
		processvideoVisual(idvideo, req.searchText)
	} else if (req.message === "notificationEngaged") {
		var formdata = new FormData()
		var requestOptions = {
			method: "POST",
			body: formdata,
			redirect: "follow"
		}

		fetch("https://useblackbox.io/notificationEngaged", requestOptions)
			.then((response) => response.text())
			.then((result) => console.log(result))
			.catch((error) => console.log("error", error))
	} else if (req.message === "search-web") {
		chrome.tabs.query(
			{ currentWindow: true, active: true },
			function (tabs) {
				var link = tabs[0].url
				fullText = req.fullText
				var myHeaders = new Headers()
				myHeaders.append("Content-Type", "application/json")
				var raw = JSON.stringify({
					question: req.data,
					fullText: req.fullText
				})

				var requestOptions = {
					method: "POST",
					headers: myHeaders,
					body: raw,
					redirect: "follow"
				}
				query = req.data //
				allAnswers = ""
				processTimed(fullText, query)
			}
		)
	} else if (req.message === "getvideoimg") {
		var formdata = new FormData()
		var data = req.data
		var imgName = req.imgName
		processFrame(data, imgName)
	} else if (req.message === "getvideoimglocal") {
		//getvideoimg request for local files
		chrome.tabs.captureVisibleTab({ format: "jpeg" }, (src) => {
			var imgName = req.imgName
			processFrameLocal(src, imgName)
		})
	} else if (req.message === "textInput") {
		console.log("textInput: ", req.textInput)
		chrome.storage.sync.get(["userId"], function (items) {
			if (items.userId) {
				autocomplete(items.userId, req.textInput)
			}
		})
	} else if (req.message === "getAutoComplete") {
		var textInput = req.text
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")

		var raw = JSON.stringify({
			userId: "",
			textInput: textInput,
			source: "chrome extension"
		})

		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}

		fetch("https://www.useblackbox.io/autocomplete", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				var answer = JSON.parse(result).response

				const el = document.createElement("textarea")
				el.value = answer
				document.body.appendChild(el)
				el.select()
				document.execCommand("copy")
				document.body.removeChild(el)

				chrome.tabs.query(
					{ currentWindow: true, active: true },
					function (tabs) {
						// chrome.tabs.sendMessage(tabs[0].id, {
						// 	message: "showAnswerToaster",
						// 	data: answer
						// })

						//colab element
						chrome.tabs.sendMessage(tabs[0].id, {
							message: "canPaste"
						})
					}
				)
			})
			.catch((error) => console.log("error", error))
	} else if (req.message === "enableSuggestions") {
		if (!userId) {
			loginUser()
		} else {
			enableUser(userId)
			chrome.storage.sync.set({ suggestionsEnabled: true })
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0]
				chrome.tabs.sendMessage(activeTab.id, {
					message: "setSuggestionStatus",
					data: true
				})
			})
		}
	} else if (req.message === "disableSuggestions") {
		chrome.storage.sync.set({ suggestionsEnabled: false })
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const activeTab = tabs[0]
			chrome.tabs.sendMessage(activeTab.id, {
				message: "setSuggestionStatus",
				data: false
			})
		})
	} else if (req.message === "otherResults") {
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")
		var raw = JSON.stringify({ url: req.url })
		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}

		fetch("https://www.useblackbox.io/otherResults", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					const activeTab = tabs[0]
					chrome.tabs.sendMessage(activeTab.id, {
						message: "otherResult",
						result,
						url: req.url
					})
				})
			})
	} else if (req.message === "getAnswer") {
		getAnswer(req)
	} else if (req.message === "initChat") { 
		chrome.tabs.insertCSS(sender.tab.id, {
			file: "css/code-autocomplete.css",
			runAt: "document_start"
		})
	} else if (req.message == 'perference'){
		let pref_status = ''
		if (req.prefStatus) pref_status = req.prefStatus
		selectionFct('Chrome Preference '+pref_status)
	}

	if (req.source === "getQuery") {
		chrome.storage.sync.get(async function (items) {
			let inputText = req.payload.data
			let answer = await searchFct(inputText, items.userId)
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0]
				chrome.tabs.sendMessage(activeTab.id, {
					message: "return",
					value: answer.response,
					inputText,
					allResults: answer.allResults
				})
			})
		})
	}
	if (req.source === "getSuggestion") {
		chrome.storage.sync.get(async function (items) {
			let inputText = req.payload.data
			let answer = await suggestionFct(
				inputText,
				items.userId,
				req.payload.language
			)
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0]
				chrome.tabs.sendMessage(activeTab.id, {
					message: "returnSuggestion",
					value: answer,
					cursorPos: req.payload.cursorPos
				})
			})
		})
	}

	return true
})

async function getAnswer(data) {
	const { textInput, allMessages, stream, clickedContinue, max_iterations, iterations, completed, id } = data
	
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")

	if (userId == ''){
		chrome.storage.sync.get(function (items) {
			if (items.userId) {
				userId = items.userId;
			}else{
				if (items.installUserId){
					userId = items.installUserId
				}else{
					userId = generateUUID()
					chrome.storage.sync.set({ installUserId: userId })
				}
			}
			var raw = JSON.stringify({ textInput, allMessages, stream, clickedContinue, userId, source: "chrome extension" })

			var requestOptions = {
				method: "POST",
				headers: myHeaders,
				body: raw,
				redirect: "follow"
			}

			fetch("https://useblackbox.io/chat-request-v4", requestOptions)
				.then((response) => response.text())
				.then((result) => {
					chrome.tabs.query(
						{ currentWindow: true, active: true },
						function (tabs) {
							chrome.tabs.sendMessage(tabs[0].id, {
								message: "showAnswer",
								data: {result,max_iterations,
									iterations,
									completed,
									id}
							})
						}
					)
				})
		})
	}else{
		var raw = JSON.stringify({ textInput, allMessages, stream, clickedContinue, userId, source: "chrome extension" })

		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}

		fetch("https://useblackbox.io/chat-request-v4", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				chrome.tabs.query(
					{ currentWindow: true, active: true },
					function (tabs) {
						chrome.tabs.sendMessage(tabs[0].id, {
							message: "showAnswer",
							data: {result,max_iterations,
								iterations,
								completed,
								id}
						})
					}
				)
			})
	}
}

function crop(image, area, dpr, preserve, format, done) {
	var top = area.y * dpr
	var left = area.x * dpr
	var width = area.w * dpr
	var height = area.h * dpr
	var w = dpr !== 1 && preserve ? width : area.w
	var h = dpr !== 1 && preserve ? height : area.h

	var canvas = null
	if (!canvas) {
		canvas = document.createElement("canvas")
		document.body.appendChild(canvas)
	}
	canvas.width = w
	canvas.height = h

	var img = new Image()
	img.onload = () => {
		var context = canvas.getContext("2d")
		context.drawImage(img, left, top, width, height, 0, 0, w, h)

		var cropped = canvas.toDataURL(`image/${format}`)
		done(cropped)
	}
	img.src = image
}

function upgradeUser() {
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")

	chrome.storage.sync.get(["userId"], function (items) {
		if (items.userId) {
			var raw = JSON.stringify({ userId: items.userId })

			var requestOptions = {
				method: "POST",
				headers: myHeaders,
				body: raw,
				redirect: "follow"
			}

			fetch("https://useblackbox.io/upgradeUser", requestOptions)
				.then((response) => response.text())
				.then((result) => {
					if (JSON.parse(result).status == "success") {
						window.open(JSON.parse(result).url)
					}
				})
		} else {
			loginUser()
		}
	})
}
function usageVal() {
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")
	var requestOptions = {
		method: "POST",
		headers: myHeaders,
		redirect: "follow"
	}
	fetch("https://useblackbox.io/usageValue", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			usageValue = JSON.parse(result).value
			if (JSON.parse(result).time != undefined) {
				vBtf = JSON.parse(result).time
			}
		})
}
// usageVal()

function processTimed(text, query) {
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")

	var raw = JSON.stringify({
		fullText: text,
		query: query
	})

	var requestOptions = {
		method: "POST",
		headers: myHeaders,
		body: raw,
		redirect: "follow"
	}

	fetch("https://blackboxapp.co/documentquery", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			allAnswers = JSON.parse(result).join(";")

			chrome.tabs.query(
				{ currentWindow: true, active: true },
				function (tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {
						message: "show-search-results",
						data: allAnswers,
						filter: ""
					})
				}
			)
		})
		.catch((error) => console.log("error", error))
}

var sent = false
function processVideoQA(videoId, query, index) {
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")

	var raw = JSON.stringify({
		passBackVideoIdGlobal: videoId,
		passBackTextBoxSearch: query,
		index: index
	})

	var requestOptions = {
		method: "POST",
		headers: myHeaders,
		body: raw,
		redirect: "follow"
	}
	if (query.includes("?")) {
		fetch("https://blackboxapp.co/videoqa", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				if (JSON.parse(result)[0].length != 0) {
					var resultArr = JSON.parse(result)
					chrome.tabs.query(
						{ currentWindow: true, active: true },
						function (tabs) {
							injectQ(tabs[0], resultArr[0].join(";"))
						}
					)
				}
			})
			.catch((error) => console.log("error", error))
	}
}

function batchVideoSend(videoId, query) {
	// var totalIter = Math.round(fullText.split(' ').length/100)
	var totalIter = index
	sent = false
	for (var i = 0; i < totalIter; i++) {
		processVideoQA(videoId, query, i)
	}
}

function notifcationValue() {
	var requestOptions = {
		method: "GET",
		redirect: "follow"
	}

	fetch("https://useblackbox.io/notificationValue", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			var status = JSON.parse(result).status
			if (status == true) {
				result = JSON.parse(result).notification
				notificationData = result
				notificationData.subtitle = "You can paste (ctrl or cmd + V)"
			}
		})
		.catch((error) => console.log("error", error))
}
notifcationValue()

function processVisual(videoId) {
	var formdata = new FormData()
	formdata.append("videoId", videoId)

	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}

	fetch("http://34.66.142.207/processingytvisual", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			result = JSON.parse(result).status
			var status = ""
			if (result == "fail") {
				status = "Visual Processing Started "
			} else {
				status = "Visual Processing Complete"
			}
			chrome.tabs.query(
				{ currentWindow: true, active: true },
				function (tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {
						message: "startVisual",
						status: status
					})
				}
			)
		})
		.catch((error) => console.log("error", error))
}

async function processFrame(data, imgName) {
	//create the jpg
	r = await fetch(data)
	s = await r.arrayBuffer()
	d = [
		new File([s], `test.jpg`, {
			type: "image/jpeg"
		})
	]
	var formdata = new FormData()
	formdata.append("photo", d[0], imgName)

	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}

	//http://34.66.142.207
	fetch("http://34.66.142.207/getvideoimg", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			//check if last image received includes time = -1
			if (imgName.includes("-1.jpg") == false) {
				//not complete yet
				chrome.tabs.query(
					{ currentWindow: true, active: true },
					function (tabs) {
						if (tabs[0].url) {
							if (
								tabs[0].url.includes("youtube") ||
								tabs[0].url.includes("coursera")
							) {
								chrome.tabs.sendMessage(tabs[0].id, {
									message: "processingVisual"
								})
							} else {
								var processingTab
								chrome.tabs.query({}, function (tabs) {
									var allTabs = tabs
									for (var k = 0; k < allTabs.length; k++) {
										if (allTabs[k].url) {
											if (
												allTabs[k].url.includes(
													"youtube"
												) ||
												allTabs[k].url.includes(
													"cousera"
												)
											) {
												processingTab = allTabs[k]
												chrome.tabs.sendMessage(
													processingTab.id,
													{
														message:
															"processingVisual"
													}
												)
											}
										}
									}
								})
							}
						} else {
							var processingTab
							chrome.tabs.query({}, function (tabs) {
								var allTabs = tabs
								for (var k = 0; k < allTabs.length; k++) {
									if (allTabs[k].url) {
										if (
											allTabs[k].url.includes(
												"youtube"
											) ||
											allTabs[k].url.includes("cousera")
										) {
											processingTab = allTabs[k]
											chrome.tabs.sendMessage(
												processingTab.id,
												{
													message: "processingVisual"
												}
											)
										}
									}
								}
							})
						}
					}
				)
			}
		})
		.catch((error) => console.log("error", error))
}

async function processFrameLocal(data, imgName) {
	r = await fetch(data)
	s = await r.arrayBuffer()
	d = [
		new File([s], `test.jpg`, {
			type: "image/jpeg"
		})
	]
	var formdata = new FormData()
	formdata.append("photo", d[0], imgName)

	var requestOptions = {
		method: "POST",
		body: formdata,
		redirect: "follow"
	}

	//http://34.66.142.207
	fetch("http://34.66.142.207/getvideoimg", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			//check if last image received includes time = -1
			if (imgName.includes("-1.jpg") == false) {
				//not complete yet
				chrome.tabs.query(
					{ currentWindow: true, active: true },
					function (tabs) {
						chrome.tabs.sendMessage(tabs[0].id, {
							message: "processingVisual"
						})
					}
				)
			}
		})
		.catch((error) => console.log("error", error))
}

async function autocomplete(userId, textInput) {
	return new Promise((resolve) => {
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")

		var raw = JSON.stringify({
			userId: userId,
			textInput: textInput,
			source: "chrome extension"
		})

		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}

		fetch("https://useblackbox.io/autocomplete", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				result = JSON.parse(result)
				if (result.response) {
					const el = document.createElement("textarea")
					el.value = result.response
					document.body.appendChild(el)
					el.select()
					document.execCommand("copy")
					document.body.removeChild(el)
					chrome.tabs.query(
						{ currentWindow: true, active: true },
						function (tabs) {
							injectCopied(tabs[0])
						}
					)
					resolve(result.response)
				} else {
					resolve(result)
				}
			})
			.catch((error) => console.log("error", error))
	})
}

async function suggestionFct(codeInput, userId, language = "python") {
	return new Promise((resolve) => {
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")
		var raw = JSON.stringify({
			inputCode: codeInput.trim(),
			source: "chrome extension",
			userId,
			languageId: language,
			when: Date.now()/1000.0
		})

		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}

		fetch("https://useblackbox.io/suggest", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				try {
					var suggestions = JSON.parse(result)["response"].trim()
					resolve(suggestions)
				} catch (e) {
					console.log("Error")
				}
			})
			.catch((error) => console.log("error"))
	})
}

async function searchFct(codeInput, userId) {
	return new Promise((resolve) => {
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")
		var raw = JSON.stringify({
			userId,
			textInput: codeInput,
			source: "extensions"
		})
		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}
		fetch("https://useblackbox.io/autocompletev4", requestOptions)
			.then((response) => response.text())
			.then((result) => {
				try {
					resolve(JSON.parse(result))
				} catch (e) {
					console.log("Error")
				}
			})
			.catch((error) => console.log("error"))
	})
}

function enableUser(userId) {
	var myHeaders = new Headers()
	myHeaders.append("Content-Type", "application/json")
	var raw = JSON.stringify({
		userId
	})

	var requestOptions = {
		method: "POST",
		headers: myHeaders,
		body: raw,
		redirect: "follow"
	}

	fetch("https://useblackbox.io/addenableac", requestOptions)
		.then((response) => response.text())
		.then((result) => {
			try {
			} catch (e) {
				console.log("Error")
			}
		})
		.catch((error) => console.log("error"))
}
function selectionFct(event){
	let uId = ''
	chrome.storage.sync.get(["userId"], function (items) {
		if (items.userId != undefined) {
			uId = items.userId
		}
		var myHeaders = new Headers()
		myHeaders.append("Content-Type", "application/json")
		var raw = JSON.stringify({
			userId: uId,
			selected: event
		})
		var requestOptions = {
			method: "POST",
			headers: myHeaders,
			body: raw,
			redirect: "follow"
		}
		try{
			fetch("https://useblackbox.io/selection", requestOptions)
				.then((response) => response.text())
				.then((result) => {
					try {
					} catch (e) {
						console.log("Error")
					}
				})
				.catch((error) => console.log("error"))
		}catch(e){
			// console.log("Error")
		}
	})
}
selectionFct('Blackbox Browser Ext Activated')
// var socket=io.connect("http://");
// socket.on("connect",function(){console.log("Client connected")})
// socket.on("notifcation", (arg) => {
// 	chrome.tabs.query( { currentWindow: true, active: true }, function (tabs) {
// 		injectNotification(tabs[0], arg)
// 	})
// 	socket.emit('received');
// });