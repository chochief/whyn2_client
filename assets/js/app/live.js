
APP.live = function () {

	const
		// VALID_NEWSBLOCK_TYPES = ["header", "lead", "text"],
		VALID_NEWSBLOCK_TYPES = { header:true, lead:true, text:true },
		NEWSBLOCK_TYPE_DEFAULT = "text",
		NEWSBLOCK_TEXT_DEFAULT = "...",
		LIVE_TUMBLR_DELAY = 100

	let 
		// объявление зависимостей
		// локальные переменные
		live_container = document.getElementById("live_container"),
		news_spoiler = document.getElementById("news_spoiler"),
		news_pers = live_container.querySelector(".news__pers"), // картинка ведущего
		news_pers_block = news_pers.parentElement, // блок с ведущим
		news_spoiler_text = news_spoiler.querySelector(".spoiler__text"),
		// news_content = live_container.querySelector(".news__content"), // контейнер новости
		news_content = document.getElementById("news__content"), // контейнер новости
		news_pages = news_content.querySelector(".news__pages"), // контейнер для всех страниц новости
		news_pers_page = news_content.querySelector(".news__pers-page"), // контейнер для страницы ссылок на новости
		news_btn_block = news_content.querySelector(".news__btn-block"), // блок с кнопками
		// частные свойства
		news_number = -1, // номер текущей новости - если эфир восстанавливается, то будет новость 0 (т.е. +1 -> 0, т.к. live_next)
		empty_live, // пусто в эфире
		content, // alerts - массив с сообщениями и helps - массив с эфиром помощи
		content_id , // id контента
		live_nm,
		live_id,
		live = {}, // прямой эфир
		live_re, // live copy
		back,
		back_num,
		msg = {}, // сообщения ботов
		// частные методы
		// api
		hideNews,
		hideLive,
		liveNm,
		liveId,
		isInMsg,
		botLiveTumblr,
		liveTumblr,
		getContentId,
		setMsg,
		setContent,
		setLive,
		// calls
		zindexUp

	// init
	empty_live = {
		desc: "empty_live",
		news: [
			{
				news_id: "empty_live",
				pers: "empty_live",
				spoiler: "Пусто в эфире!",
				pages: [
					{
						content: [
							{
								type: "header",
								text: "Пусто в эфире!"
							},
							{
								type: "text",
								text: "По какой-то причине эфир пуст. Есть какие-то проблемы..."
							}
						]
					}
				]
			}
		]
	}

	initNmIds()

	// private
	live_container.addEventListener("click", (e) => {
		e.preventDefault()
		e.stopPropagation()
		let el = e.target,
			zi = zindexUp(news_content.style.zIndex)

		news_content.style.zIndex = zi
		live_container.style.zIndex = zi + 1

		if (el.classList.contains("news__pers")) {
			tumbleNews() // toggleNews()
		}
	})

	news_spoiler.addEventListener("click", () => {
		tumbleNews() // toggleNews()
	})

	news_content.addEventListener("click", (e) => {
		newsContentClick(e)
	})

	news_content.addEventListener("touchstart", (e) => {
		e.preventDefault()
		newsContentClick(e)
	})

	function newsContentClick (e) {
		let el = e.target,
			zi = zindexUp(news_content.style.zIndex)

		news_content.style.zIndex = zi
		live_container.style.zIndex = zi + 1

		if (el.classList.contains("close__btn")) {
			tumbleNews() // toggleNews()
		}
		if (el.classList.contains("news__btn_num")) pageTumblr(el)
		if (el.classList.contains("news__pers-ava-img")) loadNextNews(+el.dataset.news, true)
	}

	// close and restore live
	function tumbleNews () {
		if (news_content.classList.contains("off")) toggleNews() // открываем новость
		else {
			// закрываем новость
			toggleNews()
			// проверяем и восстанавливаем live
			setTimeout(function() {
				if (back != null) {
					live = live_re
					// live = back
					back = null
					news_number = back_num
					back_num = null
					liveTumblr("live_this")			
				}
			}, LIVE_TUMBLR_DELAY)
		}
	}

	// переключатель страниц новости
	function pageTumblr (el) {
		let num = el.dataset.num,
			pages = news_pages.children,
			page_btns = news_btn_block.children
		// переключаем кнопки страниц
		for (let i = 0; i < page_btns.length; i++) {
			if (page_btns[i].dataset.num == num) page_btns[i].classList.add("news__btn_on")
			else page_btns[i].classList.remove("news__btn_on")
		}
		// el.classList.add("news__btn_on")
		// переключаем страницы
		for (let i = 0; i < pages.length; i++) {
			if (pages[i].dataset.num == num) pages[i].classList.remove("hidden")
			else pages[i].classList.add("hidden")
		}
	}

	function toggleNews() {
		if (news_content.classList.contains("off")) {
			news_content.classList.remove("off")
			news_pers.classList.add("on")
			news_pers_block.classList.add("on")
			news_spoiler.classList.add("off")
		} else {
			news_content.classList.add("off")
			news_pers.classList.remove("on")
			news_pers_block.classList.remove("on")
			news_spoiler.classList.remove("off")
		}
	}

	function loadNextNews(news_num, show_news) {
		let news, // новая текущая новость
			page_content = "",
			btn_block = "",
			news_number_tmp, // временная переменная для новой новости, пока нет решения окончательного менять новость
			was_opened = false
		// проверки live - объекта эфира
		if (live == null || live.news == null || !Array.isArray(live.news) || live.news.length == 0) return
		// проверки до смены номера новости
		if (news_num == "first") news_number_tmp = 0
		else if (news_num == "next") news_number_tmp = news_number + 1
		else if (news_num == "this") news_number_tmp = news_number
		else if (APP.common.isInteger(news_num)) news_number_tmp = news_num
		if (news_number_tmp >= live.news.length) news_number_tmp = 0
		if (live.news[news_number_tmp] == null) return // TODO что если среди новостей null
		news = live.news[news_number_tmp]
		// проверки новости - чтобы не вылезало сломанных новостей
		// TODO проверки и безопасность
		if (news.pers == null || news.pers == "") return
		if (news.spoiler == null) news.spoiler == ""
		if (news.pages == null || !Array.isArray(news.pages) || news.pages.length == 0) return
		// переключаем новость
		news_number = news_number_tmp // меняем номер (свойство модуля)
		// поднимаем окно с эфиром
		live_container.style.zIndex = zindexUp(live_container.style.zIndex)
		// выключаем эфир
		if (!news_content.classList.contains("off")) {
			was_opened = true
			toggleNews() // закрываем новость если открыта
		}
		// if (!live_container.classList.contains("off")) live_container.classList.add("off") // убираем ведущего, если он показан
		// news_spoiler.classList.add("off")
		// обновляем новость
		// обновляем ведущего
		if (live.type != null && live.type == "msg") {
			news_pers.src = `../img/bots/${news.pers}`
			news_pers.classList.add("bot")
		} else {
			news_pers.src = `../img/live/${news.pers}`
			news_pers.classList.remove("bot")
		} 
		if (news.pers.slice(-3) == "jpg") news_pers.classList.add("jpg")
		else news_pers.classList.remove("jpg")
		news_spoiler_text.innerHTML = news.spoiler // обновляем спойлер
		// pages
		for (let i = 0; i < news.pages.length; i++) {
			let content = news.pages[i].content,
				page_hidden = i == 0 ? "" : " hidden",
				btn_on = i == 0 ? " news__btn_on" : ""
			page_content += `<div class="news__page${page_hidden}" data-num="${i}">`
			btn_block += `<div class="news__btn news__btn_num${btn_on}" data-num="${i}">${i+1}</div>`
			if (content != null && Array.isArray(content) && content.length > 0) {
				for (let j = 0; j < content.length; j++) {
					let type = content[j].type,
						text = content[j].text
					if (type != null && text != null) {
						if (!VALID_NEWSBLOCK_TYPES[(type)]) type == NEWSBLOCK_TYPE_DEFAULT
						text = text.trim()
						if (text == "") text = NEWSBLOCK_TEXT_DEFAULT
						// TODO text length
						page_content += `<div class="news__span-block"><span class="news__${type}">${text}</span></div>`
					}
				}
			}
			page_content += `</div>`
		}
		news_pages.innerHTML = page_content
		// подсвечиваем ссылку на активную новость
		persNewsBtnToggle()
		// block btns
		if (news.pages.length < 2) news_btn_block.classList.add("hidden") // news - данная новость
		else news_btn_block.classList.remove("hidden")
		news_btn_block.innerHTML = btn_block
		if (live.news.length < 2) news_pers_page.classList.add("hidden") // здесь все news
		else news_pers_page.classList.remove("hidden")
		// включаем эфир
		// setTimeout(function(){
		if (show_news != "close"  && (show_news === true || was_opened == true)) toggleNews() // открываем новость, если параметр show_news true
		if (live_container.classList.contains("off")) {
			live_container.classList.remove("off") // показываем ведущего
			news_spoiler.classList.remove("off")
		}
		// }, LIVE_TUMBLR_DELAY)
	}

	// загрузка нового (или первого) эфира
	function loadNewLive () {
		persPageLoad() // загрузка страницы со ссылками на все новости эфира
	}

	// загрузка страницы со ссылками на новости
	function persPageLoad () {
		let pers_page_content = "",
			src
		// проверки live - объекта эфира
		if (live == null || live.news == null || !Array.isArray(live.news) || live.news.length == 0) return
		//
		for (let i = 0; i < live.news.length; i++) {
			src = live.news[i].pers == null ? "" : `../img/live/${live.news[i].pers}`
			pers_page_content += `<div class="news__pers-ava news_${i}"><img class="news__pers-ava-img" src="${src}" data-news="${i}"></div>`
		}
		// pers_page_content += `<div class="news__btn news__btn_all" title="Все новости">...</div>`
		if (live.news < 2) news_pers_page.classList.add("hidden")
		else news_pers_page.classList.remove("hidden")
		news_pers_page.innerHTML = pers_page_content
	}

	function persNewsBtnToggle () {
		let pers_btns = news_pers_page.children
		for (let i = 0; i < pers_btns.length; i++) {
			if (pers_btns[i].classList.contains(`news_${news_number}`)) pers_btns[i].classList.add("on")
			else pers_btns[i].classList.remove("on")
		}
	}

	// грузим минимум из localStorage при инициализации
	function initNmIds () {
		let ls_content_id = localStorage.getItem("content_id"),
			ls_live_nm = localStorage.getItem("live_nm"),
			ls_live_id = localStorage.getItem("live_id")

		if (ls_content_id != null && isString(ls_content_id) && ls_content_id.length < 20) content_id = ls_content_id
		if (ls_live_id != null && isString(ls_live_id) && ls_live_id.length < 40) live_id = ls_live_id
		if (ls_live_nm != null && isString(ls_live_nm) && ls_live_nm.length < 40) live_nm = ls_live_nm
	}

	function restoreContent () {
		let ls_content = localStorage.getItem("content"),
			content_obj,
			err = 0

		if (ls_content != null && isString(ls_content) 
			&& content_id != null)
		{
			content_obj = jsonParse(ls_content)
			if (content_obj != false) {
				content = content_obj
			} else err++ 
		} else err++

		// if (err == 0) console.log(`Контент восстановлен.`) // enableHelps()
		// else console.log(`Проблемы с восстановлением контента!`) // problems но показать нечего

		// console.log("restoreContent => content_id", content_id)
		// console.log("restoreContent => content", content)
	}

	function enableHelps () {
		let helpBtns = document.querySelectorAll(".help__btn")
		for (let i = 0; i < helpBtns.length; i++) {
			helpBtns[i].classList.remove("btn_off")
		}
	}

	function restoreLive() {
		let ls_live = localStorage.getItem("live"),
			live_obj,
			err = 0

		if (ls_live != null && isString(ls_live) 
			&& live_nm != null && live_id != null)
		{
			live_obj = jsonParse(ls_live)
			if (live_obj != false) {
				live = live_obj
				live_re = live
			} else err++
		} else err++

		if (err == 0) liveTumblr("live_next") // console.log(`restoreLive => нет ошибок, выводим восстановленный эфир`)
		else liveTumblr("empty_live") // console.log(`Проблемы с восстановлением эфира!`)

		// console.log("restoreLive => live_nm", live_nm)
		// console.log("restoreLive => live_id", live_id)
		// console.log("restoreLive => live", live)

		enableHelps()
	}

	function getHelpNumByName(name) {
		if (content == null || content.hp_base == null || content.hp_base.news == null 
			|| !isArray(content.hp_base.news) || content.hp_base.news.length == 0) return false
		if (name == null || !isString(name)) return false // bad args
		let num = false
		for (let i = 0; i < content.hp_base.news.length; i++) {
			if (content.hp_base.news[i].name != null && content.hp_base.news[i].name == name) {
				num = i
				break
			}
		}
		return num
	}

	// сборка live из lv_fed и lv_reg
	function buildLive (new_live_obj) {
		let fed_news_ct,
			reg_news_ct,
			new_news = []

		// считаем новости
		if (new_live_obj == null || !isObject(new_live_obj)) {
			fed_news_ct = 0
			reg_news_ct = 0
		} else {
			// fed_news_ct
			if (new_live_obj.lv_fed == null || new_live_obj.lv_fed.news == null || !isArray(new_live_obj.lv_fed.news)) fed_news_ct = 0
			else fed_news_ct = new_live_obj.lv_fed.news.length
			// reg_news_ct
			if (new_live_obj.lv_reg == null || new_live_obj.lv_reg.news == null || !isArray(new_live_obj.lv_reg.news)) reg_news_ct = 0
			else reg_news_ct = new_live_obj.lv_reg.news.length
		}

		if (fed_news_ct + reg_news_ct == 0) new_live_obj = "empty"
		else if (fed_news_ct == 0) new_live_obj = { desc_fed: "empty", desc_reg: new_live_obj.lv_reg.desc, news: new_live_obj.lv_reg.news }
		else if (reg_news_ct == 0) new_live_obj = { desc_fed: new_live_obj.lv_fed.desc, desc_reg: "empty", news: new_live_obj.lv_fed.news }
		else if (fed_news_ct >= reg_news_ct) {
			for (let i = 0; i < new_live_obj.lv_fed.news.length; i++) {
				new_news.push(new_live_obj.lv_fed.news[i])
				if (new_live_obj.lv_reg.news[i] != null) new_news.push(new_live_obj.lv_reg.news[i])
			}
			new_live_obj = { desc_fed: new_live_obj.lv_fed.desc, desc_reg: new_live_obj.lv_reg.desc, news: new_news }
		} else if (fed_news_ct < reg_news_ct) {
			for (let i = 0; i < new_live_obj.lv_reg.news.length; i++) {
				if (new_live_obj.lv_fed.news[i] != null) new_news.push(new_live_obj.lv_fed.news[i])
				new_news.push(new_live_obj.lv_reg.news[i])
			}
			new_live_obj = { desc_fed: new_live_obj.lv_fed.desc, desc_reg: new_live_obj.lv_reg.desc, news: new_news }
		}

		return new_live_obj
	}

	// api

	setMsg = (new_msg) => {
		if (new_msg == null || new_msg == "not_found" || !isObject(new_msg)) return

		let key_json,
			err = 0

		for (let key in new_msg) {
			key_json = jsonParse(new_msg[key])
			if (key_json !== false) msg[key] = key_json
		}
		// console.log("msg", msg)
	}

	setContent = (new_content_id, new_content) => {
		if (new_content == "none" || new_content == "nothing") {
			restoreContent()
			return
		}
		if (new_content_id == null || !isString(new_content_id) || new_content_id.length > 19
			|| new_content == null || !isObject(new_content)) return // bad args
		
		let new_content_obj = {}, 
			new_content_str = "",
			key_json,
			err = 0
		
		for (let key in new_content) {
			key_json = jsonParse(new_content[key])
			if (key_json == false) err++
			else new_content_obj[key] = key_json
		}
		
		if (err == 0) {
			// new_content_str = JSON.stringify(new_content_obj)
			new_content_str = jsonMake(new_content_obj)
			if (new_content_str != false) {
				localStorage.setItem("content_id", new_content_id)
				localStorage.setItem("content", new_content_str)
				content_id = new_content_id
				content = new_content_obj
				// console.log("setContent => content_id", content_id)
				// console.log("setContent => content", content)
				return
			} else err++
		}
		if (err > 0) restoreContent()
	}

	setLive = (new_live_nm, new_live_id, new_live) => {
		if (new_live_id == "last") {
			restoreLive()
			return
		}
		if (new_live_id == null || !isString(new_live_nm)
			|| new_live_id == null || !isString(new_live_id) || new_live_id > 40
			|| new_live == null || !isObject(new_live)) return // bad args

		let new_live_obj = {},
			new_live_str = "",
			key_json,
			err = 0

		for (let key in new_live) {
			key_json = jsonParse(new_live[key])
			if (key_json == false) err++
			else new_live_obj[key] = key_json
		}

		new_live_obj = buildLive(new_live_obj)

		if (err == 0) {
			new_live_str = jsonMake(new_live_obj)
			if (new_live_str != false) {
				localStorage.setItem("live_nm", new_live_nm)
				localStorage.setItem("live_id", new_live_id)
				localStorage.setItem("live", new_live_str)
				live_nm = new_live_nm
				live_id = new_live_id
				live = new_live_obj
				live_re = live
				// console.log("setLive => live_nm", live_nm)
				// console.log("setLive => live_id", live_id)
				// console.log("setLive => live", live)
				liveTumblr("live_first")
				enableHelps() // разблокировка кнопок помощи
				return
			} else err++
		}
		if (err > 0) restoreLive()
	}

	isInMsg = (id) => {
		return msg[id] != null
	}

	botLiveTumblr = (new_bot_msg) => {
		if (new_bot_msg == null || msg[new_bot_msg] == null) return // bad arg
		setBack()
		live = msg[new_bot_msg]
		live.type = "msg"		
		loadNextNews("first", true)
	}

	liveTumblr = (new_live) => {
		let show_news = false,
			news_num,
			hp_num = false

		switch (new_live) {
		// case "nothing": // пустой эфир - отобразить новость о том что пусто
		// 	live = nothing_live
		// 	loadNewLive()
		// 	news_num = "first"
		// 	break
		// case "no_changes": // нет изменений - показать следующую новость из имеющихся
		// 	news_num = "next"
		// 	break
		// case "problems": // проблемы со связью и проч. - показать новость о проблемах
		// 	live = problems_live
		// 	loadNewLive()
		// 	news_num = "first"
		// 	show_news = true
		// 	break
		case "live_first": // новый live установлен, ставим первую новость
			loadNewLive()
			news_num = "first"
			break
		case "live_next": // эфир восстановлен из localStorage
			loadNewLive()
			news_num = "next"
			break
		case "live_this":
			loadNewLive()
			news_num = "this"
			show_news = "close"
			break
		case "empty_live":
			// back нечего присваивать
			live = empty_live
			loadNewLive()
			news_num = "first"
			break
		case "whyn_help":
		case "main_help":
		case "nums_help":
		case "help_me":
		case "help_them":
		case "sett_help":
			hp_num = getHelpNumByName(new_live)
			if (hp_num !== false) {
				setBack()
				live = content.hp_base
				news_num = hp_num
				loadNewLive()
				show_news = true
			}
			break
		default: // обновление эфира
			return
			// if (new_live.id == null) return // проверяем что это объект эфира
			// live = new_live
			// loadNewLive()
			// news_num = "first"
			// break
		}
		loadNextNews(news_num, show_news)
	}

	function setBack() {
		if (back != null) return
		back_num = news_number
		back = live
	}

	getContentId = () => {
		return content_id
	}

	liveId = () => {
		return live_id
	}

	liveNm = () => {
		return live_nm
	}

	hideLive = () => {
		if (!live_container.classList.contains("off")) live_container.classList.add("off") // убираем ведущего, если он показан
	}

	hideNews = () => {
		// if (!news_content.classList.contains("off")) toggleNews()
		if (!news_content.classList.contains("off")) {
			// закрываем новость
			toggleNews()
			// проверяем и восстанавливаем live
			setTimeout(function() {
				if (back != null) {
					live = live_re
					// live = back
					back = null
					news_number = back_num
					back_num = null
					liveTumblr("live_this")			
				}
			}, LIVE_TUMBLR_DELAY)
		}
	}

	// calls
	zindexUp = (zi) => {
		return APP.document.zindexUp(zi)
	}

	function jsonParse (str) {
		return APP.common.jsonParse(str)
	}

	function jsonMake (obj) {
		return APP.common.jsonMake(obj)
	}
	
	function isObject (o) {
		return APP.common.isObject(o)
	}

	function isArray (a) {
		return APP.common.isArray(a)
	}

	function isString (s) {
		return APP.common.isString(s)
	}

	return {
		hideNews: hideNews,
		hideLive: hideLive,
		liveNm: liveNm,
		liveId: liveId,
		isInMsg: isInMsg,
		botLiveTumblr: botLiveTumblr,
		liveTumblr: liveTumblr,
		setMsg: setMsg,
		setContent: setContent,
		setLive: setLive,
		getContentId: getContentId
	}
}()
