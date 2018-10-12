
APP.gpsmock = function () {

	const
		MINSPEED = 0,
		MINANGLE = 0,
		MAXANGLE = 360,
		MINLEFT = 1,
		MAXLEFT = 10, // 60,
		LAT1M  = 0.000018, // градусов на 1м
		LONG1M = 0.000009  // градусов на 1м

	let 
		// объявление зависимостей
		// локальные переменные
		timerId,
		// частные свойства
		coords = {
			latitude: 55.76,
			longitude: 37.64
		},
		move = {
			types: [
				{ id: 1, name: "stand", maxspeed: 0 },
				{ id: 2, name: "go", maxspeed: 7 },
				{ id: 3, name: "run", maxspeed: 15 },
				{ id: 4, name: "bike", maxspeed: 30 },
				{ id: 5, name: "bus", maxspeed: 50 },
				{ id: 6, name: "auto", maxspeed: 80 },
				{ id: 7, name: "moto", maxspeed: 120 }
			],
			left: {
				angle: 0,
				speed: 0
			},
			stoped: false,
			angle: 0,
			speed: 0
		},
		gps_pos = 0,
		// частные методы
		gpsON,
		gpsOFF,
		gpsGet,
		toMove,
		leanerMove,
		// calls
		gpsSend,
		msg,
		randomInt,
		moveGps,
		// api
		getUserTrack

	getUserTrack = () => {
		let user_track = [ {lat: 57.633106, lon: 39.831710}, {lat: 57.633060, lon: 39.831713}, {lat: 57.633018, lon: 39.831697}, {lat: 57.632991, lon: 39.831740}, {lat: 57.632978, lon: 39.831815}, {lat: 57.632968, lon: 39.831898}, {lat: 57.632956, lon: 39.831984}, {lat: 57.632948, lon: 39.832062}, {lat: 57.632936, lon: 39.832153}, {lat: 57.632925, lon: 39.832228}, {lat: 57.632916, lon: 39.832300}, {lat: 57.632906, lon: 39.832375}, {lat: 57.632886, lon: 39.832437}, {lat: 57.632854, lon: 39.832493}, {lat: 57.632821, lon: 39.832555}, {lat: 57.632792, lon: 39.832609}, {lat: 57.632758, lon: 39.832673}, {lat: 57.632729, lon: 39.832730}, {lat: 57.632697, lon: 39.832794}, {lat: 57.632663, lon: 39.832842}, {lat: 57.632633, lon: 39.832890}, {lat: 57.632604, lon: 39.832944}, {lat: 57.632577, lon: 39.832998}, {lat: 57.632545, lon: 39.833054}, {lat: 57.632513, lon: 39.833108}, {lat: 57.632487, lon: 39.833156}, {lat: 57.632456, lon: 39.833207}, {lat: 57.632423, lon: 39.833269}, {lat: 57.632398, lon: 39.833320}, {lat: 57.632369, lon: 39.833371}, {lat: 57.632342, lon: 39.833422}, {lat: 57.632306, lon: 39.833481}, {lat: 57.632274, lon: 39.833542}, {lat: 57.632253, lon: 39.833599}, {lat: 57.632234, lon: 39.833663}, {lat: 57.632218, lon: 39.833738}, {lat: 57.632201, lon: 39.833800}, {lat: 57.632244, lon: 39.833845}, {lat: 57.632289, lon: 39.833899}, {lat: 57.632336, lon: 39.833939}, {lat: 57.632374, lon: 39.833982}, {lat: 57.632414, lon: 39.834028}, {lat: 57.632453, lon: 39.834065}, {lat: 57.632489, lon: 39.834111}, {lat: 57.632495, lon: 39.834207}, {lat: 57.632497, lon: 39.834307}, {lat: 57.632500, lon: 39.834419}, {lat: 57.632505, lon: 39.834502}, {lat: 57.632508, lon: 39.834588}, {lat: 57.632510, lon: 39.834666}, {lat: 57.632513, lon: 39.834757}, {lat: 57.632516, lon: 39.834873}, {lat: 57.632523, lon: 39.834972}, {lat: 57.632526, lon: 39.835103}, {lat: 57.632528, lon: 39.835240}, {lat: 57.632533, lon: 39.835353}, {lat: 57.632536, lon: 39.835465}, {lat: 57.632538, lon: 39.835565}, {lat: 57.632545, lon: 39.835664}, {lat: 57.632543, lon: 39.835774}, {lat: 57.632552, lon: 39.835862}, {lat: 57.632509, lon: 39.835935}, {lat: 57.632482, lon: 39.835988}, {lat: 57.632449, lon: 39.836031}, {lat: 57.632420, lon: 39.836088}, {lat: 57.632391, lon: 39.836152}, {lat: 57.632349, lon: 39.836136}, {lat: 57.632319, lon: 39.836061}, {lat: 57.632297, lon: 39.835999}, {lat: 57.632276, lon: 39.835946} ]
		gps_pos++
		if (gps_pos >= user_track.length) gps_pos = 0
		return user_track[gps_pos]
	}

	gpsON = () => {
		console.log("Gpsmock ON now")
		timerId = setInterval(function () {
			if (move.stoped) {
				clearInterval(timerId)
				return
			}
			// toMove()
			leanerMove()
			moveGps()
			gpsSend()
		}, 1000)
		return "ok"
	}

	gpsOFF = () => {
		console.log("Gpsmock OFF now")
		clearInterval(timerId)
		msg()
		return "ok"
	}

	gpsGet = () => {

	}

	toMove = () => {
		let lat_change,
			long_change,
			move_id,
			this_move

		// смена угла (направления)
		if (move.left.angle < MINLEFT) {
			move.left.angle = randomInt(MINLEFT, MAXLEFT)
			move.angle = randomInt(MINANGLE, MAXANGLE) * Math.PI / 180 // получаем угол в радианах
			msg(`angle: ${move.angle}, time: ${move.left.angle}`)
		}
		// смена скорости
		if (move.left.speed < MINLEFT) {
			move.left.speed = randomInt(MINLEFT, MAXLEFT)
			// move_id = randomInt(1, move.types.length)
			move_id = 2
			this_move = move.types.filter( type => type.id == move_id )[0]
			msg(`this_move: ${this_move.name}, time: ${move.left.speed}`)
			move.speed = randomInt(MINSPEED, this_move.maxspeed) * 1000 / 3600
		}
		// движение
		move.left.angle--
		move.left.speed--
		// latitude широта -90..90 Y
		lat_change = move.speed * Math.sin(move.angle) // изменение в метрах, может быть + и -
		coords.latitude += lat_change * LAT1M
		// longitude долгота -180..180 X
		long_change = move.speed * Math.cos(move.angle) // изменение в метрах, может быть + и -
		coords.longitude += long_change * LONG1M
	}

	leanerMove = () => {
		let lat_change,
			long_change

		// только при запуске
		if (move.speed == 0) {
			// move.left.angle = 60
			move.left.speed = 10
			move.angle = randomInt(MINANGLE, MAXANGLE) * Math.PI / 180
			move.speed = 5 * 1000 / 3600 // 5км/ч
		}
		// автовыход через 60 сек.
		if (move.left.speed < 1) move.stoped = true
		// движение
		// move.left.angle--
		move.left.speed--
		// latitude широта -90..90 Y
		lat_change = move.speed * Math.sin(move.angle) // изменение в метрах, может быть + и -
		coords.latitude += lat_change * LAT1M
		// longitude долгота -180..180 X
		long_change = move.speed * Math.cos(move.angle) // изменение в метрах, может быть + и -
		coords.longitude += long_change * LONG1M		
	}

	// gpsmock calls
	gpsSend = () => {
		APP.kernel.gpsUpdate(coords)
	}

	msg = (message) => {
		APP.kernel.msg(message)
	}

	randomInt = (min, max) => {
		return APP.common.randomInt(min, max)
	}

	// moveGps = () => {
	// 	APP.map.moveGps(coords)
	// }

	// gpsmock api
	return {
		on: gpsON,
		off: gpsOFF,
		get: gpsGet,
		getUserTrack: getUserTrack
	}
}()