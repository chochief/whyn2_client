
/**
 * Максимально закрытый модуль
 * для обмена данными с сервером erl
 * Включает функционал tumblr, gps, socket
 * чтобы не делать api-методы общения между модулями
 * TODO нужно закрыть только установку сокет-соединения из консоли
*/

APP.endpoint = function () {
	
	const
		// SOCKET_ADDR = "wss://192.168.237.149:8443/wss", // SOCKET_ADDR = "wss://192.168.237.149:8443/socket"
		SOCKET_ADDR = "wss://whatsyourna.me:8443/wss", // SOCKET_ADDR = "wss://192.168.237.149:8443/socket"
		// TIMER_CHECK_DELAY = 1000,
		TIMER_GPSGO_DELAY = 1000,
		TIMER_SOCKSEND_DELAY = 1000,
		GPSGO_TICK_START = 1,
		GPSGO_TICK_LENGTH = 5

	let
		// объявление зависимостей
		// частные свойства
		sock_addr = SOCKET_ADDR,
		init_state = false,
		socket, // websocket object
		socket_state = 0, // состояние соединения
		key = "", // вместо localStorage храним так
		key_id, // id метки пользователя на карте (чтобы убрать дублирование)
		gps_state = 0, // gps
		gps_starting,		
		gps_wpid,
		timerGpsgo,
		timerSims,
		gps_tick = 1,
		gps_lat, // текущая широта пользователя
		gps_lon, // текущая долгота пользователя
		// timerFocus = null,
		timerCheck = null,
		btn_online = document.getElementById("btns_online"),
		sims_alert = document.getElementById("sims_alert"),
		online = false, // state : sim || online ---> online true || false
		// локальные переменные
		WebSockets = WebSocket,
		// частные методы
		socketOn, // socket
		socketOff,
		socketSend,
		gpsOn,
		gpsOff,
		// api
		tumblr, // тумблер включения
		getKeyId,
		getMsg,
		reSett
		// calls

	// init
	
	btn_online.addEventListener("click", () => {
		if (online != true) online = false
		online = !online
		localStorage.setItem("online", online)
		if (online == true) {
			simsAlertOn("Поиск GPS", false)
			// btn_online.classList.add("btn_on")
			// sims_alert.innerHTML = "Вы ONLINE" // sims_alert.classList.remove("on")
			gpsOn()
		} else {
			simsAlertOn("offline fake", true, false)
			// btn_online.classList.remove("btn_on")
			// sims_alert.innerHTML = "Режим имитации" // sims_alert.classList.add("on")
			simsOn()
		}
	})	

	// private

	function checkOnline () {
		let map_lat = localStorage.getItem("map_lat"),
			map_lon = localStorage.getItem("map_lon"),
			ls_map_valid = (APP.common.isLat(map_lat) && APP.common.isLon(map_lon)) ? true : false,
			ls_online = localStorage.getItem("online")
		ls_online = ls_online == "true" ? true : false
		if (ls_map_valid == false || ls_online == false) {
			online = false
			simsAlertOn("offline fake", true, false)
		} else {
			online = true
			simsAlertOn("Поиск GPS", false)
		}
		localStorage.setItem("online", online)
	}

	function simsAlertOn (text, unlock, state) {
		sims_alert.innerHTML = text
		if (unlock) {
			btn_online.classList.remove("btn_off")
			if (state) btn_online.classList.add("btn_on")
			else btn_online.classList.remove("btn_on")
		}
	}

	socketOn = (re_sock = false) => {
		let sett_obj

		if (socket_state == 1) return
		socket = new WebSockets(sock_addr)
		socket_state = 1

		socket.onopen = function () {
			socket_state = 1
			// console.log("socket opened")

			// gpsOn() // если уже есть, ничего не произойдет | убираем возможную гонку с включение/выключением сокета
			
			sett_obj = getSett()
			if (re_sock == true) socketSend({ route: "gps_init", lat: gps_lat, lon: gps_lon, key: key, live_nm: liveNm(), live_id: liveId() })
			else socketSend({ route: "hello", content_id: getContentId(), sex: sett_obj.sex, age: sett_obj.age, filter: sett_obj.filter_str })

			if (online == false && init_state == false) socketSend({ route: "sims_init", key: key, live_nm: liveNm(), live_id: liveId() })

		}

		socket.onclose = function () {
			init_state = false
			socket_state = 0
			if (!re_sock) gpsOff() // останавливаем gps по умолчанию, кроме случая переподключения к новому сокету
			hideNews() // убираем новость, если открыта
			hideLive() // убираем эфир при разрыве соединения
			// ! нужно показать alert открырый что все закрыто

			// tumblrOFF() // !!! ???

			// if (e.wasClean) {
			// 	APP.common.print(`соединение закрыто чисто`)
			// } else {
			// 	APP.common.print(`обрыв соединения: код - ${e.code}, причина - ${e.reason}`)
			// }
		}

		socket.onmessage = function (e) {
			if (socket_state != 1) return // bad args - обработка сообщений при закрытом сокете
			let response = jsonParse(e.data)
			switch (response.route_response) {
			case "hello_ok":
				// console.log("hello_ok", response.content_id)
				// console.log("hello_ok", response.content)
				setContent(response.content_id, response.content)
					// console.log(JSON.parse(response.content.al_test))
					// console.log(JSON.parse(response.content.hp_base))
					// setContent(response.content)
					// setContent(JSON.parse(response.content.test))
				break
			case "sims_init_ok":
				init_state = true
				// console.log(`sims_init_ok key`, response.key)
				// console.log(`sims_init_ok key_id`, response.key_id)
				// console.log(`sims_init_ok live_nm`, response.live_nm)
				// console.log(`sims_init_ok live_id`, response.live_id)
				// console.log(`sims_init_ok live`, response.live)
				key = response.key // сохраняем ключ
				key_id = response.key_id // сохраняем id для метки пользователя на карте
				setLive(response.live_nm, response.live_id, response.live)
				break
			case "gps_init_ok":
				init_state = true
				// console.log(`gps_init_ok sock_addr`, response.sock_addr)
				// console.log(`gps_init_ok key`, response.key)
				// console.log(`gps_init_ok key_id`, response.key_id)
				// console.log(`gps_init_ok live_nm`, response.live_nm)
				// console.log(`gps_init_ok live_id`, response.live_id)
				// console.log(`gps_init_ok live`, response.live)
				sock_addr = response.sock_addr // обновляем адрес сокета для переподключения - чтобы было не через root_sock_server без перезагрузки страницы
				key = response.key // сохраняем ключ
				key_id = response.key_id // сохраняем id для метки пользователя на карте
				// drawMe(gps_lat, gps_lon, true) // рисуем метку пользователя -> Err в yandexbrowser после обновления страницы в режиме онлайн
				gpsTimerStart() // стартуем таймер отправки gps
				setLive(response.live_nm, response.live_id, response.live)
				break
			case "gps_sock":
				// console.log(`gps_sock`, response.sock_addr)
				sock_addr = response.sock_addr // меняем адрес сокета
				gpsTimerStop() // если выход произошел при переходе границы районов | обычно конечно при установке сокета
				socketOff() // перезапускаем сокет
				socketOn(true) // на socket.onopen отошлется gps_init заново вместо hello
				break
			case "gps_out":
				// console.log(`gps_out`, response)
				// выводим alert что здесь нет whyn
				break
			case "gps_ok":
				// console.log(`gps`, response.gps_sqcache)
				drawThem(response.gps_sqcache, false)
				break
			case "sims_ok":
				// console.log(`sims`, response.sims_cache)
				drawThem(response.sims_cache, true)
				break
			case "msg_ok":
				// console.log("msg_ok", response)
				setMsg(response.msg)
				break
			}
		}

		// выводи alert обрыв связи
		// socket.onerror = function () {
		// 	APP.common.print(`socket ошибка: ${er.message}`)
		// }			
	}

	socketOff = () => {
		// if (socket == null || socket_state == 0) return
		if (socket != null) socket.close()
		socket = null
		socket_state = 0
		init_state = false
	}

	socketSend = (msg) => {
		if (msg == null) return
		let json_str = jsonMake(msg)
		if (json_str == false) return
		if (socket != null && socket.readyState == 1 && socket_state != 0) socket.send(json_str)
		else
			setTimeout(function sockSendRetry () {
				if (socket != null && socket.readyState == 1 && socket_state != 0) socket.send(json_str)
			}, TIMER_SOCKSEND_DELAY)
	}

	//

	// частные методы gps

	gpsOn = () => {

		simsOff()

		if (gps_state == 1) return
		gps_state = 1
		gps_starting = 1

		function gpsInit () {
			if (gps_starting == 1) {
				gps_starting = 0
				simsAlertOn("online", true, true)
				if (init_state == false)
					socketSend({ route: "gps_init", lat: gps_lat, lon: gps_lon, key: key, live_nm: liveNm(), live_id: liveId() })
				else gpsTimerStart()
			}
		}

		function geo_success(position) {
			gps_lat = position.coords.latitude
			gps_lon = position.coords.longitude
			gpsInit()
		}

		function geo_error(err) {
			console.log(err) // APP.common.print(`ошибка определения gps`)
		}

		if (gps_wpid == null) gps_wpid = navigator.geolocation.watchPosition(geo_success, geo_error, {enableHighAccuracy: true})
	}

	gpsOff = () => {
		if (gps_state == 0) return
		gps_state = 0
		init_state = false
		if (gps_wpid != null) navigator.geolocation.clearWatch(gps_wpid)
		gps_wpid = null
		timerGpsgo = APP.common.timerOff(timerGpsgo)
		//
		gps_tick = GPSGO_TICK_START
	}

	// установка таймера для отсылки gps в цикле
	// вызывается из одного места - после прихода socket_addr и key
	function gpsTimerStart() {
		if (timerGpsgo == null) {
			timerGpsgo = setTimeout(function gpsgo () {
				if (gps_tick >= GPSGO_TICK_LENGTH) {
					socketSend({ route: "gps", lat: gps_lat, lon: gps_lon })
					drawMe(gps_lat, gps_lon, true) // отрисовка метки пользователя на карте
					gps_tick = GPSGO_TICK_START
				} else gps_tick++
				timerGpsgo = setTimeout(gpsgo, TIMER_GPSGO_DELAY)
			}, TIMER_GPSGO_DELAY)
		}
	}

	function gpsTimerStop() {
		timerGpsgo = APP.common.timerOff(timerGpsgo)
	}

	// sims

	function simsOn () {
		gpsOff()
		resetSims()
		simsTimerStart()
	}

	function simsOff () {
		simsTimerStop()
	}

	function simsTimerStart() {
		if (timerSims == null) {
			timerSims = setTimeout(function simsgo () {
				if (gps_tick >= GPSGO_TICK_LENGTH) {
					socketSend({ route: "sims" })
					gps_tick = GPSGO_TICK_START
				} else gps_tick++
				timerSims = setTimeout(simsgo, TIMER_GPSGO_DELAY)
			}, TIMER_GPSGO_DELAY)
		}
	}

	function simsTimerStop() {
		timerSims = APP.common.timerOff(timerSims)
	}

	// частные методы tumblr

	function tumblrOFF () {
		socketOff()
		gpsOff()
		simsOff()
		timerCheck = APP.common.timerOff(timerCheck)
		btn_online.classList.add("btn_off")
		sims_alert.classList.remove("on")
		disableHelps()
		clearDraws() // чистка меток на карте
		hideNums(true)
	}	

	function tumblrON () {
		tumblrOFF()
		newDraw()
		sims_alert.classList.add("on")
		checkOnline() // ! устанавливает  переменную online
		socketOn()
		if (online == true) gpsOn()
		else simsOn()
		checkNumsCurrent()

		// if (timerCheck == null) {
		// 	// проверка подключения
		// 	timerCheck = setTimeout(function checkSocket () {
		// 		// if (timerFocus == null && document.hasFocus()) socketOn()
		// 		if (timerFocus == null) socketOn()
		// 		timerCheck = setTimeout(checkSocket, TIMER_CHECK_DELAY)
		// 	}, TIMER_CHECK_DELAY)
		// }
	}

	window.WebSocket = null

	// api

	tumblr = () => {
		tumblrON()
		setVisability()
	}

	function setVisability () {
		let visibilityChange,
			hidden = "hidden"

		if (typeof document.hidden !== "undefined") {
			hidden = "hidden"
			visibilityChange = "visibilitychange"
		} else if (typeof document.msHidden !== "undefined") {
			hidden = "msHidden"
			visibilityChange = "msvisibilitychange"
		} else if (typeof document.webkitHidden !== "undefined") {
			hidden = "webkitHidden"
			visibilityChange = "webkitvisibilitychange"
		}

		if (typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined") {
			console.log("Page Visibility API") // TODO Браузер не поддерживает Page Visibility API
		} else {
			document.addEventListener(visibilityChange, handleVisibilityChange, false)
		}		

		function handleVisibilityChange() {
			if (!document[hidden]) tumblrON() // document.hidden = true либо false
		}
	}

	getKeyId = () => {
		// if (online == true) return key_id
		return key_id
	}

	getMsg = (msg_needs) => {
		if (msg_needs == null || !isArray(msg_needs) || msg_needs.length == 0) return // bad arg
		socketSend({ route: "get_msg", bots: msg_needs })
	}

	reSett = (s, a, f) => {
		socketSend({ route: "re_sett", sex: s, age: a, filter: f })
	}

	// calls

	function checkNumsCurrent () {
		APP.nums.checkNumsCurrent()
	}

	function hideNums (pause) {
		APP.nums.hideNums(pause)
	}

	function getSett () {
		return APP.sett.getSett()
	}

	function drawMe (gps_lat, gps_lon, ls_map) {
		APP.map.drawMe(gps_lat, gps_lon, ls_map)
	}

	function drawThem (json, is_sims) {
		APP.map.drawThem(json, is_sims)
	}

	function resetSims() {
		APP.map.resetSims()
	}

	function clearDraws () {
		APP.map.clearDraws()
	}

	function newDraw () {
		APP.map.newDraw()
	}

	function getContentId () {
		return APP.live.getContentId()
	}

	function liveId () {
		return APP.live.liveId()
	}

	function liveNm () {
		return APP.live.liveNm()
	}

	function setMsg (msg) {
		APP.live.setMsg(msg)
	}

	function setContent (content_id, content) {
		APP.live.setContent(content_id, content)
	}

	function setLive (nm, id, live) {
		APP.live.setLive(nm, id, live)
	}

	function hideLive () {
		APP.live.hideLive()
	}

	function hideNews () {
		APP.live.hideNews()
	}

	function jsonParse (str) {
		return APP.common.jsonParse(str)
	}

	function jsonMake (obj) {
		return APP.common.jsonMake(obj)
	}

	function isArray (it) {
		return APP.common.isArray(it)
	}

	function disableHelps () {
		APP.document.disableHelps()
	}

	return {
		tumblr: tumblr,
		getKeyId: getKeyId,
		getMsg: getMsg,
		reSett: reSett
	}
}()
