
APP.kernel = function () {

	let
		// объявление зависимостей
		// gps = APP.gps,
		// локальные переменные
		// частные свойства
		loading = document.getElementById("loading"),
		// частные методы
		start,
		gpsUpdate,
		msg,
		hideLoading,
		// внешние вызовы
		gpsMockStart

	// console.log("APP.kernel | started")

	start = () => {
		// gpsMockStart()
			// gps.on()
	}

	gpsUpdate = (coords) => {
		console.log("gpsUpdate in kernel", coords)
	}

	msg = (message) => { console.log(message) }

	hideLoading = () => { loading.classList.add("hidden") }

	// kernel calls
	gpsMockStart = () => {
		APP.gpsmock.on()
	}

	// kernel api
	return {
		start: start,
		gpsUpdate: gpsUpdate,
		msg: msg,
		hideLoading: hideLoading
	}
}()