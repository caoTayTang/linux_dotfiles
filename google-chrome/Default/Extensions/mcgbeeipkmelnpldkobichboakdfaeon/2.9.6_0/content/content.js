var jcrop, selection
var timeResults = []
var arrayResults
var arrayAudio = [[], []]
var arrayVisual = [[], []]
var savedHeight
var savedWidth

var overlay = ((active) => (state) => {
	active =
		typeof state === "boolean" ? state : state === null ? active : !active
	$(".jcrop-holder")[active ? "show" : "hide"]()
	chrome.runtime.sendMessage({ message: "active", active })
})(false)

var image = (done) => {
	var image = new Image()
	image.id = "fake-image"
	image.src = chrome.runtime.getURL("/images/pixel.png")
	image.onload = () => {
		$("body").append(image)
		done()
	}
}

var init = (done) => {
	$("#fake-image").Jcrop(
		{
			bgColor: "none",
			onSelect: (e) => {
				selection = e
				capture()
			},
			onChange: (e) => {
				selection = e
			},
			onRelease: (e) => {
				setTimeout(() => {
					selection = null
				}, 100)
			}
		},
		function ready() {
			jcrop = this

			if (selection) {
				jcrop.setSelect([
					selection.x,
					selection.y,
					selection.x2,
					selection.y2
				])
			}

			done && done()
		}
	)
}

var capture = (force) => {
	chrome.storage.sync.get((config) => {
		if (
			selection &&
			(config.method === "crop" || (config.method === "wait" && force))
		) {
			jcrop.release()
			setTimeout(() => {
				chrome.runtime.sendMessage(
					{
						message: "capture",
						area: selection,
						dpr: devicePixelRatio
					},
					(res) => {
						overlay(false)
						selection = null
						if(res) save(res.image, config.format, config.save)
					}
				)
			}, 50)
		} else if (config.method === "view") {
			chrome.runtime.sendMessage(
				{
					message: "capture",
					area: { x: 0, y: 0, w: innerWidth, h: innerHeight },
					dpr: devicePixelRatio
				},
				(res) => {
					overlay(false)
					if (res) save(res.image, config.format, config.save)
				}
			)
		}
	})
}

var filename = (format) => {
	var pad = (n) => ((n = n + ""), n.length >= 2 ? n : `0${n}`)
	var ext = (format) =>
		format === "jpeg" ? "jpg" : format === "png" ? "png" : "png"
	var timestamp = (now) =>
		[
			pad(now.getFullYear()),
			pad(now.getMonth() + 1),
			pad(now.getDate())
		].join("-") +
		" - " +
		[
			pad(now.getHours()),
			pad(now.getMinutes()),
			pad(now.getSeconds())
		].join("-")
	return `Copy Text from Videos - ${timestamp(new Date())}.${ext(format)}`
}

var save = (image, format, save) => {
	if (save === "file") {
		var link = document.createElement("a")
		link.download = filename(format)
		link.href = image
		// link.click()//remove the download
	} else if (save === "url") {
		navigator.clipboard.writeText(image).then(() => {
			alert(
				[
					"Copy Text from Videos:",
					"Data URL String",
					"Saved to Clipboard!"
				].join("\n")
			)
		})
	} else if (save === "binary") {
		var [header, base64] = image.split(",")
		var [_, type] = /data:(.*);base64/.exec(header)
		var binary = atob(base64)
		var array = Array.from({ length: binary.length }).map((_, index) =>
			binary.charCodeAt(index)
		)
		navigator.clipboard
			.write([
				new ClipboardItem({
					// jpeg is not supported on write, though the encoding is preserved
					"image/png": new Blob([new Uint8Array(array)], {
						type: "image/png"
					})
				})
			])
			.then(() => {
				alert(
					[
						"Copy Text from Videos:",
						"Binary Image",
						"Saved to Clipboard!"
					].join("\n")
				)
			})
	}
}

window.addEventListener(
	"resize",
	((timeout) => () => {
		clearTimeout(timeout)
		timeout = setTimeout(() => {
			if (jcrop) {
				jcrop.destroy()
			}
			init(() => overlay(null))
		}, 100)
	})()
)
var notificationData = {
	title: "Text Copied!",
	subtitle: "You can now paste (ctrl or cmd + V)",
	body: "Save to History",
	url: "https://useblackbox.io/history"
}
// function addToaster(str = "Video processed", userId) {//original toaster
// 	var toaster = $(`
// 	<div class="black-box-toaster-holder">
// 		<div class="black-box-video-text">${notificationData.title}</div>
// 		<a href="${notificationData.url}" class="black-box-video-text" style="color: #8ab4f8;">${notificationData.body}</a>
// 		<img
// 			src="${chrome.extension.getURL("images/close.png")}"
// 			class="black-box-icon black-box-toaster-close"
// 			alt="close icon"
// 		/>
// 	</div>
// 	`)

// 	$("body").prepend(toaster)
// 	setTimeout(() => {
// 		$(".black-box-toaster-holder").addClass("active")
// 	}, 100)

// 	let removeToaster = setTimeout(() => {
// 		$(".black-box-toaster-holder").removeClass("active")
// 		setTimeout(() => {
// 			$(".black-box-toaster-holder").remove()
// 		}, 300)
// 	}, 4000)

// 	$(document).on("click", ".black-box-toaster-close", function () {
// 		clearTimeout(removeToaster)
// 		$(".black-box-toaster-holder").removeClass("active")
// 		setTimeout(() => {
// 			$(".black-box-toaster-holder").remove()
// 		}, 300)
// 	})
// }
function addToaster(str = "Video processed", userId) {
	if ($(".black-box-onboard-message-holder").length === 0) {
		$("body").prepend(
			`<div class="black-box-onboard-message-holder"></div>`
		)
	}
	const $message = $(`
		<div style="cursor:pointer;" class="black-box-onboard-message bottom cookie-banner-wrapper---brix-copy cookie-banner-2---brix-copy preview-page-copy">
			<div class="cookie-banner-content---brix cookie-banner-2---brix">
			<div class="cookie-banner-2-left-content---brix">
			<img src="${chrome.extension.getURL(
				"images/LogoWhite.svg"
			)}" width="67" alt="" class="cookie-icon---brix">
				<div class="div-block-copy">
				<div class="div-block-copy2">
				<img src="${chrome.extension.getURL(
					"images/success-icon.svg"
				)}" loading="lazy" alt="" class="success-icon cookie-banner-2---brix-2" style="display:none;">
					<p class="paragraph cookie-banner-2-paragraph---brix">${
						notificationData.title
					}<a href=""></a>
					</p>
				</div>
				<p class="belowparag">${notificationData.subtitle}<a href="#"></a>
				</p>
				</div>
			</div>
			<div class="cookie-banner-2-right-content---brix">
				<a href="" style="font-size:14px" class="button-primary cookie-banner-button-2---brix w-button">${
					notificationData.body
				}</a>
				<img src="${chrome.extension.getURL(
					"images/closesvgwhite.svg"
				)}" loading="lazy" alt="" class="close-message---brix cookie-banner-2---brix">
			</div>
			</div>
		</div>
	`)

	$(".black-box-onboard-message-holder").prepend($message)
	$(".black-box-onboard-message-holder").on("click", function () {
		window.open(notificationData.url)
	})

	const $el = $message
	setTimeout(() => {
		$el.addClass("active")
	}, 100)

	let removeToaster = setTimeout(() => {
		$el.removeClass("active")
		setTimeout(() => {
			$el.remove()
			checkToasterCount()
		}, 300)
	}, 4000)

	$(document).on("click", ".black-box-onboard-close", function () {
		clearTimeout(removeToaster)
		$el.removeClass("active")
		setTimeout(() => {
			$el.remove()
			checkToasterCount()
		}, 300)
	})
}

function checkToasterCount() {
	if ($(".black-box-onboard-message-holder div").length === 0) {
		$(".black-box-onboard-message-holder").remove()
	}
}

function addNotification(data) {
	var toaster = $(`
	<div class="black-box-notification-holder" style="cursor: pointer;">
		<div class="black-box-video-text">${data.title}</div>
		<img
			src="${chrome.extension.getURL("images/close.png")}"
			class="black-box-icon black-box-toaster-close"
			alt="close icon"
		/>
	</div>
	`)

	$("body").prepend(toaster)
	setTimeout(() => {
		$(".black-box-notification-holder").addClass("active")
	}, 100)

	$(document).on("click", ".black-box-toaster-close", function () {
		$(".black-box-notification-holder").removeClass("active")
		setTimeout(() => {
			$(".black-box-notification-holder").remove()
		}, 300)
	})
	$(".black-box-video-text").on("click", function () {
		if (data.url) {
			window.open(data.url)
		}
		$(".black-box-notification-holder").removeClass("active")
		setTimeout(() => {
			$(".black-box-notification-holder").remove()
		}, 300)

		chrome.runtime.sendMessage({ message: "notificationEngaged" })
	})
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.message === "TabUpdated") {
		deconstruct()
	}
})

function deconstruct() {
	$(".black-box-search-holder").remove()
	$(".black-box-toaster-holder").remove()
}

chrome.runtime.onMessage.addListener((req, sender, res) => {
	res({}) // prevent re-injecting
	if (req.message === "init") {
		if (!jcrop) {
			image(() =>
				init(() => {
					overlay()
					capture()
				})
			)
		} else {
			overlay()
			capture(true)
		}
	}
	var entered = false
	if (req.message === "play") {
		arrayResults = req.text.split(";")
		var video = videoDefine(window.location.href)
		timeResults = []
		var indexResult = 0
		if (req.time.includes(";")) {
			timeResults = req.time.split(";")
			video.currentTime = parseInt(timeResults[0])
			video.play()
		} else if (req.time.length != 0) {
			timeResults = [req.time]
			video.currentTime = parseInt(timeResults[0])
			video.play()
		}

		//Define arrayVisual
		if (arrayResults[0].includes('"x"')) {
			//its a visual result
			arrayVisual = [[], []] // clear the results values for a new search
			if (isYt(window.location.href)) {
				document.getElementsByClassName(
					"blackbox-filter-visual"
				)[0].style = "color:#398499;cursor:pointer;"
				document.getElementsByClassName(
					"blackbox-filter-audio"
				)[0].style = "color:white;cursor:pointer;"
			}
		} else {
			arrayAudio = [[], []] // clear the results values for a new search
		}
		for (var l = 0; l < arrayResults.length; l++) {
			if (arrayResults[l].includes('"x"')) {
				arrayVisual[0].push(timeResults[l])
				arrayVisual[1].push(arrayResults[l])
			}
		}

		//Define arrayAudio
		for (var l = 0; l < arrayResults.length; l++) {
			if (arrayResults[l].includes('"x"') == false) {
				arrayAudio[0].push(timeResults[l])
				arrayAudio[1].push(arrayResults[l])
			}
		}

		//Visual highlight even if only 1 result
		var k = indexResult
		if (arrayResults[k].includes('"x"')) {
			//display visual results
			coordinates = JSON.parse(arrayResults[k])
			highlightVisual(coordinates)
		}

		const searchQuery = req.query
		$(document).off("click", ".black-box-icon")

		document.addEventListener("keydown", function (event) {
			if (event.keyCode == 190) {
				indexResult += 1
				if (timeResults[indexResult] == undefined) {
					indexResult = 0
				}
				video.currentTime = parseInt(timeResults[indexResult])
			} else if (event.keyCode == 188) {
				indexResult -= 1
				if (timeResults[indexResult] == undefined) {
					indexResult = 0
				}
				video.currentTime = parseInt(timeResults[indexResult])
			}
		})
		$(document).on("click", ".black-box-icon", function () {
			if (
				timeResults[indexResult] != undefined ||
				timeResults.length !== 0
			) {
				if ($(this).hasClass("black-box-next")) {
					indexResult += 1
					if (timeResults[indexResult] == undefined) {
						indexResult = 0
					}
					video = videoDefine(window.location.href)
					video.currentTime = parseInt(timeResults[indexResult])

					var k = indexResult
					if (arrayResults[k].includes('"x"')) {
						//display visual results
						coordinates = JSON.parse(arrayResults[k])
						highlightVisual(coordinates)
					}
				} else if ($(this).hasClass("black-box-prev")) {
					indexResult -= 1
					if (timeResults[indexResult] == undefined) {
						indexResult = timeResults.length - 1
					}
					video = videoDefine(window.location.href)
					video.currentTime = parseInt(timeResults[indexResult])

					var k = indexResult
					if (arrayResults[k].includes('"x"')) {
						//display visual results
						coordinates = JSON.parse(arrayResults[k])
						highlightVisual(coordinates)
					}
				}
				$(".black-box-item-counter").text(
					`${indexResult + 1}/${timeResults.length}`
				)
			}
		})

		$(document).on("click", ".black-box-close-icon", function () {
			setTimeout(() => {
				$(".black-box-search-holder").addClass("active")
				$(".blackbox-filter-visual").addClass("d-none")
				$(".blackbox-filter-audio").addClass("d-none")
			}, 50)
		})
		// addToaster()//on search
		$(".black-box-search-holder").remove()

		var countResult = ""
		if (timeResults.length == 0) {
			countResult = "0/0"
		} else {
			countResult = `1/${timeResults.length}`
		}

		var filters = ``
		if (isYt(window.location.href)) {
			filters = `<div class="blackbox-filter-visual" style="background-color: transparent; color: white;cursor: pointer;">Visual</div>
						<div class="blackbox-filter-audio" style="background-color: transparent; color: white;cursor: pointer;">Audio</div>`
		}

		var stripHolder = $(`
				<div class="black-box-search-holder">
					<input class="black-box-video-text  black-box-rem" value="${searchQuery}"/>
					<div class="black-box-item-counter  black-box-rem">${countResult}</div>
					<div class="line-divider black-box-rem"></div>
					<img
						src="${chrome.extension.getURL("images/up.png")}"
						class="black-box-icon black-box-prev  black-box-rem"
						alt="next icon"
					/>
					<img
						src="${chrome.extension.getURL("images/down.png")}"
						class="black-box-icon black-box-next black-box-rem"
						alt="prev icon"
					/>
					<img
						src="${chrome.extension.getURL("images/close.png")}"
						class="black-box-icon black-box-close-icon black-box-rem"
						alt="close icon"
					/>
					${filters}
					<img src="${chrome.extension.getURL(
						"images/search-white.svg"
					)}" class="black-box-open-icon" />
				</div>
			`)

		$(document).on("click", ".black-box-search-holder.active", function () {
			$(this).removeClass("active")
			$(".blackbox-filter-visual").removeClass("d-none")
			$(".blackbox-filter-audio").removeClass("d-none")
		})

		var holder = document.getElementById("ytd-player")
		$(holder).prepend(stripHolder)
		if (
			window.location.href.includes("youtube") == false &&
			window.location.href.includes("youtu.be") == false
		) {
			const $el = $($("video")[0])
			$container = $("#player")
			$container = $el.parent()
			$container.prepend(stripHolder)
		}
	}
	if (req.message === "processing") {
		if (req.status == "Video is processing") {
			var video = videoDefine(window.location.href)
			savedWidth = video.videoWidth
			savedHeight = video.videoHeight
			var stripHolder = $(`
					<div class="black-box-search-holder">
						<input class="black-box-video-text  black-box-rem" name="searchfield" placeholder="Video is processing..." id="searchfield"/>
						<div class="black-box-item-counter  black-box-rem"></div>
						<div class="line-divider black-box-rem"></div>
						<img
							src="${chrome.extension.getURL("images/up.png")}"
							class="black-box-icon black-box-next  black-box-rem"
							alt="next icon"
						/>
						<img
							src="${chrome.extension.getURL("images/down.png")}"
							class="black-box-icon black-box-prev black-box-rem"
							alt="prev icon"
						/>
						<img
							src="${chrome.extension.getURL("images/close.png")}"
							class="black-box-icon black-box-close-icon black-box-rem"
							alt="close icon"
						/>
						<img src="${chrome.extension.getURL(
							"images/search-white.svg"
						)}" class="black-box-open-icon" />
					</div>
				`)

			$(document).on(
				"click",
				".black-box-search-holder.active",
				function () {
					$(this).removeClass("active")
				}
			)

			var holder = document.getElementById("ytd-player")
			$(holder).prepend(stripHolder)
			if (
				window.location.href.includes("youtube") == false &&
				window.location.href.includes("youtu.be") == false
			) {
				const $el = $($("video")[0])
				$container = $("#player")
				$container = $el.parent()
				$container.prepend(stripHolder)
			}
		} else if (
			req.status == "Video Processed" ||
			req.status == "video processing complete"
		) {
			document.getElementsByName("searchfield")[0].placeholder =
				req.status
			document.getElementById("searchfield").focus()
			setTimeout(() => {
				document.getElementsByName("searchfield")[0].placeholder =
					"Search With Blackbox..."
			}, 3000)
		} else if (req.status == "video can't be processed") {
			if (
				window.location.href.includes("youtube") ||
				window.location.href.includes("youtu.be")
			) {
				notificationData.title = "Video Restricted"
				addToaster(req.status)
			}
		}

		$(document).on("click", ".blackbox-filter-visual", function () {
			chrome.runtime.sendMessage({
				message: "userSearchedVisual",
				searchText: $(".black-box-video-text").val(),
				url: window.location.href
			})
			document.getElementsByClassName(
				"black-box-item-counter"
			)[0].innerHTML = `...`
		})
		$(document).on("click", ".blackbox-filter-audio", function () {
			document.getElementsByClassName("blackbox-filter-visual")[0].style =
				"color:white;cursor:pointer;"
			document.getElementsByClassName("blackbox-filter-audio")[0].style =
				"color:#398499;cursor:pointer;"
			timeResults = arrayAudio[0]
			arrayResults = arrayAudio[1]
			indexResult = 0
			$(".black-box-item-counter").text(
				`${indexResult + 1}/${timeResults.length}`
			)
		})
	}

	if (req.message === "notification") {
		addNotification(req.data)
	}
	if (req.message === "copied") {
		var userId = req.userId
		if (req.notificationData) {
			notificationData = req.notificationData
		}
		addToaster("Text Copied!", userId)
	}
	if (req.message === "searchq") {
		if (timeResults.includes(req.time) == false) {
			timeResults.push(req.time)
			var countResult = `1/${timeResults.length}`
			document.getElementsByClassName(
				"black-box-item-counter"
			)[0].innerHTML = countResult
			if (timeResults.length == 1) {
				var video = videoDefine(window.location.href)
				video.currentTime = parseInt(timeResults[0])
				video.play()
			}
		}
	}
	if (req.message === "startVisual") {
		if (req.status == "Visual Processing Complete") {
			setTimeout(function () {
				notificationData.title = "Processing Complete"
				addToaster("Processing Complete")
			}, 1500)
		} else {
			video = videoDefine(window.location.href)

			video.volume = 0 //mute to avoid voice noise
			video.currentTime = 0
			processingOverlay()
			if (window.location.href.includes("http")) {
				//live website processing
				sendImg(video.currentTime)
			} else {
				sendImgLocal(video.currentTime)
			}
		}
	}
	if (req.message === "processingVisual") {
		video = videoDefine(window.location.href)
		video.currentTime += 5
		if (window.location.href.includes("http")) {
			//live website processing
			sendImg(video.currentTime)
		} else {
			sendImgLocal(video.currentTime)
		}
	}
	if (req.message === "autocomplete") {
		var textInput = getSelectionText()
		chrome.runtime.sendMessage({
			message: "textInput",
			textInput: textInput
		})
	}
	return true
})

$(document).on("keydown", ".black-box-video-text", function (e) {
	if (e.which == 13) {
		if (isYt(window.location.href)) {
			chrome.runtime.sendMessage({
				message: "userSearched",
				searchText: $(".black-box-video-text").val(),
				url: window.location.href
			})
		} else {
			chrome.runtime.sendMessage({
				message: "userSearchedVisual",
				searchText: $(".black-box-video-text").val(),
				url: window.location.href
			})
		}
		document.getElementsByClassName(
			"black-box-item-counter"
		)[0].innerHTML = `...`
	}
})

//Visual Processing
var video = videoDefine(window.location.href) //youtube
if (video) {
	w = video.videoWidth
	h = video.videoHeight
}

async function sendImg(sec) {
	updateProcessing(sec)
	var cnv = document.createElement("canvas")
	var ctx = cnv.getContext("2d")
	cnv.height = h
	cnv.width = w
	ctx.drawImage(video, 0, 0, w, h)
	//2
	var data = cnv.toDataURL("image/jpeg")
	var videoId = getYoutubeId(window.location.href)

	var adStatus = adShowing()
	if (adStatus == false) {
		if (video.currentTime < video.duration) {
			processImg(data, `${videoId}_${parseInt(sec)}.jpg`)
		} else {
			processImg(data, `${videoId}_-1.jpg`)

			notificationData.title = "Processing Complete"
			addToaster("Processing Complete")
			video.currentTime = 0
			video.volume = 1 //unmute after processing complete
			document
				.getElementsByClassName("black-box-processing-text")[0]
				.remove()
		}
	} else {
		//there is an ad or loader wait 1sec
		setTimeout(function () {
			sendImg(video.currentTime)
		}, 1000)
	}
}

async function sendImgLocal(sec) {
	// function for local image genration
	var videoId = getYoutubeId(window.location.href)
	if (video.currentTime < video.duration) {
		processImgLocal(`${videoId}_${parseInt(sec)}.jpg`)
	} else {
		processImgLocal(`${videoId}_-1.jpg`)
		notificationData.title = "Processing Complete"
		addToaster("Processing Complete")
		video.currentTime = 0
		video.volume = 1 //unmute after processing complete
		document.getElementsByClassName("black-box-processing-text")[0].remove()
	}
}

function adShowing() {
	if (
		window.location.href.includes("youtube") ||
		window.location.href.includes("youtu.be")
	) {
		if (
			document.querySelector("div.ad-showing") ||
			document.getElementsByClassName("ytp-spinner")[0].style.display !=
				"none"
		) {
			return true
		} else {
			return false
		}
	} else {
		return false
	}
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

function processImg(data, imgName) {
	chrome.runtime.sendMessage({
		message: "getvideoimg",
		data: data,
		imgName: imgName
	})
}

function processImgLocal(imgName) {
	// function like processImg for local files
	chrome.runtime.sendMessage({
		message: "getvideoimglocal",
		imgName: imgName
	})
}

function highlightVisual(coordinates) {
	const $player = $("video")
	$container = $("#player")
	video = videoDefine(window.location.href)
	var ratioY = video.offsetHeight / savedHeight
	var ratioX = video.offsetWidth / savedWidth
	var xStart = Math.round(coordinates[0].x * ratioX)
	var yStart = Math.round(coordinates[0].y * ratioY)
	var width = Math.round((coordinates[1].x - coordinates[0].x) * ratioX)
	var height = Math.round((coordinates[2].y - coordinates[0].y) * ratioY)
	const $box = $(
		`<div class="black-box-highlight-box" style='left:${xStart}px;top:${yStart}px;width:${width}px;height:${height}px'></div>`
	)
	$container.prepend($box)

	if (
		window.location.href.includes("youtube") == false &&
		window.location.href.includes("youtu.be") == false
	) {
		const $el = $($("video")[0])
		$container = $("#player")
		$container = $el.parent()
		$container.prepend($box)
	}

	setTimeout(function () {
		$(".black-box-highlight-box").remove()
	}, 500)
}

function videoDefine(url) {
	//function that takes the input=url-> output video element - for all players
	var video
	if (url.includes("youtube") || url.includes("youtu.be")) {
		video = document.getElementsByClassName("video-stream")[0]
		return video
	} else {
		// video = document.getElementsByTagName("video")[0]
		video = $("video")[0]
		return video
	}
}

function isYt(url) {
	if (
		window.location.href.includes("youtube") == false &&
		window.location.href.includes("youtu.be") == false
	) {
		return false
	} else {
		return true
	}
}

async function processingOverlay() {
	var $newEl = $(
		` <div class="black-box-processing-text">Processing...</div> `
	)
	if (isYt(window.location.href)) {
		if (
			document.getElementById("player-theater-container").innerHTML != ""
		) {
			$(".ytp-size-button").click()
		}
		$container = $("#player")
		$container.prepend($newEl)
	} else {
		const $el = $($("video")[0])
		$container = $("#player")
		$container = $el.parent()
		$container.prepend($newEl)
	}
	var video = videoDefine(window.location.href) //youtube
}
function updateProcessing(sec) {
	document.getElementsByClassName(
		"black-box-processing-text"
	)[0].innerText = `Processing ${Math.round((sec * 100) / video.duration)}%`
}

function getSelectionText() {
	var text = ""
	if (window.getSelection) {
		text = window.getSelection().toString()
	} else if (document.selection && document.selection.type != "Control") {
		text = document.selection.createRange().text
	}
	return text
}
