
APP.map = function () {
	const 
		ZOOM_START = 17,
		ZOOM_MAX = 19,
		ZOOM_MIN = 14,
		TIMER_NEWUSER_DELAY = 250,
		TIMER_SHOWBOT_DELAY = 250,
		MAP_ROTATE_ANGLE = 30

	let 
		// объявление зависимостей
		// локальные переменные
		// частные свойства
		map_id = "map",
		map_div = document.getElementById(map_id),
		// map_container = document.getElementById("map_container"),
		map,
		map_me,
		map_they,
		square_lines, 	// коллекция линий квадратов
		redraw_square_lines = true, 
		btns_zoop = document.getElementById("btns_zoop"),
		btns_zoom = document.getElementById("btns_zoom"),
		btns_rotn = document.getElementById("btns_rotn"),
		btns_rota = document.getElementById("btns_rota"),
		btns_rotl = document.getElementById("btns_rotl"),
		btns_rotr = document.getElementById("btns_rotr"),
		storage_sq_lat,	storage_sq_lon, // текущий квадрат (сохраняем чтобы не перерисовывать)
		storage_gps_lat = 0, storage_gps_lon = 0, // сохраненные (текущие) gps координаты пользователя
		storage_rotate_total = 0, // итоговый (текущий) угол поворота карты
		storage_total_azimut = 0,
		map_rotate,
		sims_me_id,
		// частные методы
		resizeMap,
		initMap,
		iconbtnZoomSwitch, // переключатель активности кнопок zoom
		drawSquare, // отрисовка квадрата текущего gps
		iconbtnRotateSwitch,
		// api
		drawMe, // отрисовка метки пользователя
		drawThem, // отрисовка меток других пользователей и ботов
		resetSims,
		clearDraws, // чистка карты от меток
		newDraw, // отрисовка деталей на карте после перезапуска
		// calls
		hideLoading,
		avaBy

	resizeMap = () => {
		let w = document.documentElement.clientWidth,
			h = document.documentElement.clientHeight,
			r = Math.sqrt(4*h*h/9 + w*w/4),
			t = r - 2*h/3,
			l = r - w/2
		map_div.style.width = (2 * r)+"px"
		map_div.style.height = (2 * r)+"px"
		map_div.style.left = -l+"px"
		map_div.style.top = -t+"px"
	}
	resizeMap()
	// событие на изменение размера окна
	window.onresize = () => {
		resizeMap()
	}

	// zoom buttons switch
	iconbtnZoomSwitch = (zoom_value) => {
		if (zoom_value <= ZOOM_MIN) {
			btns_zoop.classList.remove("btn_off")
			btns_zoom.classList.add("btn_off")
		} else if (zoom_value > ZOOM_MIN && zoom_value < ZOOM_MAX) {
			btns_zoop.classList.remove("btn_off")
			btns_zoom.classList.remove("btn_off")
		} else if (zoom_value >= ZOOM_MAX) {
			btns_zoop.classList.add("btn_off")
			btns_zoom.classList.remove("btn_off")
		}
	}

	initMap = () => {

		// zoom init
		let map_zoom = +localStorage.getItem("map_zoom")
		if (!APP.common.isInteger(map_zoom) || map_zoom < ZOOM_MIN || map_zoom > ZOOM_MAX) {
			localStorage.setItem("map_zoom", ZOOM_START)
			map_zoom = ZOOM_START
		}
		iconbtnZoomSwitch(map_zoom)

		// position init
		let map_lat = localStorage.getItem("map_lat"),
			map_lon = localStorage.getItem("map_lon")
		if (APP.common.isLat(map_lat) && APP.common.isLon(map_lon)) {
			// т.е. имеем сохраненные валидные координаты
		} else {
			// т.е. нет валидных сохраненных координат
			map_lat = 57.633127
			map_lon = 39.831698
		}

		map = new ymaps.Map("map", 
			{
				zoom: map_zoom,
				center: [map_lat, map_lon],
				controls: []
			},
			{
				suppressMapOpenBlock: true
			}
		) 

		map.balloon.destroy()
		// map.cursors.push("pointer")
		// map.margin.setDefaultMargin(0) // ?
		// map.behaviors.disable([])
		map.behaviors.disable(["drag", "rightMouseButtonMagnifier", "scrollZoom", "dblClickZoom", "multiTouch", "leftMouseButtonMagnifier"])

		// событие на кнопке zoom_plus
		btns_zoop.addEventListener("click", () => {
			let zoom_value = map.getZoom()
			if (zoom_value < ZOOM_MAX) {
				zoom_value++
				localStorage.setItem("map_zoom", zoom_value)
				map.setZoom(zoom_value, {duration: 200})
			}
			iconbtnZoomSwitch(zoom_value)
		})
		// событие на кнопке zoom_minus
		btns_zoom.addEventListener("click", () => {
			let zoom_value = map.getZoom()
			if (zoom_value > ZOOM_MIN) {
				zoom_value--
				localStorage.setItem("map_zoom", zoom_value)
				map.setZoom(zoom_value, {duration: 200})
			}
			iconbtnZoomSwitch(zoom_value)
		})

		// коллекция линий текущего квадрата
		square_lines = new ymaps.GeoObjectCollection({}, {
			strokeColor: "#000000",
			strokeOpacity: 0.5,
			strokeWidth: 2,
			strokeStyle: "2 3"
		})
		// map.geoObjects.add(square_lines)

		// map_rotate init - угол поворота карты
		map_rotate = localStorage.getItem("map_rotate") == "false" ? false : true
		iconbtnRotateSwitch()

		btns_rotn.addEventListener("click", () => {
			map_rotate = false
			localStorage.setItem("map_rotate", false)
			storage_rotate_total = 0
			iconbtnRotateSwitch()
		})
		btns_rota.addEventListener("click", () => {
			map_rotate = true
			localStorage.setItem("map_rotate", true)
			iconbtnRotateSwitch()
		})
		// обработка действия кнопки поворот карты по часовой стрелке
		btns_rotl.addEventListener("click", () => {
			let total_per_angle = storage_rotate_total/MAP_ROTATE_ANGLE
			map_rotate = false
			localStorage.setItem("map_rotate", false)
			if (storage_rotate_total >= 0) {
				if (APP.common.isInteger(total_per_angle)) storage_rotate_total += MAP_ROTATE_ANGLE
				else storage_rotate_total = Math.ceil(total_per_angle)*MAP_ROTATE_ANGLE
			} else {
				if (APP.common.isInteger(total_per_angle)) storage_rotate_total += MAP_ROTATE_ANGLE
				else storage_rotate_total = Math.ceil(total_per_angle)*MAP_ROTATE_ANGLE
			}
			iconbtnRotateSwitch()
		})
		// обработка действия кнопки поворот карты против часовой стрелки
		btns_rotr.addEventListener("click", () => {
			let total_per_angle = storage_rotate_total/MAP_ROTATE_ANGLE
			map_rotate = false
			localStorage.setItem("map_rotate", false)
			if (storage_rotate_total >= 0) {
				if (APP.common.isInteger(total_per_angle)) storage_rotate_total -= MAP_ROTATE_ANGLE
				else storage_rotate_total = Math.floor(total_per_angle)*MAP_ROTATE_ANGLE
			} else {
				if (APP.common.isInteger(total_per_angle)) storage_rotate_total -= MAP_ROTATE_ANGLE
				else storage_rotate_total = Math.floor(total_per_angle)*MAP_ROTATE_ANGLE
			}
			iconbtnRotateSwitch()
		})

		hideLoading()

	}
		
	iconbtnRotateSwitch = () => {
		let btn_auto_azimut
		if (map_rotate == true) {
			btns_rotn.classList.remove("btn_on")
			btns_rota.classList.add("btn_on")
			btn_auto_azimut = 0
		} else {
			btns_rotn.classList.add("btn_on")
			btns_rota.classList.remove("btn_on")
			btn_auto_azimut = storage_rotate_total + storage_total_azimut // добавляем к азимуту поворот карты, чтобы на кнопку вывести направление с учетом поворота карты ! TODO нужно дополнительно протестировать, т.к. скорее подбором и интуитивно эта строка написана; нужно проверить на разных storage_rotate_total +/-
		}	
		map_div.style.transform = `rotate(${storage_rotate_total}deg)`
		btns_rotn.style.transform = `rotate(${storage_rotate_total}deg)`
		btns_rota.style.transform = `rotate(${btn_auto_azimut}deg)`
	}

	// % Lat = 157.6198 -> 15761
	// % Lon = 9.8554 -> 985 - >984
	// % Square = [15761,984]
	drawSquare = (lat, lon) => {
		let sq_lat = Math.floor(lat*100),
			sq_lon = Math.floor(lon*100),
			lat_dash = 0.001,
			lon_dash = 2*lat_dash,
			// points: b - bottom, t - top, l - left, r - right
			t_lat, b_lat, l_lon, r_lon
		sq_lon = sq_lon % 2 == 0 ? sq_lon : sq_lon - 1
		// storage_sq_lat и storage_sq_lon - переменные модуля для хранения текущего квадрата
		// если квадрат не изменился, мы его не перерисовываем
		if (redraw_square_lines || sq_lat != storage_sq_lat || sq_lon != storage_sq_lon) {
			storage_sq_lat = sq_lat
			storage_sq_lon = sq_lon
			//
			b_lat = sq_lat/100
			t_lat = sq_lat/100 + 0.01
			l_lon = sq_lon/100
			r_lon = sq_lon/100 + 0.02
			// TODO lon на границе 0 180 -180
			// перерисовываем квадрат
			square_lines.removeAll()
			square_lines.add(new ymaps.Polyline([[b_lat, l_lon - lon_dash],[b_lat, r_lon + lon_dash]]))
			square_lines.add(new ymaps.Polyline([[t_lat, l_lon - lon_dash],[t_lat, r_lon + lon_dash]]))
			square_lines.add(new ymaps.Polyline([[b_lat - lat_dash, l_lon],[t_lat + lat_dash, l_lon]]))
			square_lines.add(new ymaps.Polyline([[b_lat - lat_dash, r_lon],[t_lat + lat_dash, r_lon]]))
			if (redraw_square_lines) {
				map.geoObjects.add(square_lines)
				redraw_square_lines = false
			}
		}
	}

	drawMe = (gps_lat, gps_lon, ls_map) => {
		let lat = gps_lat - storage_gps_lat, 
			long = gps_lon - storage_gps_lon,
			azimut,
			rotate,
			count_360,
			full_rounds_length,
			rotate_single,
			user // текущая метка пользователя

		if (!isLat(gps_lat) || !isLon(gps_lon)) return // bad args

		// переписываем координаты
		if (ls_map == true) {
			localStorage.setItem("map_lat", gps_lat)
			localStorage.setItem("map_lon", gps_lon)
		}
		//
		storage_gps_lat = gps_lat
		storage_gps_lon = gps_lon


		// вычисляем азимут направления
		if (lat == 0 && long == 0) {
			azimut = false
		} else if (lat > 0 && long == 0) {
			azimut = 0
		} else if (lat < 0 && long == 0) {
			azimut = -180
		} else if (lat == 0 && long > 0) {
			azimut = 90
		} else if (lat == 0 && long < 0) {
			azimut = -90
		} else if (lat > 0 && long > 0) {
			azimut = Math.atan(Math.abs(long/(2*lat))) * 180/Math.PI
		} else if (lat > 0 && long < 0) {
			azimut = -1 * Math.atan(Math.abs(long/(2*lat))) * 180/Math.PI
		} else if (lat < 0 && long > 0) {
			azimut = 180 - Math.atan(Math.abs(long/(2*lat))) * 180/Math.PI
		} else if (lat < 0 && long < 0) {
			azimut = Math.atan(Math.abs(long/(2*lat))) * 180/Math.PI - 180
		}
		if (azimut) storage_total_azimut = azimut

		// поворачиваем карту
		if (azimut && map_rotate) {
			// азимут - направление движения относительно сервера (посчитан может быть всегда, равен от -180 до 180)
			// карту поворачиваем в противоположном направлении на тот же градус, чтобы двигаться вверх по ней
			rotate = -1 * Math.round(azimut)
			// если поворачивать карту в одну сторону, то она несколько раз обернется
			// нужно считать суммарный угол поворота на каждом шаге
			if (storage_rotate_total >= 0) {
				// на данный момент карта закручена по часовой стрелке
				count_360 = Math.floor(storage_rotate_total/360)
				full_rounds_length = count_360 * 360
				rotate_single = storage_rotate_total - full_rounds_length
				if (rotate >= 0) {
					storage_rotate_total = rotate + full_rounds_length
				} else {
					if (Math.abs(rotate) + rotate_single < 180) {
						storage_rotate_total = rotate + full_rounds_length
					} else {
						// чтобы карта не крутанулась, будем поврачивать ее в ближайшую к новому направлению сторону
						storage_rotate_total = 360 + rotate + full_rounds_length // rotate < 0, поэтому будет вычитание, а затем поворот по меньшей дуге
					}
				}
			} else {
				// на данный момент карта закручена против часовой стрелки
				count_360 = Math.floor(Math.abs(storage_rotate_total)/360) // количество оборотов положительное
				full_rounds_length = count_360 * (-360) // величина всех полных оборотов (отрицательная величина)
				rotate_single = storage_rotate_total - full_rounds_length // реальный поворот (отрицательная величина); full_rounds_length < 0, поэтому значение будет прибавляться к отрицательному storage_rotate_total и убавлять его
				if (rotate <= 0) {
					storage_rotate_total = rotate + full_rounds_length // rotate будет меньше 180, поэтому просто заменяем старый rotate_single на новый rotate
				} else {
					if (Math.abs(rotate_single) + rotate < 180) {
						storage_rotate_total = rotate + full_rounds_length
					} else {
						storage_rotate_total = -360 + rotate + full_rounds_length
					}
				}
			}

			// map_div.style.transform = `rotate(${storage_rotate_total}deg)`
			// btns_rotn.style.transform = `rotate(${rotate}deg)`
		} else {
			// btns_rota.style.transform = `rotate(${azimut}deg)`
		}
		iconbtnRotateSwitch()

		drawSquare(gps_lat, gps_lon) // перерисовываем квадрат если изменился

		// user ava
		user = new ymaps.Placemark([gps_lat, gps_lon], 
			{
				// hintContent: false,
			},
			{
				iconLayout: "default#image",
				iconImageHref: "img/avas_sprite.png",
				iconImageClipRect: avaBy(1, 4),
				iconImageSize: [20, 20],
				iconImageOffset: [-10, -10],
				zIndex: 106
				// iconImageSize: [12, 12],
				// iconImageOffset: [-6, -6],
				// iconImageSize: [18, 18],
				// iconImageOffset: [-9, -9],
				// zIndex: 100
			}
		)
		if (map_me != null) map.geoObjects.remove(map_me)
		map_me = user

		setTimeout(function newUser() {
			map.geoObjects.add(user)
			// user.geometry.setCoordinates([gps_lat, gps_lon])
			map.setCenter([gps_lat, gps_lon], map.getZoom(), {duration: 500})
		}, TIMER_NEWUSER_DELAY)

		// событие по клику на метке
		user.events.add(["click"], () => {
			// console.log("help_me")
			liveTumblr("help_me")
		})

	}

	clearDraws = () => {
		if (map != null && map.geoObjects != null) map.geoObjects.removeAll()
		// if (map_me != null) map.geoObjects.remove(map_me)
		// if (map_they != null) map.geoObjects.remove(map_they)
		map_me = null
		map_they = null
	}

	/**
	 * Восстановление деталей на карте
	 * в связи с жесткой чисткой clearDraws
	*/
	newDraw = () => {
		redraw_square_lines = true
	}

	drawThem = (json, is_sims) => {
		if (json == "nothing") return

		let msg_needs = [], 
			they = new ymaps.ObjectManager({
				clusterize: false,
				clusterDisableClickZoom: true
				// clusterize: true,
				// clusterDisableClickZoom: true,
				// clusterHasBalloon: false
				// clusterMinClusterSize: 3
			}),
			sims_ct = 0,
			sims_me_num = 0,
			sims_me_obj,
			filter_chars_indexes = getFilterCharsIndexes(),
			sett_obj = getSett(),
			sett_ind = filter_chars_indexes[sett_obj.sex + sett_obj.age],
			off_filters = getOffFilter()


		they.objects.options.set("zIndex", 105)
		they.objects.options.set("iconLayout", "default#image") // default#imageWithContent
		they.objects.options.set("iconImageHref", "img/avas_sprite.png")
		they.objects.options.set("iconImageClipRect", avaBy(2, 6))
		they.objects.options.set("iconImageSize", [18, 18])
		they.objects.options.set("iconImageOffset", [-9, -9])
		// they.objects.options.set("iconImageSize", [10, 10])
		// they.objects.options.set("iconImageOffset", [-5, -5])
		// they.clusters.options.set("zIndex", 104)
		// // they.clusters.options.set("clusterIconLayout", "default#image")
		// they.clusters.options.set("clusterIconLayout", "cluster#icon")
		// they.clusters.options.set("clusterIconContentLayout", "cluster#iconContent")
		// they.clusters.options.set("clusterIconImageHref", "img/avas_sprite.png")
		// they.clusters.options.set("clusterIconImageClipRect", avaBy(4,2))
		// they.clusters.options.set("clusterIconImageSize", [16, 16])
		// they.clusters.options.set("clusterIconImageOffset", [-8, -8])

		if (map_they != null) map.geoObjects.remove(map_they)
		map_they = they

		they.add(json)

		if (is_sims == true) {
			if (sims_me_id == null) {
				// считаем количество неботов в sims
				they.objects.each((object) => {
					if (object.properties.s != "b") {
						sims_ct++
					}
				})
				// получаем случайный sim и берем его id и координаты
				sims_me_num = randomInt(1, sims_ct)
				sims_ct = 0
				they.objects.each((object) => {
					if (object.properties.s != "b") {
						sims_ct++
						if (sims_ct == sims_me_num) {
							sims_me_id = object.id
						}
					}
				})				
			}
			sims_me_obj = they.objects.getById(sims_me_id)
			drawMe(sims_me_obj.geometry.coordinates[0], sims_me_obj.geometry.coordinates[1], false)
			// console.log(sims_me_obj)
			they.remove([sims_me_id])
		} else {
			they.remove([getKeyId()]) // удаляем пользователя по id
		}		

		// удаление лишних объектов
		they.objects.each((object) => {
			if (sett_obj.sex == "n" || sett_obj.age == "n") {
				if (object.properties.s != "b" && (object.properties.s != "n" || object.properties.a != "n")) they.remove([object.id])
			} else {
				// если есть фильтр у объекта (в т.ч. у бота)
				if (object.properties.f != "n" && object.properties.f != off_filters[0] && object.properties.f != off_filters[1]) {
					if (object.properties.f.charAt(sett_ind) != 1) they.remove([object.id])	
				}
				// если это не бот, то проверяем фильтр пользователя (подходит ли объект)
				if (sett_obj.filter_str != "n" && sett_obj.filter_str != off_filters[0] && sett_obj.filter_str != off_filters[1]
					&& object.properties.s != "b" && sett_obj.filter[`${object.properties.s}${object.properties.a}`] != true) they.remove([object.id])
			}
		})

		// обработка ботов 
		they.objects.each((object) => {
			if (object.properties.s == "b") {
				they.objects.setObjectOptions(object.id, {
					iconImageHref: `img/bots/${object.properties.p}.png`,
					iconImageClipRect: null,
					iconImageSize: [24, 24],
					iconImageOffset: [-12, -12]
					// iconImageSize: [18, 18],
					// iconImageOffset: [-9, -9]
				})
				if (!isInMsg(object.properties.m)) msg_needs.push(object.properties.m)
			} else if (object.properties.s == "n" || object.properties.a == "n") {
				they.objects.setObjectOptions(object.id, {
					iconImageSize: [16, 16],
					iconImageOffset: [-8, -8]
				})
			} else if (object.properties.s == "f") {
				they.objects.setObjectOptions(object.id, {
					iconImageClipRect: avaBy(2, 5)
				})				
			} else if (object.properties.s == "m") {
				they.objects.setObjectOptions(object.id, {
					iconImageClipRect: avaBy(2, 4)
				})				
			}
		})

		if (msg_needs.length > 0) getMsg(msg_needs)

		// перекраска объектов
		// they.objects.each((object) => {
		// 	if (object.properties.s == "f") 
		// 		they.objects.setObjectOptions(object.id, {
		// 			iconImageClipRect: avaBy(2, 5)
		// 		})
		// 	if (object.properties.s == "m") 
		// 		they.objects.setObjectOptions(object.id, {
		// 			iconImageClipRect: avaBy(2, 4)
		// 		})
		// })

		// // фильтрация объектов
		// they.setFilter(function (object) {
		// 	return object.properties.age < 20
		// })

		// событие по клику на метке
		they.objects.events.add(["click"], (e) => {
			let objectId = e.get("objectId"),
				object = they.objects.getById(objectId)
			setTimeout(function() {
				// задержка необходима, чтобы ведущий не перекрыл метку бота - тогда сработает также событие закрытия
				if (object.properties.s == "b") botLiveTumblr(object.properties.m)
				else liveTumblr("help_them")
			}, TIMER_SHOWBOT_DELAY)
		})
		
		setTimeout(function newUser() {
			map.geoObjects.add(they)
		}, TIMER_NEWUSER_DELAY)		

	}

	resetSims = () => {
		sims_me_id = null
	}

	// init
	ymaps.ready(initMap)

	// map calls
	hideLoading = () => APP.kernel.hideLoading()
	avaBy = (col,row) => APP.common.avaBy(col,row)

	function isLat (it) {
		return APP.common.isLat(it)
	} 
	
	function isLon (it) {
		return APP.common.isLon(it)
	}

	function randomInt (min, max) {
		return APP.common.randomInt(min, max)
	}

	function getKeyId () {
		return APP.endpoint.getKeyId()
	}

	function isInMsg (id) {
		return APP.live.isInMsg(id)
	}

	function liveTumblr (new_live) {
		APP.live.liveTumblr(new_live)
	}

	function botLiveTumblr (new_bot_msg) {
		APP.live.botLiveTumblr(new_bot_msg)
	}

	function getMsg (msg_needs) {
		APP.endpoint.getMsg(msg_needs)
	}

	function getFilterCharsIndexes () {
		return APP.sett.getFilterCharsIndexes()
	}

	function getSett () {
		return APP.sett.getSett()
	}

	function getOffFilter () {
		return APP.sett.getOffFilter()
	}
	
	// map api
	return {
		drawMe: drawMe,
		drawThem: drawThem,
		resetSims: resetSims,
		clearDraws: clearDraws,
		newDraw: newDraw
	}

}()
