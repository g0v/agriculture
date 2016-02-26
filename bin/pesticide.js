'use strict';
/* global require, module, console */
var streamy = require('streamy-data'),
	hp = streamy.util.htmlparser,
	hpu = hp.DomUtils;

var pesticideLicensesUrl = 
	'http://m.coa.gov.tw/OpenData/PesticideData.aspx',
	pesticideEntryUrlPrefix = 
	'http://pesticide.baphiq.gov.tw/web/Insecticides_MenuItem5_3_UseRange.aspx?id=';

var downloadLicenses = function (callback) {
	streamy.util.request(pesticideLicensesUrl, function (err, res, body) {
		if (err)
			throw err;
		
		callback(JSON.parse(body));
	});
};

var _parseEntryResponse = function (data, body) {
	
	console.log('entry ' + data + ' downloaded.');
	
	var handler, parser,
		result = {};
	
	result.id = data;
	
	// parse from response
	handler = new hp.DefaultHandler(function (/*error, dom*/) {}, { 
		verbose: false, ignoreWhitespace: true
	});
	parser = new hp.Parser(handler);
	parser.parseComplete(body);
	
	var _loadFromSimpleElement = function (domId, fieldName) {
		var elem = hpu.getElementById(domId, handler.dom),
			text;
		if (elem && (text = hpu.text(elem).trim()))
			result[fieldName] = text;
	};
	
	_loadFromSimpleElement('NomalNameLabel', '普通名稱');
	_loadFromSimpleElement('廠牌名稱Label', '廠牌名稱');
	_loadFromSimpleElement('lblPassDay', '通過日期');
	
	var grid = hpu.getElementById('GridView1', handler.dom),
		ths = [], usages = result.usages = [], u;
	if (grid && grid.children && grid.children.length > 1) {
		(grid.children.shift().children || []).forEach(function (th) {
			ths.push(hpu.text(th).trim());
		});
		grid.children.forEach(function (tr) {
			if (!tr.children)
				return;
			u = {};
			for (var i = 0, len = tr.children.length; i < len; i++) {
				u[ths[i].replace(/&lt;br\/&gt;/, '')] = hpu.text(tr.children[i]).trim().replace(/&nbsp;/g, '');
			}
			usages.push(u);
		});
	}
	
	return result;
};

var downloadlEntry = function (data, callback) {
	var url = pesticideEntryUrlPrefix + data;
	streamy.util.request(url, function (err, res, body) {
		callback(err, !err && _parseEntryResponse(data, body));
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
		entry: downloadlEntry
	},
	build: {
		indexFromLicenses: buildIndexFromLicenses
	}
};
