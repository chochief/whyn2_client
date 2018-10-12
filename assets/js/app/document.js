
APP.document = function () {
	
	let 
		// объявление зависимостей
		// локальные переменные
		logo = document.getElementById("logo_container"),
		btn_help = document.getElementById("btns_help"), // главная кнопка помощи
		// частные свойства
		zindex = 21000,
		// частные методы
		// api
		disableHelps,
		zindexUp
		// calls

	// init
	logo.addEventListener("click", () => {
		if (!btn_help.classList.contains("btn_off")) liveTumblr("whyn_help")
	})

	btn_help.addEventListener("click", () => {
		if (!btn_help.classList.contains("btn_off")) liveTumblr("main_help")
	})


	// private
	document.onkeydown = function(e) {
		e = e || window.event
		let isEscape = false
		if ("key" in e) {
			isEscape = (e.key == "Escape" || e.key == "Esc")
		} else {
			isEscape = (e.keyCode == 27)
		}
		if (isEscape) {
			hideNews()
			hideNums()
			hideSett()
		}
	}

	// api
	zindexUp = (zi) => {
		if (zi != zindex) zindex++
		return zindex
	}

	disableHelps = () => {
		let helpBtns = document.querySelectorAll(".help__btn")
		for (let i = 0; i < helpBtns.length; i++) {
			helpBtns[i].classList.add("btn_off")
		}
	}

	// calls

	function liveTumblr (new_live) {
		APP.live.liveTumblr(new_live)
	}

	function hideNews () {
		APP.live.hideNews()
	}

	function hideNums () {
		APP.nums.hideNums()
	}

	function hideSett () {
		APP.sett.hideSett()
	}

	return {
		zindexUp: zindexUp,
		disableHelps: disableHelps
	}
}()
