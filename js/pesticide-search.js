(function (window) {

'use strict';
var $ = window.jQuery;

function fieldContains(obj, field, keyword) {
	return obj && obj[field] && obj[field].indexOf(keyword) > -1;
}

function multipleKeywordFilter(keywords) {
	return function (item) {
		keywords = keywords || [];
		for (var i = 0, len = keywords.length, k; i < len; i++) {
			k = keywords[i];
			if (!containsKeyword(item, k))
				return false;
		}
		return true;
	};
}

function containsKeyword(item, keyword) {
	var pesticide = window.data.pesticides[item.pesticideId];
	return fieldContains(item, '作物名稱', keyword) ||
		fieldContains(item, '病蟲名稱', keyword) ||
		fieldContains(pesticide, 'name', keyword) ||
		fieldContains(pesticide, 'engName', keyword) ||
		fieldContains(pesticide, 'products', keyword);
}

var Form = function (element) {
	var self = this,
		$element = this.$element = $(element);
	this.keywordInput = $element.find('.keyword')[0];
	this.submitButton = $element.find('.submit')[0];
	
	var submit = function () {
		var keywords = self.keywordInput.value.trim().split(/\s+/);
		$element.trigger('query', {
			keywords: keywords
		});
	};
	
	$element
	.on('click', '.submit', submit)
	.on('keydown', '.keyword', function (e) {
		if (window.data && e.which == 13)
			submit();
	});
};

function getTemplate(selector) {
	return window.Handlebars.compile($(selector).html());
}

var UsageList = function (element) {
	var $element = this.$element = $(element);
	this.templates = {
		container: getTemplate('#container-template'),
		usage: getTemplate('#usage-template')
	};
	$element.on('click', '.toggle-detail-btn', function (e) {
		var $usage = $(e.currentTarget).closest('.usage');
		$usage.toggleClass('open');
		//$usage[0].scrollIntoView(); // TODO: do this manually
	});
};

UsageList.prototype.clear = function () {
	this.$element.empty();
};

// TODO: fix when grouping is ready
/*
UsageList.prototype._groupValueHTML = function (value) {
	return '<div class="group-value">' + value + '</div>';
};

UsageList.prototype._groupHTML = function (group) {
	return '<li class="group">' +  this._groupValueHTML(group.value) + 
		this._usageListHTML(group.members) + '</li>';
};

UsageList.prototype._groupListHTML = function (groups) {
	var html = '<ul class="groups">';
	groups.forEach(function (group) {
		html += this._groupListHTML(group);
	});
	html += '</ul>';
	return html;
};
*/

function _renderHits(html, keywords) {
	keywords = keywords || [];
	for (var i = 0, len = keywords.length, k; i < len; i++) {
		k = keywords[i];
		html = html.replace(new RegExp(k, 'g'), 
			'<span class="hit hit-' + i + '">' + k + '</span>');
	}
	return html;
}

UsageList.prototype._usageHTML = function (row, id, keywords) {
	var item = row.data,
		pesticide = window.data.pesticides[item.pesticideId];
	// TODO: render hit information
	return _renderHits(this.templates.usage({
		id: id,
		'作物': item['作物名稱'],
		'病蟲': item['病蟲名稱'],
		'藥劑': pesticide.name,
		products: pesticide.products.split('#'),
		'劑型': item['劑型'],
		'使用時期': item['使用時期'],
		'安全採收期': item['安全採收期'],
		'核准日期': item['核准日期'],
		'原始登記廠商名稱': item['原始登記廠商名稱'],
		'含量': item['含量'],
		'混合': item['混合'],
		'每公頃每次用量': item['每公頃每次用量'],
		'稀釋倍數': item['稀釋倍數'],
		'施藥間隔': item['施藥間隔'],
		'施用次數': item['施用次數'],
		'施藥方法': item['施藥方法'],
		'注意事項': item['注意事項'],
		'備註': item['備註']
	}), keywords);
};

UsageList.prototype._usageListHTML = function (rows, keywords) {
	var self = this,
		content = '',
		id = 0;
	rows.forEach(function (row) {
		content += self._usageHTML(row, id++, keywords);
	});
	return this.templates.container({ content: content });
};

UsageList.prototype.renderItems = function (rows, keywords) {
	this.clear();
	this.$element.append(this._usageListHTML(rows, keywords));
};

UsageList.prototype.renderGroups = function (groups, keywords) {
	this.clear();
	this.$element.append(this._groupListHTML(groups, keywords));
};

function encodeURL(query) {
	return (!query || !query.keywords) ? '' : '?q=' + query.keywords.join('+');
}

function decodeURL(location) {
	var str = decodeURIComponent(location.search);
	if (!str || !str.length)
		return null;
	
	var query = {},
		i, k;
	str.substring(1).split('&').forEach(function (s) {
		if ((i = s.indexOf('=')) < 1)
			return;
		k = s.substring(0, i);
		if (k == 'q')
			query.keywords = s.substring(i + 1).split('+');
	});
	return query.keywords && query;
}



function start() {
	
	var stateManager = new window.StateManager(encodeURL, decodeURL),
		list = new UsageList('#result'),
		form = new Form('#form');
	
	function query(options) {
		if (!options || !options.keywords || !options.keywords.length) {
			list.clear();
			return;
		}
		
		var keywords = options.keywords,
			filter = multipleKeywordFilter(keywords),
			order = options.order,
			grouper = options.grouper;
		
		var result = window.search(window.data.usages, filter, order);
		// TODO: grouper
		list.renderItems(result, keywords);
	}
	
	stateManager.onchangestate = function (state) {
		var keywords = state.keywords.join(' ');
		if (form.keywordInput.value != keywords)
			form.keywordInput.value = keywords;
		query(state);
	};
	
	form.$element.on('query', function (e, options) {
		stateManager.push(options);
	});
	
	$.ajax('../../data/pesticide/usages-search.json')
	.done(function (data) {
		window.data = data;
		
		// remove loading mark & enable submit
		$('#loading')
		.one($.support.transition.end, function () {
			this.remove();
		})
		.removeClass('in');
		form.submitButton.disabled = false;
		
		// process query params, if any
		stateManager.ready();
	});
	
}

// start when DOM is ready
$(start);

})(this);
