
// пространство имен приложения whyn.map
let APP = APP || {}

/**
*	Универсальная функция добавления пространства имен
*	если участок пути отстутствует в объекте, он будет создан
* 	если имя уже добавлено, будет возвращена ссылка
*/
APP.namespace = function (ns_string) {
	let parts = ns_string.split("."),
		parent = APP,
		i

	// отбросить начальный префикс – имя глобального объекта
	if (parts[0] === "APP") {
		parts = parts.slice(1)
	}
	
	for (i = 0; i < parts.length; i++) {
		// создать свойство, если оно отсутствует
		if (typeof parent[parts[i]] === "undefined") {
			parent[parts[i]] = {}
		}
		parent = parent[parts[i]]
	}

	return parent
}

/**
*	Задаем пространства всех модулей
*/

APP.namespace("APP.kernel")
APP.namespace("APP.common")
APP.namespace("APP.endpoint")
APP.namespace("APP.map")
APP.namespace("APP.nums")
APP.namespace("APP.sett")
APP.namespace("APP.live")
APP.namespace("APP.document")
APP.namespace("APP.gpsmock")
APP.namespace("APP.run")
