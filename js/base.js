// menu injection //
(function (window) {

'use strict';

var $ = window.jQuery,
	Handlebars = window.Handlebars;

$(function () {
	var $menuLeftTemplate = $('#menu-left-template'),
		$menuRightTemplate = $('#menu-right-template'),
		headerMenuLeft = $('#header-menu-left')[0],
		headerMenuRight = $('#header-menu-right')[0];
	
	if (headerMenuLeft && $menuLeftTemplate[0])
		headerMenuLeft.innerHTML = Handlebars.compile($menuLeftTemplate.html())();
	
	if (headerMenuRight && $menuRightTemplate[0])
		headerMenuRight.innerHTML = Handlebars.compile($menuRightTemplate.html())();
});

})(this);



// misc //
(function (window) {

'use strict';

var util = window.util = {};

util.createIndex = function (list, map) {
	var index = {};
	for (var i = 0, len = list.length, item, val; i < len; i++)
		if ((val = map(item = list[i])))
			index[val] = item;
	return index;
};

})(this);



// OO utilty //
(function (window) {

'use strict';

window.inherit = function (X, Y) {
	X.prototype = new Y();
	X.prototype.constructor = X;
};

})(this);



// data model //
(function (window) {

'use strict';

function DataModel() {}

DataModel.prototype.on = function (name, handler) {
	if (name && (typeof handler === 'function')) {
		var handlers = this._handlers || (this._handlers = {});
		(handlers[name] || (handlers[name] = [])).push(handler);
	}
	return this;
};

DataModel.prototype.off = function (name, handler) {
	var handlers = this._handlers;
	if (!handlers || !name)
		return this;
	
	if (!handler) {
		delete handlers[name];
		
	} else {
		var hs = handlers[name];
		if (hs) {
			var i = hs.indexOf(handler);
			if (i > -1)
				hs.splice(i, 1);
		}
		if (!hs.length)
			delete handlers[name];
	}
	return this;
};

DataModel.prototype.trigger = function (name, data) {
	var handlers = this._handlers;
	if (!handlers || !name)
		return this;
	
	var hs = handlers[name];
	if (hs) {
		for (var i = 0, len = hs.length, h; i < len; i++) {
			h = hs[i];
			h(data);
		}
	}
	return this;
};

window.DataModel = DataModel;

})(this);

