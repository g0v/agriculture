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

function normalizeGroupOrder(order) {
	return compareMapped(normalizeOrder(order), fieldMap('value'));
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



var search = window.search = {};

search.filter = function (data, filter) {
	var result = [],
		hit;
	
	data.forEach(function (item) {
		hit = filter ? filter(item) : true;
		if (!hit)
			return;
		result.push({
			data: item,
			hit: hit
		});
	});
	
	return result;
};

search.sort = function (data, ordering) {
	ordering = normalizeSearchOrder(ordering);
	return ordering ? data.sort(ordering) : data;
};

search.group = function (list, grouper, hash) {
	if (typeof grouper === 'string')
		grouper = fieldMap(grouper);
	hash = hash || toString;
	
	var m = {}, 
		value, key, group, 
		result = [];
	
	list.forEach(function (row) {
		value = grouper(row.data);
		key = hash(value);
		group = m[key];
		if (!group)
			result.push(m[key] = group = { value: value, members: [] });
		group.members.push(row);
	});
	
	return result;
};

search.sortGroup = function (data, ordering) {
	ordering = normalizeGroupOrder(ordering);
	return data.sort(ordering);
};



var SearchModel = search.SearchModel = function () {
	this.setOrdering();
	this.setGroupOrdering();
};
window.inherit(SearchModel, window.DataModel);

SearchModel.prototype.enable = function () {
	this._enabled = true;
};

SearchModel.prototype.disable = function () {
	this._enabled = false;
};

SearchModel.prototype.setSource = function (source) {
	this.source = source;
	if (this._enabled)
		this.refilter();
};

SearchModel.prototype.setFilter = function (filter) {
	this.filter = filter;
	if (this._enabled)
		this.refilter();
};

SearchModel.prototype.setOrdering = function (ordering) {
	this.ordering = ordering;
	if (this._enabled)
		this.resort();
};

SearchModel.prototype.setGrouper = function (grouper) {
	this.grouper = grouper;
	if (this._enabled)
		this.regroup();
};

SearchModel.prototype.setGroupOrdering = function (ordering) {
	this.groupOrdering = ordering;
	if (this._enabled)
		this.resortGroup();
};

SearchModel.prototype.refilter = function () {
	if (!this.source || !this.filter)
		return;
	this._filtered = search.filter(this.source, this.filter);
	this.resort();
};

SearchModel.prototype.resort = function () {
	if (!this._filtered)
		return;
	this._sorted = this.ordering ? 
		search.sort(this._filtered, this.ordering) : this._filtered;
	this.regroup();
};

SearchModel.prototype.regroup = function () {
	if (!this._sorted)
		return;
	this._grouped = this.grouper ? 
		search.group(this._sorted, this.grouper) : this._sorted;
	this.resortGroup();
};

SearchModel.prototype.resortGroup = function () {
	if (!this._grouped)
		return;
	var results = this.groupOrdering ? 
		search.sortGroup(this._grouped, this.groupOrdering) : this._grouped;
	this.trigger('results', results);
};



})(this);
