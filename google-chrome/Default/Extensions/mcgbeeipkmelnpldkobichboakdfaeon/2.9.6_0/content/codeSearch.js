// var ctrlDown = false
// $(document).on("keydown", function (e) { 
// 	const key = e.key
// 	if (key === "Control") { 
// 		ctrlDown = true
// 	}

// 	if (key === "i" && ctrlDown) {
// 		showIframe()
// 	}
// })
// $(document).on("keyup", function (e) { 
// 	const key = e.key
// 	if (key === "Control") { 
// 		ctrlDown = false
// 	}
// })

// var lastSearchedQuery = ""
// function showIframe(query = lastSearchedQuery) {
// 	if ($(".blackbox-code-holder").length) {
// 		$(".blackbox-code-holder").remove()
// 		return
// 	}
// 	const isDark = isDarkTheme()
// 	$(".blackbox-code-holder").remove()
// 	const $holder = $(`<div class="blackbox-code-holder ${isDark ? "dark" : ""}"><div class="close-iframe">X</div><iframe class="blackbox-code-iframe" allow="clipboard-read; clipboard-write" src="https://mamba-vsc-testing.onrender.com/getPageQuery?textInput=${encodeURI(query)}&theme=${isDark ? "dark":"light"}"></iframe></div>`)
// 	lastSearchedQuery = query
// 	$holder.find(".close-iframe").on("click", function () { 
// 		$(".blackbox-code-holder").remove()
// 	})

// 	$("body").prepend($holder)
// }

// function isDarkTheme() { 
// 	return window.matchMedia('(prefers-color-scheme: dark)').matches
// }