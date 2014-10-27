(function (window) {

'use strict';
var $ = window.jQuery,
	DataModel = window.DataModel;

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

function getTemplate(selector) {
	return window.Handlebars.compile($(selector).html());
}



// component //
function SearchForm(element, searchModel) {
	var self = this,
		$element = $(element);
	
	this._enabled = true;
	
	this.inputElement = $element.find('.input')[0];
	this.submitButton = $element.find('.submit')[0];
	this.searchModel = searchModel;
	
	$element
	.on('click', '.submit', function () {
		if (self._enabled)
			self.submit();
	})
	.on('keydown', '.input', function (e) {
		if (self._enabled && e.which == 13)
			self.submit();
	});
}

SearchForm.prototype.setKeywords = function (keywords) {
	this.inputElement.value = keywords ? keywords.join(' ') : '';
};

SearchForm.prototype.disable = function () {
	this._enabled = false;
	this.submitButton.disabled = true;
};

SearchForm.prototype.enable = function () {
	this._enabled = true;
	this.submitButton.disabled = false;
};

SearchForm.prototype.submit = function () {
	var input = this.inputElement.value.trim(),
		keywords = input && input.split(/\s+/);
	this.searchModel.setKeywords(keywords);
};

function ResultList(element, searchModel, renderScheme) {
	var $element = this.$element = $(element),
		self = this;
	
	this.templates = {
		container: getTemplate('#container-template'),
		group: getTemplate('#group-template'),
		usage: getTemplate('#usage-template'),
		detail: getTemplate('#usage-detail-template')
	};
	
	// receptor //
	$element.on('click', '.toggle-detail-btn', function (e) {
		var $usage = $(e.currentTarget).closest('.usage');
		self.setOpen($usage[0], !$usage.hasClass('open'));
	});
	
	// actuator //
	searchModel
	.on('results', function (data) {
		var keywords = data.keywords,
			grouper = data.grouper,
			results = data.results;
		// TODO: ad-hoc
		$('body')[results && results.length ? 'removeClass' : 'addClass']('no-result');
		self[grouper ? 'renderGroups' : 'renderItems'](results, keywords);
	})
	.on('clear', function () {
		self.clear();
	});
	
	renderScheme.on('layout', function (layout) {
		$element
		.removeClass('table-layout')
		.removeClass('card-layout')
		.addClass(layout + '-layout');
	});
}

ResultList.prototype.setOpen = function (element, value) {
	var detail = $(element).find('.detail')[0];
	if (value && !detail.firstElementChild) {
		detail.innerHTML = this._detailHTML(this.results[element.id]);
	}
	$(element)[value ? 'addClass' : 'removeClass']('open');
	//$usage[0].scrollIntoView(); // TODO: do this manually
};

ResultList.prototype.clear = function () {
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

ResultList.prototype._detailHTML = function (row) {
	return _renderHits(this.templates.detail(row.data), this.keywords);
};

ResultList.prototype._usageHTML = function (row) {
	return _renderHits(this.templates.usage(row.data), this.keywords);
};

//function _normalizeUsageData(row, id) {
	//row.data.id = id;
	/*
	var pesticide = window.data.pesticides[row.data.pesticideId];
	if (pesticide) {
		row.data['藥劑'] = pesticide.name;
		row.data.products = pesticide.products.split('#');
	}
	*/
//}

ResultList.prototype._groupListHTML = function (groups) {
	var self = this,
		content = '',
		gsn = 0;
	groups.forEach(function (group) {
		var gid = 'g' + (gsn++),
			gcontent = '';
		group.id = gid;
		self.groups[gid] = group;
		group.members.forEach(function (row) {
			//var id = 'u' + (sn++);
			//_normalizeUsageData(row, id);
			self.results[row.data.id] = row;
			gcontent += self._usageHTML(row);
		});
		content += self.templates.group({
			id: gid, 
			value: group.value, 
			content: gcontent
		});
	});
	return this.templates.container({ content: content });
};

ResultList.prototype._ResultListHTML = function (rows) {
	var self = this,
		content = '';
	rows.forEach(function (row) {
		//var id = 'u' + (sn++);
		//_normalizeUsageData(row, id);
		self.results[row.data.id] = row;
		content += self._usageHTML(row);
	});
	return this.templates.container({
		content: this.templates.group({ content: content })
	});
};

ResultList.prototype.renderItems = function (rows, keywords) {
	this.clear();
	this.keywords = keywords;
	this.$element[0].innerHTML = this._ResultListHTML(rows);
};

ResultList.prototype.renderGroups = function (groups, keywords) {
	this.clear();
	this.keywords = keywords;
	this.$element[0].innerHTML = this._groupListHTML(groups);
};



function valueOf(elem) {
	return elem && $(elem).data('value');
}

function OptionGroup(name, element) {
	var self = this,
		selector = '[data-group="' + name + '"]',
		$members = this.$members = $(selector);
	
	this.index = window.util.createIndex($members, valueOf);
	for (var i = 0, len = $members.length, elem; i < len; i++) {
		// jshint eqnull: true
		if ((valueOf(elem = $members[i])) == null) {
			this.nullValueOption = elem;
			break;
		}
	}
	
	$(element || window.document).on('click', selector, function (e) {
		self.trigger('select', valueOf(e.currentTarget));
	});
}
window.inherit(OptionGroup, DataModel);

OptionGroup.prototype.select = function (value) {
	this.$members.removeClass('selected');
	// jshint eqnull: true
	if (value != null)
		$(this.index[value]).addClass('selected');
	else if (this.nullValueOption)
		$(this.nullValueOption).addClass('selected');
};



function SearchOptions(searchModel, renderScheme) {
	var layoutOptions = new OptionGroup('layout'),
		grouperOptions = new OptionGroup('grouper');
	
	// receptor //
	layoutOptions.on('select', function (value) {
		renderScheme.setLayout(value);
	});
	
	grouperOptions.on('select', function (value) {
		searchModel.setGrouper(value);
	});
	
	// actuator //
	searchModel.on('grouper', function (value) {
		grouperOptions.select(value);
	});
	
	renderScheme.on('layout', function (value) {
		layoutOptions.select(value);
	});
}
//window.inherit(SearchOptions, DataModel);



// model //
var fieldMap = {
	pesticide: '藥劑',
	crop: '作物名稱',
	disease: '病蟲名稱'
};

function PesticideSearchModel() {
	var self = this;
	(this.innerModel = new window.search.SearchModel())
	.on('results', function (results) {
		self.trigger('results', {
			keywords: self._keywords,
			grouper: self._grouper,
			results: results
		});
	});
}
window.inherit(PesticideSearchModel, DataModel);

PesticideSearchModel.prototype.enable = function () {
	this.innerModel.enable();
};

PesticideSearchModel.prototype.disable = function () {
	this.innerModel.disable();
};

PesticideSearchModel.prototype.setSource = function (source) {
	this.innerModel.setSource(source);
};

function normailizeKeywords(keywords) {
	if (!keywords)
		return [];
	var kws = [];
	keywords.forEach(function (w) {
		if (w)
			kws.push(w);
	});
	return kws;
}

PesticideSearchModel.prototype.setKeywords = function (keywords) {
	this._keywords = keywords = normailizeKeywords(keywords);
	this.trigger('keywords', keywords);
	if (keywords.length) {
		this.innerModel.setFilter(multipleKeywordFilter(keywords));
	} else {
		this.trigger('clear');
	}
};

/*
PesticideSearchModel.prototype.isGrouped = function () {
	return !!this._grouper;
};
*/

PesticideSearchModel.prototype.setGrouper = function (grouper) {
	if (this._grouper == grouper)
		return; // idempotent
	this._grouper = grouper;
	this.trigger('grouper', grouper);
	this.innerModel.setGrouper(fieldMap[grouper]);
};



function RenderSchemeModel() {}
window.inherit(RenderSchemeModel, DataModel);

RenderSchemeModel.prototype.setLayout = function (layout) {
	if (this._layout == layout)
		return;
	this._layout = layout;
	this.trigger('layout', layout);
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

$(function () {
	
	var model = window.model = {},
		view = window.view = {},
		stateManager = new window.StateManager(encodeURL, decodeURL),
		searchModel = model.searchModel = new PesticideSearchModel(),
		renderScheme = model.renderScheme = new RenderSchemeModel(),
		form = view.form = new SearchForm('#form', searchModel),
		_state = {};
	
	view.resultList = new ResultList('#result', searchModel, renderScheme);
	view.searchOptions = new SearchOptions(searchModel, renderScheme);
	
	form.disable();
	renderScheme.setLayout('card'); // TODO: consider default to table
	
	
	
	// state management //
	var popingState = false;
	
	function syncState() {
		if (!popingState)
			stateManager.push(_state);
	}
	
	stateManager.onchangestate = function (state) {
		popingState = true;
		_state = state = state || {};
		var keywords = state.keywords;
		form.setKeywords(keywords);
		// TODO: we may want setCriteria() API
		searchModel.setKeywords(keywords);
		popingState = false;
	};
	
	searchModel.on('keywords', function (keywords) {
		_state.keywords = keywords;
		syncState();
	});
	
	
	
	// data //
	$.ajax('../../data/pesticide/usages-search.json')
	.done(function (data) {
		window.data = data;
		var usages = data.usages;
		
		// normalize
		var sn = 0, 
			pesticide;
		usages.forEach(function (u) {
			u.id = 'u' + sn++;
			pesticide = data.pesticides[u.pesticideId];
			if (pesticide) {
				u['藥劑'] = pesticide.name;
				u.products = pesticide.products.split('#');
			}
		});
		
		searchModel.setSource(usages);
		searchModel.enable();
		
		// remove loading mark & enable submit
		$('#loading')
		.one($.support.transition.end, function () {
			this.remove();
		})
		.removeClass('in');
		form.enable();
		
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
	
});

})(this);

