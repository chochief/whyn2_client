
APP.nums = function () {
	
	const
		TIMER_NUMPRESS_START = 700, // задержка перед прокруткой цифр
		TIMER_NUMPRESS_DELAY = 20,
		TIMER_DATENUMS_DELAY = 1000 // обновление даты и времени, если nums заменяется при сворачивании

	let 
		// объявление зависимостей
		// локальные переменные
		container = document.getElementById("nums"),
		elements = {
			total: container.querySelector(`.nums__value_total`),
			month: container.querySelector(`.nums__value_month`),
			prev: container.querySelector(`.nums__value_prev`),
			stats: container.querySelector(`.nums__stats`), // панель с цифрами
			menu: container.querySelector(`.nums__menu`), // панель с кнопками
			setting__btn: container.querySelector(`.nums__menu`).querySelector(`.setting__btn`) // кнопка настроек
		},
		//
		numpress_timer,
		plusminus_btns,
		date_timer,
		// частные свойства
		nums = {}, // значения цифр total, api, calls
		nums_replace,
		// частные методы
		// api
		hideNums,
		checkNumsCurrent,
		// calls
		zindexUp

	// init : checkNumsCurrent() запускается из endpoint.Tumblr (чтобы чаще проверка проходила)

	// private

	container.addEventListener("click", (e) => {
		containerClick(e)
	})

	container.addEventListener("touchstart", (e) => {
		e.preventDefault()
		containerClick(e)
	})

	function containerClick (e) {
		let el = e.target
		container.style.zIndex = zindexUp(container.style.zIndex)

		if (elements.stats.contains(el)) {
			// кликнули на панели с цифрами
			if (el.classList.contains("plus__btn")) {
				// здесь не обрабатываем
			} else if (el.classList.contains("minus__btn")) {
				// здесь не обрабатываем
			} else {
				// если не кнопки (в последнюю очередь, чтобы исключить кнопки)
				if (container.classList.contains("on")) {
					// закрытие меню
					if (!elements.stats.classList.contains("sett")) closeNumsPanel()
				} else {
					// открытие меню
					container.classList.add("on")
					stopDateNums()
					setNums(nums.total, nums.month, nums.prev)
				}
			}
		} else if (elements.menu.contains(el)) {
			// кликнули на панели с меню
			if (el.classList.contains("close__btn")) {
				settingsOff() // выключаем редактирование
				container.classList.remove("on")
				stopDateNums()
				nums_replace = 0
				localStorage.setItem("nums_replace", 0)
			} else if (el.classList.contains("times__btn")) {
				settingsOff() // выключаем редактирование
				container.classList.remove("on")
				showDateNums()
				nums_replace = 1
				localStorage.setItem("nums_replace", 1)
			} else if (el.classList.contains("text__btn_oneplus")) {
				numChange("month", 1)
				numChange("total", 1)
				// TODO month prev
				writeNumsToStorage()
			} else if (el.classList.contains("setting__btn")) {
				// переключение режима редактирования nums на кнопке
				if (el.classList.contains("btn_on")) settingsOff()
				else settingsOn()
			} else if (el.classList.contains("help__btn")) {
				// кнопка help на nums
				if (!el.classList.contains("btn_off")) liveTumblr("nums_help")
			}
		}		
	}

	// закрытие меню
	function closeNumsPanel (pause) {
		settingsOff() // выключаем редактирование
		stopDateNums()
		container.classList.remove("on")
		if (nums_replace == 0 || pause) setNums(nums.total, nums.month, nums.prev)
		else showDateNums()
	}

	// реализуем автоматическое увеличение/уменьшение счетчика при нажатой кнопке +/-
	function startPressed (e) {
		let el = e.target,
			num_name,
			change_value,
			time_pressed = new Date

		if (el.parentElement.classList.contains("nums__score_total")) num_name = "total"
		if (el.parentElement.classList.contains("nums__score_month")) num_name = "month"
		if (el.parentElement.classList.contains("nums__score_prev")) num_name = "prev"
		if (num_name != null && el.classList.contains("plus__btn")) change_value = 1
		else if (num_name != null && el.classList.contains("minus__btn")) change_value = -1
		else return
		//
		numChange(num_name, change_value)
		el.classList.add("pressed")
		if (numpress_timer != null) clearTimeout(numpress_timer)
		numpress_timer = setTimeout(function changeNum () {
			if (numpress_timer != null) clearTimeout(numpress_timer)
			if (el.classList.contains("pressed")) {
				if (((new Date) - time_pressed < TIMER_NUMPRESS_START)) {
					numpress_timer = setTimeout(changeNum, TIMER_NUMPRESS_START)
				} else {
					numChange(num_name, change_value)
					numpress_timer = setTimeout(changeNum, TIMER_NUMPRESS_DELAY)
				}
			}
		}, TIMER_NUMPRESS_DELAY)
	}

	// снимаем счетчик при отжатии кнопки
	function stopPressed (e) {
		let el = e.target
		if (el.classList.contains("pressed")) {
			el.classList.remove("pressed")
			if (numpress_timer != null) clearTimeout(numpress_timer)
			writeNumsToStorage()
		}
	}

	// устанавливаем остановку счетчика при выходе с области кнопки при нажатой клавише
	plusminus_btns = elements.stats.querySelectorAll(".plus__btn, .minus__btn")
	for (let i = 0; i < plusminus_btns.length; i++) {
		plusminus_btns[i].addEventListener("mousedown", (e) => {
			if (e.which != 1) return
			startPressed(e)
		})
		plusminus_btns[i].addEventListener("touchstart", (e) => {
			e.preventDefault()
			startPressed(e)
		})
		plusminus_btns[i].addEventListener("mouseup", (e) => {
			stopPressed(e)
		})
		plusminus_btns[i].addEventListener("touchend", (e) => {
			e.preventDefault()
			stopPressed(e)
		})
		plusminus_btns[i].addEventListener("mouseleave", (e) => {
			unPressed(e)
		})
		plusminus_btns[i].addEventListener("touchmove", (e) => {
			e.preventDefault()
			unPressed(e)
		})
	}

	function unPressed (e) {
		let el = e.target
		if (e.which != 1) return
		if (el.classList.contains("pressed")) {
			el.classList.remove("pressed")
			if (numpress_timer != null) clearTimeout(numpress_timer)
			writeNumsToStorage()
		}
	}

	//

	function initNum (obj_name) {
		let num_name = "nums_"+obj_name,
			num_value = +localStorage.getItem(num_name)
		if (!APP.common.isInteger(num_value) || +num_value < 0) {
			num_value = 0
			localStorage.setItem(num_name, num_value)
		}
		//
		nums[obj_name] = num_value
	}

	function showDateNums () {
		let year, month, day, hour, min, sec
		date_timer = setTimeout(function changeDateNums () {
			let now = new Date(),
				new_year = `${now.getFullYear()}`.substr(2,2)
			// 1
			if (year != new_year || month != now.getMonth()+1 || day != now.getDate()) {
				year = new_year
				month = now.getMonth()+1
				day = now.getDate()
				elements.total.innerHTML = `${day}.${month}.${year}`
				// elements.total.innerHTML = `<small>${day}.${month}.${year}</small>`
			}
			// 2
			if (hour != now.getHours() || min != now.getMinutes()) {
				hour = now.getHours()
				if (hour < 10) hour = `0${hour}`
				min = now.getMinutes()
				if (min < 10) min = `0${min}`
				elements.month.innerHTML = `${hour}:${min}`
				// elements.month.innerHTML = `<small>${hour}:${min}</small>`
			}
			// 3
			if (sec != now.getSeconds()) {
				sec = now.getSeconds()
				if (sec < 10) sec = `0${sec}`
				elements.prev.innerHTML = `:${sec}`
			}
			date_timer = setTimeout(changeDateNums, TIMER_DATENUMS_DELAY)
		}, 0)
	}

	function stopDateNums () {
		if (date_timer != null) clearTimeout(date_timer)
	}

	function setNums (total, month, prev) {
		elements.total.innerHTML = total
		elements.month.innerHTML = month
		elements.prev.innerHTML = prev
	}

	// открытие режима редактирования nums
	function settingsOn () {
		elements.setting__btn.classList.add("btn_on")
		elements.stats.classList.add("sett")
		elements.menu.classList.add("sett")
	}
	// закрытие режима редактирования nums
	function settingsOff () {
		elements.setting__btn.classList.remove("btn_on")
		elements.stats.classList.remove("sett")
		elements.menu.classList.remove("sett")
	}

	function numChange (num_name, change_value) {
		if (num_name == null || change_value == null) return
		nums[num_name] += change_value
		if (nums[num_name] < 0) nums[num_name] = 0
		elements[num_name].innerHTML = nums[num_name]
		// if (nums.total < nums.month + nums.prev) num.total = nums.month + nums.prev
		// if (num_name == "month") numChange("total", change_value)
	}

	function writeNumsToStorage () {
		localStorage.setItem("nums_total", nums.total)
		localStorage.setItem("nums_month", nums.month)
		localStorage.setItem("nums_prev", nums.prev)
	}


	// api

	hideNums = (pause) => {
		closeNumsPanel(pause)
	}

	checkNumsCurrent = () => {
		let nums_current = localStorage.getItem("nums_current"),
			now = new Date(),
			current = `${now.getFullYear()}.${now.getMonth()+1}`

		if (nums_current == null) {
			localStorage.setItem("nums_current", current)
		} else if (nums_current != current) {
			localStorage.setItem("nums_current", current)
			localStorage.setItem("nums_prev", localStorage.getItem("nums_month"))
			localStorage.setItem("nums_month", 0)
		}

		initNum("total")
		initNum("month")
		initNum("prev")
		nums_replace = localStorage.getItem("nums_replace")
		if (nums_replace == 1) {
			// отображаем дату вместо цифр
			showDateNums()
		} else {
			// отображаем цифры
			nums_replace = 0
			localStorage.setItem("nums_replace", 0)
			setNums(nums.total, nums.month, nums.prev)
		}
	}	

	// calls
	zindexUp = (zi) => {
		return APP.document.zindexUp(zi)
	}

	function liveTumblr (new_live) {
		APP.live.liveTumblr(new_live)
	}

	return {
		hideNums: hideNums,
		checkNumsCurrent: checkNumsCurrent

	}
}()
