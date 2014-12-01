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

if (!window.Array.isArray) {
	window.Array.isArray = function (arg) {
		return window.Object.prototype.toString.call(arg) === '[object Array]';
	};
}
if (!window.Array.prototype.forEach) {
	// this is an ad hoc polyfill. see:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
	window.Array.prototype.forEach = function (f) {
		for (var i = 0, len = this.length; i < len; i++)
			f(this[i]);
	};
}
if (!window.Element.prototype.remove) {
	window.Element.prototype.remove = function () {
		var p = this.parentElement;
		if (p && p.removeChild)
			p.removeChild(this);
	};
}

function List(array) {
	this._array = array || [];
}
List.prototype.indexBy = function (map) {
	if (typeof map === 'string')
		map = function (item) { return item && item[map]; };
	var index = {};
	for (var i = 0, len = this._array.length, item, val; i < len; i++)
		if ((val = map(item = this._array[i])))
			index[val] = item;
	return index;
};
List.prototype.clone = function () {
	var c = [];
	for (var i = 0, len = this._array.length; i < len; i++)
		c.push(this._array[i]);
	return c;
};
List.prototype.remove = function (item) {
	var i = this._array.indexOf(item),
		b = i > -1;
	if (b)
		this._array.splice(i, 1);
	return b;
};
window.list = function (array) {
	return new List(array);
};

function Set(obj) {
	if (Array.isArray(obj)) {
		this._obj = {};
		for (var i = 0, len = obj.length; i < len; i++)
			this._obj[obj[i]] = true;
	} else {
		this._obj = obj || {};
	}
}
Set.prototype.contains = function (item) {
	return this._obj[item] === true;
};
window.set = function (obj) {
	return new Set(obj);
};

function Map(obj) {
	this._obj = obj || {};
}
Map.prototype.forEach = function (f) {
	var keys = Object.keys(this._obj);
	for (var i = 0, len = keys.length, k; i < len; i++)
		f(k = keys[i], this._obj[k]);
};
window.map = function (obj) {
	return new Map(obj);
};

})(this);



// OO utilty //
(function (window) {

'use strict';

window.inherit = function (X, Y) {
	X.prototype = new Y();
	X.prototype.constructor = X;
};

window.aggregator = function (f, delay) {
	var g = function (data) {
		g._cmds.push(data);
		setTimeout(function () {
			if (!g._cmds.length)
				return;
			var cmds = g._cmds;
			g._cmds = [];
			f(cmds);
		}, delay);
	};
	g._cmds = [];
	return g;
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

