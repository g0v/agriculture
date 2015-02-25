'use strict';
/* global require, module, console */
var RSVP = require('rsvp'),
	Promise = RSVP.Promise,
	streamy = require('streamy-data'),
	hp = streamy.util.htmlparser,
	hpu = hp.DomUtils,
	getEntry = require('./pesticide-entry');

var pesticideLicensesUrl = 'http://m.coa.gov.tw/OpenData/PesticideData.aspx';



var downloadLicenses = function () {
	return new Promise(function(resolve, reject) {
		streamy.util.request(pesticideLicensesUrl, function (err, res, body) {
			if (err) return reject(err);
			if (res.statusCode !== 200) return new Error('not OK: ' + res.statusCode);
			return resolve(JSON.parse(body));
		});
	});
};



var buildIndexFromLicenses = function (licenses) {
	// collect id and name from license entries
	var m = {}, id, name;
	licenses.forEach(function (lic) {
		id = lic['農藥代號'];
		name = lic['中文名稱'];
		if (!id) {
			console.log('License entry missing id: ' + lic);
			return;
		}
		if (!name) {
			console.log('License entry missing name: ' + lic);
			return;
		}
		if (m[id] && m[id] != name) {
			console.log('License entry name conflicts: ' + name + ', ' + m[id]);
			return;
		}
		if (id && name)
			m[id] = name;
	});

	// transform into array
	var index = [];
	Object.keys(m).forEach(function (id) {
		index.push({ id: id, name: m[id] });
	});

	// sort by id
	index = index.sort(function (x, y) {
		return x.id.localeCompare(y.id);
	});

	return index;
};



module.exports = {
	download: {
		licenses: downloadLicenses,
		entry: getEntry
	},
	build: {
		indexFromLicenses: buildIndexFromLicenses
	}
};
