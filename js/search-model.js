(function (window) {

function trivialFilter() { return true; }

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

function toString(obj) { return obj != null ? obj.toString() : ''; }

function compareMapped(order, map) {
	return function (x, y) { return order(map(x), map(y)); };
}

function ungroupedSearch(list, filter, order, limit) {
	
	var result = [], 
		item;
	
	for (var i = 0, found = 0, len = list.length; i < len && (!limit || found < limit); i++) {
		item = list[i];
		if (!filter(item))
			continue;
		result.push(item);
		found++;
	}
	
	return order ? result.sort(order) : result;
}

function groupedSearch(list, filter, order, limit, grouper, groupHash, groupOrder) {
	
	if (typeof grouper === 'string')
		grouper = fieldMap(grouper);
	
	groupHash = groupHash || toString;
	groupOrder = groupOrder || defaultCompare;
	if (typeof groupOrder === 'string')
		groupOrder = compareMapped(defaultCompare, fieldMap(groupOrder));
	
	var m = {}, 
		value, hash, group, 
		result = [],
		item;
	
	for (var i = 0, found = 0, len = list.length; i < len && (!limit || found < limit); i++) {
		item = list[i];
		if (!filter(item))
			return;
		
		value = grouper(item);
		hash = groupHash(hash);
		group = m[hash];
		if (!group)
			m[hash] = group = { value: value, members: [] };
		
		group.members.push(item);
	};
	
	Object.keys(m).forEach(function (hash) {
		result.push(group = m[hash]);
		if (order)
			group.members = group.members.sort(order);
	});
	
	return result.sort(compareMapped(groupOrder, fieldMap('value')));
}

window.search = function (list, options) {
	
	options = options || {};
	var filter = options.filter || trivialFilter,
		order = options.order, 
		limit = options.limit,
		grouper = options.grouper,
		groupHash = options.groupHash,
		groupOrder = options.groupOrder;
	
	if (typeof order === 'string')
		order = compareMapped(defaultCompare, fieldMap(order));
	
	return grouper ? 
		groupedSearch(list, filter, order, limit, grouper, groupHash, groupOrder) :
		ungroupedSearch(list, filter, order, limit);
};

})(this);
