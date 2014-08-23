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
	var $element = this.$element = $(element),
		self = this;
	this.templates = {
		container: getTemplate('#container-template'),
		usage: getTemplate('#usage-template'),
		detail: getTemplate('#usage-detail-template')
	};
	$element.on('click', '.toggle-detail-btn', function (e) {
		var $usage = $(e.currentTarget).closest('.usage');
		self.setOpen($usage[0], !$usage.hasClass('open'));
	});
};

UsageList.prototype.setOpen = function (element, value) {
	var detail = $(element).find('.detail')[0];
	if (value && !detail.firstElementChild) {
		detail.innerHTML = this._detailHTML(this.results[element.id]);
	}
	$(element)[value ? 'addClass' : 'removeClass']('open');
	//$usage[0].scrollIntoView(); // TODO: do this manually
};

UsageList.prototype.clear = function () {
	this.results = {};
	this.keywords = null;
	this.$element[0].innerHTML = '';
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

UsageList.prototype._detailHTML = function (row) {
	return _renderHits(this.templates.detail(row.data), this.keywords);
};

UsageList.prototype._usageHTML = function (row) {
	return _renderHits(this.templates.usage(row.data), this.keywords);
};

function _normalizeUsageData(row, id) {
	row.data.id = id;
	var pesticide = window.data.pesticides[row.data.pesticideId];
	if (pesticide) {
		row.data['藥劑'] = pesticide.name;
		row.data.products = pesticide.products.split('#');
	}
}

UsageList.prototype._usageListHTML = function (rows) {
	var self = this,
		content = '',
		sn = 0;
	rows.forEach(function (row) {
		var id = 'u' + (sn++);
		_normalizeUsageData(row, id);
		self.results[id] = row;
		content += self._usageHTML(row);
	});
	return this.templates.container({ content: content });
};

UsageList.prototype.renderItems = function (rows, keywords) {
	this.clear();
	this.keywords = keywords;
	this.$element[0].innerHTML = this._usageListHTML(rows);
};

UsageList.prototype.renderGroups = function (groups, keywords) {
	this.clear();
	this.keywords = keywords;
	this.$element[0].innerHTML = this._groupListHTML(groups);
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
		document.body.classList[result && result.length > 0 ? 'remove' : 'add']('no-result');
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
