var streamy = require('streamy-data'),
	hp = streamy.util.htmlparser,
	hpu = hp.DomUtils;

var pesticideIndexUrl = "http://m.coa.gov.tw/OpenData/PesticideData.aspx",
	pesticideDetailUrl = 
		"http://pesticide.baphiq.gov.tw/web/Insecticides_MenuItem5_3_UseRange.aspx?id=";

var _text0 = function (buffer, dom) {
	if (dom.type === 'text')
		buffer.push(dom.data);
	else if (dom.children)
		dom.children.forEach(function (c) { _text0(buffer, c); });
};

hpu.text = function (dom) { // TODO: remove
	var buffer = [], str;
	_text0(buffer, dom);
	str = buffer.join('');
	return str[str.length - 1] === '\n' ? str : str + '\n';
};

var index = function (options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};
	
	var order = options.order,
		group = options.group != null ? options.group : true;
	
	streamy.util.request(pesticideIndexUrl, function (err, res, body) {
		if (err)
			throw err;
		
		var list = JSON.parse(body),
			result;
		
		list.forEach(function (entry) {
			entry.id = entry['農藥代號'];
			entry.name = entry['中文名稱'];
		});
		
		if (!group) {
			result = list;
		} else {
			var resultMap = {};
			list.forEach(function (entry) {
				var id = entry.id, 
					resultEntry;
				
				resultEntry = resultMap[id] || (resultMap[id] = {
					id: entry.id,
					name: entry.name,
					'農藥代號': entry['農藥代號'],
					'中文名稱': entry['中文名稱'],
					licenses: []
				});
				
				if (!resultEntry['中文名稱'])
					resultEntry.name = resultEntry['中文名稱'] = entry['中文名稱'];
				if (!resultEntry['英文名稱'])
					resultEntry['英文名稱'] = entry['英文名稱'];
				if (!resultEntry['化學成分'])
					resultEntry['化學成分'] = entry['化學成分'];
				
				resultEntry.licenses.push({
					'許可證號': entry['許可證號'],
					'廠牌名稱': entry['廠牌名稱'],
					'國外原製造廠商': entry['國外原製造廠商'],
					'有效期限': entry['有效期限'],
					'廠商名稱': entry['廠商名稱']
				});
			});
			result = [];
			Object.keys(resultMap).forEach(function (k) {
				result.push(resultMap[k]);
			});
		}
		
		if (order == 'id')
			result.sort(function (x, y) {
				return x.id.localeCompare(y.id);
			});
		else if (order == 'name')
			result.sort(function (x, y) {
				return x.name.localeCompare(y.name);
			});
		
		callback(result);
	});
};

var _parseDetailResponse = function (data, body) {
	var handler, parser, grid,
		result = {};
	
	// clone from data
	if (typeof data == 'string') {
		result.id = result['農藥代號'] = data;
	} else {
		Object.keys(data).forEach(function (k) {
			result[k] = data[k];
		});
	}
	
	// parse from response
	handler = new hp.DefaultHandler(function (error, dom) {}, { 
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
	
	//_loadFromSimpleElement('NomalNameLabel', '普通名稱');
	//_loadFromSimpleElement('廠牌名稱Label', '廠牌名稱');
	_loadFromSimpleElement('lblPassDay', '通過日期');
	
	var grid = hpu.getElementById('GridView1', handler.dom),
		ths = [], uses = result.uses = [], u;
	if (grid && grid.children && grid.children.length > 1) {
		(grid.children.shift().children || []).forEach(function (th) {
			ths.push(hpu.text(th).trim());
		});
		grid.children.forEach(function (tr) {
			if (!tr.children)
				return;
			u = {};
			for (var i = 0, len = tr.children.length, text; i < len; i++) {
				u[ths[i]] = hpu.text(tr.children[i]).trim().replace(/&nbsp;/g, '');
			}
			uses.push(u);
		});
	}
	
	return result;
};

var detail = function (data, callback) {
	var id = data == 'string' ? data : data['農藥代號'],
		url = pesticideDetailUrl + id;
	streamy.util.request(url, function (err, res, body) {
		callback(err, !err && _parseDetailResponse(data, body));
	});
};

module.exports = {
	index: index,
	detail: detail
};
