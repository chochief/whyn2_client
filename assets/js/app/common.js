
APP.common = function () {
	//
	let 
		// объявление зависимостей
		// локальные переменные
		// частные свойства
		rand,
		// частные методы
		randomInt,
		// calls
		// api
		formatDate,
		print,
		timerOff,
		isInteger,
		isNumeric,
		isObject,
		isArray,
		isString,
		isLat,
		isLon,
		avaBy,
		jsonParse,
		jsonMake

	/**
	 * Возвращает случайное целое
	 * между min и max, включая min и max
	*/
	randomInt = (min, max) => {
		rand = min + Math.random() * (max + 1 - min)
		rand = Math.floor(rand)
		return rand
	}

	formatDate = (date) => {
		let d

		d = [
			"0" + date.getDate(),
			"0" + (date.getMonth() + 1),
			"" + date.getFullYear(),
			"0" + date.getHours(),
			"0" + date.getMinutes(),
			"0" + date.getSeconds()
		]
		
		for (let i = 0; i < d.length; i++) {
			d[i] = d[i].length == 4 ? d[i] : d[i].slice(-2)
		}

		return d.slice(0, 3).join(".") + " " + d.slice(3).join(":")
	}	

	print = (text) => {
		console.log(`${formatDate(new Date())} | ${text}`)
		// console.log(`${new Date()} | ${text}`)
	}

	/**
	 * Обнуляет таймер setTimeout с id = timer_id,
	 * а также обнуляет ссылку на таймер
	*/
	timerOff = (timer_id) => {
		if (timer_id != null) {
			clearTimeout(timer_id)
		}
		return null
	}

	/**
	 * Возвращает true если аргумент целое число, иначе false
	 * -5, 0, 54 -> true
	*/
	isInteger = (num) => {
		return (num ^ 0) === num
	}

	/**
	 * Возвращает true, если тип n - integer, float или строковое число ("123" или "1.23")
	 * возвращает false иначе (в т.ч. для null, true, false, пустой строки)
	*/
	isNumeric = (n) => {
		return !isNaN(parseFloat(n)) && isFinite(n)
	}

	/**
	 * Проверка, является ли аргумент объектом
	*/
	isObject = (o) => {
		let toString = {}.toString
		return toString.call(o).slice(8, -1) == "Object"
	}

	/**
	 * Проверка, является ли аргумент массивом
	*/
	isArray = (o) => {
		// Array.isArray(o) другой вариант
		let toString = {}.toString
		return toString.call(o).slice(8, -1) == "Array"
	}

	/**
	 * Проверка, является ли аргумент строкой
	*/
	isString = (s) => {
		return typeof s == "string"
	}

	/**
	 * ВОзвращает true если lat валидная gps широта
	*/
	isLat = (lat) => {
		return APP.common.isNumeric(lat) && lat > -90 && lat < 90 
	}

	/**
	 * Возвращает true есди lon валидная gps долгота
	*/
	isLon = (lon) => {
		return APP.common.isNumeric(lon) && lon >= -180 && lon <= 180
	}

	/**
	 * Возвращает массив с координатами спрайта avas_sprite.png
	 * col - столбец > 0
	 * row - строка > 0
	 * avaBy(1,1) -> [[0,0],[64,64]]
	 * avaBy(1,2) -> [[0,64],[64,128]]
	 * avaBy(1,3) -> [[0,128],[64,192]]
	 * avaBy(2,1) -> [[64,0],[128,64]]
	 * avaBy(2,3) -> [[64,128],[128,192]]
	 * avaBy(2,4) -> [[64,192],[128,256]]
	*/
	avaBy = (col, row) => {
		let len = 64
		if (!APP.common.isInteger(col) || !APP.common.isInteger(row) || col < 1 || row < 1)
			return []
		return [[(col-1)*len, (row-1)*len],[col*len, row*len]]
	}

	// avaBy = (name) => {
	// 	let named_avas = [],
	// 		col,
	// 		row

	// 	return avaBy(col,row)
	// }

	/**
	 * Возвращает валидный json из строки
	 * либо false если json невалидный
	*/
	jsonParse = (str) => {
		let parsed
		try {
			parsed = JSON.parse(str)
		} catch (e) {
			parsed = false
		}
		return parsed
	}

	/**
	 * Преобразует объект в json-строку
	 * либо возвращает false если это невозможно
	*/
	jsonMake = (obj) => {
		let str
		try {
			str = JSON.stringify(obj)
		} catch (e) {
			str = false
		}
		return str
	}

	return {
		randomInt: randomInt,
		print: print,
		formatDate: formatDate,
		timerOff: timerOff,
		isInteger: isInteger,
		isNumeric: isNumeric,
		isObject: isObject,
		isArray: isArray,
		isString: isString,
		isLat: isLat,
		isLon: isLon,
		avaBy: avaBy,
		jsonParse: jsonParse,
		jsonMake: jsonMake
	}
}()