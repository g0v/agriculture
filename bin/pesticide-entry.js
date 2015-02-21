#!/usr/bin/env node
'use strict';

var RSVP = require('rsvp'),
	Promise = RSVP.Promise,
	all = RSVP.all,
	streamy = require('streamy-data'),
	hp = streamy.util.htmlparser,
	hpu = hp.DomUtils;

var runningAsScript = !module.parent,
	entryPrefix = 'http://pesticide.baphiq.gov.tw/web/Insecticides_MenuItem5_3_UseRange.aspx?id=',
	args;

function _show(p) {
	if (p.then) {
		p.then(function(v) {
			console.log(JSON.stringify(v, null, 2));
		});
	} else {
		console.log(JSON.stringify(p, null, 2));
	}
}

function _textFromElement(elem) {
	var text;
	if (elem && (text = hpu.text(elem).trim())) {
		return text;
	} else {
		return '';
	}
}

function getEntry(id) {
	var url = entryPrefix + id;
	return new Promise(function(resolve, reject) {
		streamy.util.request(url, function(err, res, body) {
			var handler, parser, result;

			if (err) return reject(err);

			result = { id: id.toUpperCase() };
			handler = new hp.DefaultHandler(function(/*err, dom*/) {}, {
				verbose: false, ignoreWhitespace: true
			});
			parser = new hp.Parser(handler);
			parser.parseComplete(body);

			var _loadFromSimpleElement = function (domId, fieldName) {
				var elem = hpu.getElementById(domId, handler.dom);
				result[fieldName] = _textFromElement(elem);
			};

			_loadFromSimpleElement('NomalNameLabel', '普通名稱');
			_loadFromSimpleElement('廠牌名稱Label', '廠牌名稱');
			_loadFromSimpleElement('lblPassDay', '通過日期');

			var grid = hpu.getElementById('GridView1', handler.dom),
				ths = [], usages = result.usages = [], u;
			if (grid && grid.children && grid.children.length > 1) {
				(grid.children.shift().children || []).forEach(function (th) {
					ths.push(_textFromElement(th));
				});
				grid.children.forEach(function (tr) {
					if (!tr.children)
						return;
					u = {};
					for (var i = 0, len = tr.children.length; i < len; i++) {
						u[ths[i]] = _textFromElement(tr.children[i]).replace(/&nbsp;/g, '');
					}
					usages.push(u);
				});
			}

			resolve(result);
		});
	});
}

if (runningAsScript) {
	RSVP.on('error', console.error);
	args = process.argv.slice(2);
	_show(all(args.map(getEntry)));
} else {
	module.exports = getEntry;
}
