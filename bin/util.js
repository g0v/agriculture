function clone (tar, src) {
	if (!src) {
		src = tar;
		tar = {};
	}
	Object.keys(src).forEach(function (k) {
		tar[k] = src[k];
	});
	return tar;
}

function copyIfAbsent (tar, src, field) {
	var vo, vn;
	if (!tar) throw new Error('Target is missing' + field);
	if (!src) throw new Error('Source is missing' + field);
	vo = tar[field];
	vn = src[field];
	if (!vo)
		tar[field] = vn;
	else if (vo != vn)
		console.warn('Conflict field value: \n' + vo + ', \n' + vn);
}

module.exports = {
	clone: clone,
	copyIfAbsent: copyIfAbsent
};

