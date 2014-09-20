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
	this._advanced = false;
	
	this.$header = $('header');
	this.$grouper = $('#grouper');
	this.advancedOptions = $('#adv-options');
	
	this.keywordInput = $element.find('.keyword')[0];
	this.submitButton = $element.find('.submit')[0];
	this.advancedOptionsToogleButton = $element.find('.adv-options-toggle-btn')[0];
	
	$element
	.on('click', '.submit', function () {
		self.submit();
	})
	.on('keydown', '.keyword', function (e) {
		if (window.data && e.which == 13)
			self.submit();
	})
	.on('click', '.adv-options-toggle-btn', function () {
		self.openAdvancedOptions(!self._advanced);
	});
};

Form.prototype.submit = function () {
	var advanced = this._advanced,
		input = this.keywordInput.value.trim(),
		keywords = input && input.split(/\s+/),
		query = { keywords: keywords };
	if (advanced) {
		query.grouper = this.$grouper.data('selected');
	}
	this.$element.trigger('query', query);
};

Form.prototype.openAdvancedOptions = function (open) {
	if (this._advanced === open)
		return;
	this._advanced = open;
	this.advancedOptionsToogleButton.innerHTML = open ? '基本' : '進階';
	// TODO: animation
	this.$header[open ? 'addClass' : 'removeClass']('advanced');
};

function getTemplate(selector) {
	return window.Handlebars.compile($(selector).html());
}

var UsageList = function (element) {
	var $element = this.$element = $(element),
		self = this;
	this.templates = {
		container: getTemplate('#container-template'),
		group: getTemplate('#group-template'),
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
	this.groups = {};
	this.keywords = null;
	this.$element[0].innerHTML = '';
};

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

UsageList.prototype._groupListHTML = function (groups) {
	var self = this,
		content = '',
		gsn = 0,
		sn = 0;
	groups.forEach(function (group) {
		var gid = 'g' + (gsn++),
			gcontent = '';
		group.id = gid;
		self.groups[gid] = group;
		group.members.forEach(function (row) {
			var id = 'u' + (sn++);
			_normalizeUsageData(row, id);
			self.results[id] = row;
			gcontent += self._usageHTML(row);
		});
		content += self.templates.group({ id: gid, value: group.value, content: gcontent });
	});
	return this.templates.container({ content: content });
};

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
	return this.templates.container({
		content: this.templates.group({ content: content })
	});
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
		if (k == 'q') {
			var qstr = s.substring(i + 1);
			query.keywords = qstr && qstr.split('+');
		}
	});
	return query.keywords && query;
}

function DisplayOptions(element) {
	var $element = this.$element = $(element);
	
	var tableLayout = false;
	
	$element.on('change', '.toggle-layout-btn', function () {
		window.console.log('hit');
		tableLayout = !tableLayout;
		$('#result')
		[tableLayout ? 'addClass' : 'removeClass']('table-layout')
		[!tableLayout ? 'addClass' : 'removeClass']('card-layout');
	});
}



var _grouper_map = {
	pesticide: '藥劑',
	crop: '作物名稱',
	disease: '病蟲名稱'
};

function start() {
	
	var stateManager = new window.StateManager(encodeURL, decodeURL),
		list = new UsageList('#result'),
		form = new Form('#form'),
		displayOptions = new DisplayOptions('#display-options');
	
	function query(options) {
		var kws = (options && options.keywords) || [],
			keywords = [];
		kws.forEach(function (w) {
			if (w)
				keywords.push(w);
		});
		if (!keywords || !keywords.length) {
			list.clear();
			return;
		}
		
		var filter = multipleKeywordFilter(keywords),
			order = options.order,
			grouper = _grouper_map[options.grouper];
		
		var result = window.search(window.data.usages, filter, order);
		if (grouper)
			result = window.group(result, grouper);
		document.body.classList[result && result.length > 0 ? 'remove' : 'add']('no-result');
		list[grouper ? 'renderGroups' : 'renderItems'](result, keywords);
	}
	
	stateManager.onchangestate = function (state) {
		if (!state)
			return; // TODO: check first page loading scenario
		var keywords = state.keywords ? state.keywords.join(' ') : '';
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
	
	// ad hoc way to enable experimental features
	$(document).on('keydown', function (e) {
		if (e.ctrlKey && e.which == 192) { // '~'
			e.preventDefault();
			$('.experimental').toggleClass('hide');
		}
	});
	
}

// start when DOM is ready
$(start);

})(this);

