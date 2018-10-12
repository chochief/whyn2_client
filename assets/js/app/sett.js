
APP.sett = function () {

	const
		// SEX_VALS = ["n","m","f"],
		// AGE_VALS = ["n","a","b","c","d","e","f"]
		SEX_VALS = { n:true, m:true, f:true },
		AGE_VALS = { n:true, a:true, b:true, c:true, d:true, e:true, f:true }

	let 
		// объявление зависимостей
		// локальные переменные
		btn = document.getElementById("btns_settings"),
		container = document.getElementById("settings"),
		elements = {
			// alert: container.querySelector(`.sett__alert`),
			alert: btn.querySelector(`.sett__alert`),
			form: container.querySelector(`.sett__form`),
			sex_line: container.querySelector(`.sett__sex-data`),
			age_line: container.querySelector(`.sett__age-data`),
			filterm_line: container.querySelector(`.sett__filter_m`),
			filterf_line: container.querySelector(`.sett__filter_f`)
		},
		filter_valid_values = {},
		filter_chars = [],
		filter_chars_indexes = {},
		// частные свойства
		settings = {
			sex: "n",
			age: "n",
			filter: {},
			filter_str: "n"
		}, // sex, age, filter
		// частные методы
		// api
		hideSett,
		getSett,
		getFilterCharsIndexes,
		getOffFilter,
		// calls
		zindexUp

	// init
	initFilterValidValues()
	initSex()
	initAge()
	initFilters()
	setForm()

	// private

	btn.addEventListener("click", () => {
		container.style.zIndex = zindexUp(container.style.zIndex)
		btn.classList.toggle("btn_on")
		container.classList.toggle("on")
	})

	container.addEventListener("click", (e) => {
		containerClick(e)
	})

	container.addEventListener("touchstart", (e) => {
		e.preventDefault()
		containerClick(e)
	})

	function containerClick (e) {
		let el = e.target,
			value
		container.style.zIndex = zindexUp(container.style.zIndex)

		if (el.classList.contains("sett__btn") || el.parentElement.classList.contains("sett__btn")) {
			if (elements.sex_line.contains(el)) {
				// нажата кнопка выбора пола
				value = el.dataset.sex != null ? el.dataset.sex : el.parentElement.dataset.sex
				settings.sex = SEX_VALS[value] == true ? value : "n"
				localStorage.setItem("sett_sex", settings.sex)
				setForm()
				reSett(settings.sex, settings.age, settings.filter_str)
			} else if (elements.age_line.contains(el)) {
				// нажата кнопка выбора возраста
				value = el.dataset.age != null ? el.dataset.age : el.parentElement.dataset.age
				settings.age = AGE_VALS[value] == true ? value : "n"
				localStorage.setItem("sett_age", settings.age)
				setForm()
				reSett(settings.sex, settings.age, settings.filter_str)
			} else if (elements.filterm_line.contains(el) || elements.filterf_line.contains(el)) {
				value = el.dataset.filter != null ? el.dataset.filter : el.parentElement.dataset.filter
				if (value != null && filter_valid_values[value] == true) {
					settings.filter[value] = !settings.filter[value]
					// settings.filter_str = jsonMake(settings.filter)
					// localStorage.setItem("sett_filter", settings.filter_str)
					filterFromSettings()
					setForm()
					reSett(settings.sex, settings.age, settings.filter_str)
				}
			}
		} else if (el.classList.contains("help__btn")) {
			// кнопка помощи на nums
			if (!el.classList.contains("btn_off")) liveTumblr("sett_help")
		} else if (el.classList.contains("close__btn")) {
			// кнопка закрытия диалога
			btn.classList.toggle("btn_on")
			container.classList.toggle("on")
		}		
	}

	//

	function initFilterValidValues () {
		let s, a
		for (s in SEX_VALS) { // будет в порядке присвоения, т.е. m, потом f
			if (s == "n") continue
			for (a in AGE_VALS) { // тоже по порядку - a, b, c, ...
				if (a == "n") continue
				filter_valid_values[`${s}${a}`] = true
				filter_chars.push(`${s}${a}`)
			}
		}
		for (let i = 0; i < filter_chars.length; i++) {
			filter_chars_indexes[filter_chars[i]] = i
		}
	}

	function initSex () {
		let value = localStorage.getItem("sett_sex")
		if (!SEX_VALS[value]) {
			value = "n"
			localStorage.setItem("sett_sex", value)
		}
		//
		settings.sex = value
	}

	function initAge () {
		let value = localStorage.getItem("sett_age")
		if (!AGE_VALS[value]) {
			value = "n"
			localStorage.setItem("sett_age", value)
		}
		//
		settings.age = value
	}

	function initFilters () {
		let filter_str = localStorage.getItem("sett_filter")
		filterFromStr(filter_str)
	}

	function filterFromStr(filter_str) {
		let key
		if (filter_str == null || !isString(filter_str) || filter_str.length != filter_chars.length) {
			for (key in AGE_VALS) {
				if (key == "n") continue
				settings.filter[`m${key}`] = false
				settings.filter[`f${key}`] = false
			}
			settings.filter_str = new Array(filter_chars.length+1).join("0")
		} else {
			for (let i = 0; i < filter_chars.length; i++) {
				settings.filter[filter_chars[i]] = filter_str.charAt(i) == "1" ? true : false
			}
			settings.filter_str = filter_str
		}
		localStorage.setItem("sett_filter", settings.filter_str)
	}

	function filterFromSettings() {
		let filter_str = "",
			key
		if (settings.filter == null || !isObject(settings.filter)) {
			for (key in AGE_VALS) {
				if (key == "n") continue
				settings.filter[`m${key}`] = false
				settings.filter[`f${key}`] = false
			}			
			settings.filter_str = new Array(filter_chars.length+1).join("0")
		} else {
			for (let i = 0; i < filter_chars.length; i++) {
				filter_str += settings.filter[filter_chars[i]] == true ? 1 : 0
			}
			settings.filter_str = filter_str
		}
		localStorage.setItem("sett_filter", settings.filter_str)
	}

	function setForm () {
		let key
		
		for (key in SEX_VALS) {
			if (settings.sex == key) elements.sex_line.querySelector(`.sett__sex-${key}`).classList.add("btn_on")
			else elements.sex_line.querySelector(`.sett__sex-${key}`).classList.remove("btn_on")
		}
		for (key in AGE_VALS) {
			if (settings.age == key) elements.age_line.querySelector(`.sett__age-${key}`).classList.add("btn_on")
			else elements.age_line.querySelector(`.sett__age-${key}`).classList.remove("btn_on")
		}

		setAlert() // проверяем и устанавливанм предупреждение на кнопку настроек

		for (key in AGE_VALS) {
			if (key == "n") continue
			if (settings.filter[`m${key}`] != null && settings.filter[`m${key}`] == true) elements.filterm_line.querySelector(`.sett__age-${key}`).classList.add("btn_on")
			else elements.filterm_line.querySelector(`.sett__age-${key}`).classList.remove("btn_on")
			if (settings.filter[`f${key}`] != null && settings.filter[`f${key}`] == true) elements.filterf_line.querySelector(`.sett__age-${key}`).classList.add("btn_on")
			else elements.filterf_line.querySelector(`.sett__age-${key}`).classList.remove("btn_on")
		}
	}

	// установка предупреждения
	function setAlert () {
		if ((settings.sex == "n" || settings.age == "n")) elements.alert.classList.remove("hidden")
		else elements.alert.classList.add("hidden")
	}

	// api

	hideSett = () => {
		btn.classList.remove("btn_on")
		container.classList.remove("on")
	}

	getSett = () => {
		return settings
	}

	getFilterCharsIndexes = () => {
		return filter_chars_indexes
	}

	getOffFilter = () => {
		return [new Array(filter_chars.length+1).join("0"), new Array(filter_chars.length+1).join("1")]
	}

	// calls
	zindexUp = (zi) => {
		return APP.document.zindexUp(zi)
	}

	function liveTumblr (new_live) {
		APP.live.liveTumblr(new_live)
	}

	function jsonMake (obj) {
		return APP.common.jsonMake(obj)
	}

	function isObject (o) {
		return APP.common.isObject(o)
	}	

	function reSett (s, a, f) {
		APP.endpoint.reSett(s, a, f)
	}

	function isString (s) {
		return APP.common.isString(s)
	}

	return {
		hideSett: hideSett,
		getSett: getSett,
		getFilterCharsIndexes: getFilterCharsIndexes,
		getOffFilter: getOffFilter
	}
}()
