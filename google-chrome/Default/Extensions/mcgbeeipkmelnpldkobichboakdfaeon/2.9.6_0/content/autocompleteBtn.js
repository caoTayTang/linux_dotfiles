//colab element
;(function () {
	const url = window.location.href
	var addBtn = false
	if (url.includes("colab.research.google.com")) {
		addBtn = true

		const intCheck = setInterval(() => {
			var target = document.querySelector(".view-lines")
			if (target !== null) {
				clearInterval(intCheck)
				$(".view-lines").each((idx, el) => {
					var observer = new MutationObserver(function (mutations) {
						mutations.forEach(function (mutation) {
							const el = mutation.addedNodes[0]
							var text = $(el).text().trim().replace(/\s/g, " ")
							if (text.length > 5) {
								question = text
								// console.log(question)
							}
						})
					})

					var config = {
						attributes: true,
						childList: true,
						characterData: true
					}
					observer.observe(el, config)
				})
			}
		}, 1000)

		const bodyDetect = setInterval(() => {
			var target = document.body
			if (target !== null) {
				clearInterval(bodyDetect)

				var observer = new MutationObserver(function (mutations) {
					mutations.forEach(function (mutation) {
						const el = mutation.addedNodes[0]
						var text = $(el).text().trim().replace(/\s/g, " ")
						if (text.length > 5) {
							question = text

							if (question.endsWith("?")) { 
								question.slice(1, question.length)
								var query = question.slice(0, -1)
								query = query.slice(1, query.length)
								showIframeCodeholder(query)
							}
						}
					})
				})

				var config = {
					childList: true,
					characterData: true,
					attributes: true,
					subtree: true
				}
				observer.observe(target, config)
			}
		}, 1000)
		const toolBarInterval = setInterval(() => {
			if ($("#top-toolbar").length) { 
				clearInterval(toolBarInterval)

				const $holder = $("#top-toolbar")
				const $el = $(`<colab-toolbar-button class="blackbox-panel" style="line-height:0;">
								<img style="width:20px" src="${chrome.extension.getURL("images/b-icon.png")}">
							</colab-toolbar-button>`)

				$el.insertAfter($holder.find(".flex"))

				$el.on("click", function () {
					if ($(".blackbox-code-holder ").length) { 
						closeBlackboxPanel()
					}
					else{
						openBlackboxPanel()
					}
				})
			}
		}, 500);
	} else if (url.includes("replit.com")) {
		addBtn = true

		$(document).on("keydown", ".cm-content", function () {
			setTimeout(() => {
				question = $(this)
					.find(".cm-activeLine")
					.text()
					.trim()
					.replace(/\s/g, " ")
				// console.log(question)
			}, 50)
		})
	}

	if (addBtn) {
		const $chat = $(`
		<div class="black-box-autocomplete-btn active">
			<div class="black-box-autocomplete-floating">
				<div class="black-box-autocomplete-top-bar">
					<div></div>
					<div class="black-box-left">
						<div class="black-box-btn-holder black-box-close-autocomplete">
						<img src="${chrome.extension.getURL("images/close.svg")}" alt="">
						</div>
					</div>
				</div>
				<div class="black-box-body-holder"></div>
			</div>

			<div class="black-box-autocomplete-button">
				<img src="${chrome.extension.getURL(
					"images/icon16.png"
				)}" class="black-box-logo-autocomplete" alt="">
				<img src="${chrome.extension.getURL(
					"images/loader.svg"
				)}" class="black-box-loader-autocomplete" alt="">
			</div>
		</div>
		`)

		// $("body").prepend($chat)
	}
})()

$(document).on("click", ".black-box-autocomplete-button", function () {
	if ($(".black-box-autocomplete-floating").hasClass("active")) {
		clearTimeout(removeTime)
		hide()
	} else {
		getAutoComplete()
	}
})

function hide() {
	$(".black-box-autocomplete-floating").removeClass("active")
	setTimeout(() => {
		$(".black-box-autocomplete-floating").css("display", "none")
	}, 350)
}

function show() {
	$(".black-box-autocomplete-floating").css("display", "block")

	setTimeout(() => {
		$(".black-box-autocomplete-floating").addClass("active")
	}, 10)
}

function toggle() {
	if ($(".black-box-autocomplete-floating").hasClass("active")) {
		hide()
	} else {
		show()
	}
}

function hideShowOverlay() {
	if ($(".black-box-autocomplete-btn").hasClass("active")) {
		$(".black-box-autocomplete-btn").removeClass("active")
	} else {
		$(".black-box-autocomplete-btn").addClass("active")
	}
}

$(document).on("click", ".black-box-close-autocomplete", function () {
	hide()
})

function addMutation($el) {
	const target = $el[0]
	var observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			const el = mutation.addedNodes[0]

			var text = $(el).text().trim().replace(/\s/g, " ")
			// for jupyter
			if (!text.startsWith("xxxx") && text !== "") {
				question = text
				// console.log(question)
			}
		})
	})

	var config = {
		childList: true,
		characterData: true,
		attributes: true,
		subtree: true
	}
	observer.observe(target, config)
}

var question = ""
var removeTime

const $defaultOptionAutocomplete = $(`<img src="${chrome.extension.getURL(
	"images/done-code.png"
)}" class="black-box-empty-check" alt="">
<div class="black-box-empty-autocomplete">
	<span class="black-box-main-text">We got the snippet for you!</span>
	<span class="black-box-sub-text">You can now paste it anywhere</span>
</div>`)

function showBodyLoader() {
	$(".black-box-autocomplete-button").addClass("loader")
}
function hideBodyLoader() {
	$(".black-box-autocomplete-button").removeClass("loader")
}

chrome.runtime.onMessage.addListener((req, sender, res) => {
	if (req.message === "canPaste") {
		hideBodyLoader()
		$(".black-box-body-holder").empty()
		show()
		removeTime = setTimeout(() => {
			hide()
		}, 3000)
		$(".black-box-body-holder").append($defaultOptionAutocomplete)
	}
})

function getAutoComplete() {
	if (question.length > 5) {
		showBodyLoader()
		chrome.runtime.sendMessage({
			message: "getAutoComplete",
			text: question
		})
	}
}

var lastSearchedQuery = ""
function showIframeCodeholder(query = lastSearchedQuery) {
	chrome.storage.sync.get(async function (items) { 
		const theme = $("html").attr("theme") === "light" ? "light" : "dark"
		$(".blackbox-code-holder").remove()
		const $holder = $(`<div class="blackbox-code-holder ${theme === "dark" ? "dark" : ""}"><div class="close-iframe">X</div><iframe class="blackbox-code-iframe" allow="clipboard-read; clipboard-write" src="https://www.blckbx.ai/getPageQuery?textInput=${encodeURI(query)}&theme=${theme}&userId=${items.userId}"></iframe></div>`)
		lastSearchedQuery = query
		$holder.find(".close-iframe").on("click", function () { 
			$(".blackbox-code-holder").remove()
		})

		$(".notebook-container").append($holder)
	})
}

function openBlackboxPanel() { 
	showIframeCodeholder()
}
function closeBlackboxPanel() { 
	$(".blackbox-code-holder ").remove()
}