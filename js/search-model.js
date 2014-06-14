(function (window) {

'use strict';

/* jshint eqnull:true */
function defaultCompare(x, y) {
	// null last
	if (y == null)
		return x == null ? 0 : -1;
	if (x == null)
		return 1;
	if (typeof x === 'number' && typeof y === 'number')
		return x - y;
	return x.toString().localeCompare(y.toString());
}

function fieldMap(fieldname) {
	return function (obj) { return obj && obj[fieldname]; };
}

/* jshint eqnull:true */
function toString(obj) { return obj != null ? obj.toString() : ''; }

function compareMapped(order, map) {
	return function (x, y) { return order(map(x), map(y)); };
}

function normalizeOrder(order) {
	return (typeof order === 'function') ? order : 
		(typeof order === 'string') ? compareMapped(defaultCompare, fieldMap(order)) :
		defaultCompare;
}

function normalizeSearchOrder(order) {
	if (!order)
		return order;
	if (typeof order === 'string') {
		var fieldname = order;
		return compareMapped(defaultCompare, function (row) {
			return row.data && row.data[fieldname];
		});
	} else if (typeof order === 'function')
		return compareMapped(order, fieldMap('data'));
	return null;
}

window.search = function (list, filter, order) {
	order = normalizeSearchOrder(order);
	
	var result = [],
		hit;
	
	list.forEach(function (item) {
		hit = filter ? filter(item) : true;
		if (!hit)
			return;
		result.push({
			data: item,
			hit: hit
		});
	});
	
	return order ? result.sort(order) : result;
};

window.group = function (list, grouper, order, hash) {
	if (typeof grouper === 'string')
		grouper = fieldMap(grouper);
	hash = hash || toString;
	order = normalizeOrder(order);
	
	var m = {}, 
		value, key, group, 
		result = [];
	
	list.forEach(function (row) {
		value = grouper(row.data);
		key = hash(value);
		group = m[key];
		if (!group)
			m[key] = group = { value: value, members: [] };
		group.members.push(row);
	});
	
	return result.sort(order);
};

})(this);
