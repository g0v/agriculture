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

function valueOf(elem) {
	return elem && $(elem).data('value');
}



// TODO: put this in data folder?
// meta //
var meta = window.meta = {};
meta.fields = {
	pesticide: {
		key: '藥劑',
		label: '藥劑',
		icon: 'fa-flask'
	},
	crop: {
		key: '作物名稱',
		label: '作物',
		icon: 'fa-leaf'
	},
	disease: {
		key: '病蟲名稱',
		label: '病蟲',
		icon: 'fa-bug'
	},
	formulation: {
		key: '劑型',
		optional: true
	},
	quantity: {
		key: '含量',
		optional: true
	},
	mix: {
		key: '混合',
		optional: true
	},
	'dose-per-hectare-per-use': {
		key: '每公頃每次用量',
		size: 'm-size',
		optional: true
	},
	'dilution-factor': {
		key: '稀釋倍數',
		optional: true
	},
	'used-when': {
		key: '使用時期',
		size: 'l-size',
		verbose: true,
		optional: true
	},
	interval: {
		key: '施藥間隔',
		optional: true
	},
	times: {
		key: '施用次數',
		optional: true
	},
	moa: {
		key: '作用機制',
		optional: true
	},
	'harvest-safe-period': {
		key: '安全採收期',
		icon: 'fa-calendar',
		optional: true
	},
	'approval-date': {
		key: '核准日期',
		optional: true
	},
	'original-registrant': {
		key: '原始登記廠商名稱',
		size: 'l-size',
		optional: true
	},
	method: {
		key: '施藥方法',
		size: 'l-size',
		verbose: true,
		optional: true
	},
	notice: {
		key: '注意事項',
		size: 'l-size',
		verbose: true,
		optional: true
	},
	remark: {
		key: '備註',
		size: 'l-size',
		verbose: true,
		optional: true
	}
	// TODO: products?
};
meta.details = [
	'approval-date', 'original-registrant',
	'<hr>', 'pesticide', 'crop', 'disease', 
	'formulation', 'quantity', 'mix', 'dose-per-hectare-per-use', 
	'dilution-factor', 'interval',  'times', 'moa', 'harvest-safe-period', 'used-when',
	'<hr>', 'method', 'notice', 'remark'
];

// component //
function SearchForm(element, model) {
	var self = this,
		$element = $(element);
	
	this._enabled = true;
	
	this.inputElement = $element.find('.input')[0];
	this.submitButton = $element.find('.submit')[0];
	this.searchModel = model.searchModel;
	
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

function ResultHeader(element, fields, model) {
	var $element = this.$element = $(element);
	element = $element[0];
	var summariesContainer = element.querySelector('.u-summaries');
	
	//this.scheme = model.renderScheme;
	this.searchModel = model.searchModel;
	
	var templates = this.templates = {
		summary: getTemplate('#header-summary-template'),
		pool: getTemplate('#header-pool-template')
	};
	
	// prepare summary elements, render pool elements
	var poolHtml = '', 
		summaries = {};
	window.map(fields).forEach(function (name, params) {
		summaries[name] = $(templates.summary({
			id: 'hfs-' + name,
			name: name,
			label: params.label || params.key,
			size: params.size,
			verbose: params.verbose
		}))[0];
		poolHtml += templates.pool({
			id: 'hfp-' + name,
			name: name,
			label: params.label || params.key,
			size: params.size,
			verbose: params.verbose
		});
	});
	element.querySelector('.u-pool').innerHTML = poolHtml;
	
	// receptor //
	$element
	.on('click', '.u-pool .field', function (e) {
		var value = valueOf(e.currentTarget);
		if (value)
			model.renderScheme.toggleField(value);
	})
	.on('click', '.u-pool', function (e) {
		e.stopPropagation(); // escape from bootstrap default dropdown behavior
	})
	.on('click', '.u-order', function () {
		// TODO
	});
	
	/*
	var dragged, ghost;
	window.drag(element)
	.on('start', function (data) {
	})
	.on('move', function (data) {
	})
	.on('end', function (data) {
	});
	*/
	
	// actuator //
	var updateMember = window.aggregator(updateMemberSync);
	
	function rerenderSync() {
		summariesContainer.innerHTML = '';
		model.renderScheme.summaries.forEach(function (field) {
			summariesContainer.appendChild(summaries[field]);
			$('#hfp-' + field).addClass('selected');
		});
		model.renderScheme.pool.forEach(function (field) {
			$('#hfp-' + field).removeClass('selected');
		});
	}
	
	function updateMemberSync(updates) {
		var len = updates.length;
		if (len === 0)
			return; // just in case
		if (len == 1) {
			updates[0]();
			return;
		}
		rerenderSync();
	}
	
	model.renderScheme
	.on('fields', function () {
		updateMember(rerenderSync);
	})
	.on('add-field', function (data) {
		updateMember(function () {
			var m = summaries[data.field],
				ref;
			m.remove();
			ref = summariesContainer.children[data.index];
			if (ref)
				summariesContainer.insertBefore(m, ref);
			else
				summariesContainer.appendChild(m);
			$('#hfp-' + data.field).addClass('selected');
		});
	})
	.on('remove-field', function (data) {
		updateMember(function () {
			var m = summaries[data.field];
			if (m.parentElement == summariesContainer)
				m.remove();
			$('#hfp-' + data.field).removeClass('selected');
		});
	});
	
	var orderingField;
	model.searchModel
	.on('order', function (data) {
		$element[data.descending ? 'addClass' : 'removeClass']('order-descending');
		if (orderingField != data.field) {
			if (orderingField)
				summaries[orderingField].removeClass('order-by');
			if (data.field)
				summaries[data.field].addClass('order-by');
			orderingField = data.field;
		}
	});
	
}

ResultHeader.prototype.setEditing = function (value) {
	value = !!value;
	if (value == this._editing)
		return;
	this._editing = value;
	this.$element[value ? 'addClass' : 'removeClass']('editing');
};

function ResultList(element, meta, model) {
	var $element = this.$element = $(element),
		self = this;
	
	this.meta = meta;
	this.scheme = model.renderScheme;
	
	this.templates = {
		container: getTemplate('#container-template'),
		group: getTemplate('#group-template'),
		usage: getTemplate('#usage-template'),
		field: getTemplate('#usage-field-template'),
		detail: getTemplate('#usage-detail-template')
	};
	
	// receptor //
	$element.on('click', '.toggle-detail-btn', function (e) {
		var $usage = $(e.currentTarget).closest('.usage');
		self.setOpen($usage[0], !$usage.hasClass('open'));
	});
	
	// actuator //
	var rerender = window.aggregator(rerenderSync);
	
	function rerenderSync() {
		var data = self._data;
		if (!data) {
			self.clear();
			return;
		}
		
		var keywords = data.keywords,
			grouper = data.grouper,
			results = data.results;
		// TODO: ad-hoc
		$('body')[results && results.length ? 'removeClass' : 'addClass']('no-result');
		// TODO: by scheme
		self[grouper ? 'renderGroups' : 'renderItems'](results, keywords);
	}
	
	model.searchModel
	.on('results', function (data) {
		self._data = data;
		rerender();
	})
	.on('clear', function () {
		delete self._data;
		rerender();
	});
	
	// TODO: order
	
	model.renderScheme
	.on('layout', function (layout) {
		$element
		.removeClass('table-layout')
		.removeClass('card-layout')
		.addClass(layout + '-layout');
	})
	.on('fields', rerender)
	.on('add-field', rerender)
	.on('remove-field', rerender);
}

ResultList.prototype.setOpen = function (element, value) {
	var detail = $(element).find('.u-detail')[0];
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
	var fieldTemplate = this.templates.field,
		data = row.data,
		fields = this.meta.fields,
		pool = window.set(this.scheme.pool),
		content = '',
		m, value;
	this.meta.details.forEach(function (name) {
		if (name === '<hr>') {
			content += '<hr>';
			return;
		}
		if (!pool.contains(name))
			return;
		m = fields[name];
		if (!m)
			return;
		value = data[m.key];
		// jshint eqnull: true
		if (m.optional && (value == null || value === ''))
			return;
		content += fieldTemplate({
			name: name,
			icon: m.icon,
			label: m.label || m.key,
			verbose: m.verbose,
			value: value
		});
	});
	return _renderHits(this.templates.detail({
		id: data.id, 
		products: data.products,
		content: content
	}), this.keywords);
};

ResultList.prototype._usageHTML = function (row) {
	var fieldTemplate = this.templates.field,
		data = row.data,
		fields = this.meta.fields,
		content = '',
		m;
	this.scheme.summaries.forEach(function (name) {
		m = fields[name];
		if (!m)
			return;
		content += fieldTemplate({
			name: name,
			icon: m.icon,
			label: m.label || m.key,
			size: m.size,
			verbose: m.verbose,
			value: data[m.key]
		});
	});
	return _renderHits(this.templates.usage({
		id: data.id, 
		content: content
	}), this.keywords);
};

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

ResultList.prototype._listHTML = function (rows) {
	var self = this,
		content = '';
	rows.forEach(function (row) {
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
	this.$element[0].innerHTML = this._listHTML(rows);
};

ResultList.prototype.renderGroups = function (groups, keywords) {
	this.clear();
	this.keywords = keywords;
	this.$element[0].innerHTML = this._groupListHTML(groups);
};



function OptionGroup(name, element) {
	var self = this,
		selector = '[data-group="' + name + '"]',
		$members = this.$members = $(selector);
	
	this.index = window.list($members).indexBy(valueOf);
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



function SearchOptions(model) {
	var layoutOptions = new OptionGroup('layout'),
		grouperOptions = new OptionGroup('grouper');
	
	// receptor //
	layoutOptions.on('select', function (value) {
		model.renderScheme.setLayout(value);
	});
	
	grouperOptions.on('select', function (value) {
		model.searchModel.setGrouper(value);
	});
	
	// actuator //
	model.searchModel.on('grouper', function (value) {
		grouperOptions.select(value);
	});
	
	model.renderScheme.on('layout', function (value) {
		layoutOptions.select(value);
	});
}
//window.inherit(SearchOptions, DataModel);



// model //
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
	this.innerModel.setGrouper(grouper && meta.fields[grouper].key);
};

PesticideSearchModel.prototype.setOrder = function (field, descending) {
	if (this._orderBy == field && this._orderDescending == descending)
		return; // idempotent
	this._orderBy = field;
	this._orderDescending = descending;
	this.trigger('order', { field: field, descending: descending });
	// TODO
};



function RenderSchemeModel(fields) {
	this.fields = fields;
	this.pool = window.list(fields).clone();
	this.summaries = [];
}
window.inherit(RenderSchemeModel, DataModel);

RenderSchemeModel.prototype.setLayout = function (layout) {
	if (this._layout == layout)
		return;
	this._layout = layout;
	this.trigger('layout', layout);
};

RenderSchemeModel.prototype.setFields = function (fields) {
	this.summaries = window.list(fields).clone();
	var s = window.set(fields),
		pool = this.pool = [];
	this.fields.forEach(function (field) {
		if (!s.contains(field))
			pool.push(field);
	});
	this.trigger('fields');
};

RenderSchemeModel.prototype.containsField = function (field) {
	return this.summaries.indexOf(field) != -1;
};

RenderSchemeModel.prototype.toggleField = function (field) {
	this[this.containsField(field) ? 'removeField' : 'addField'](field);
};

RenderSchemeModel.prototype.addField = function (name, index) { // TODO: use before to ref
	// TODO: idempotent
	// jshint -W030
	window.list(this.summaries).remove(name) || window.list(this.pool).remove(name);
	
	if (index === undefined) {
		this.summaries.push(name);
		index = this.summaries.length - 1;
	} else {
		this.summaries.splice(index, 0, name);
	}
	
	this.trigger('add-field', { index: index, field: name });
};

RenderSchemeModel.prototype.removeField = function (name) {
	if (window.list(this.summaries).remove(name)) {
		this.pool.push(name);
		this.trigger('remove-field', { field: name });
	}
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
	var fields = window.meta.fields,
		stateManager = new window.StateManager(encodeURL, decodeURL),
		_state = {};
	
	// model
	var model = window.model = {};
	model.fields = fields;
	model.searchModel = new PesticideSearchModel();
	model.renderScheme = new RenderSchemeModel(Object.keys(fields));
	
	// view
	var view = window.view = {};
	view.form = new SearchForm('#form', model);
	view.resultHeader = 
		new ResultHeader('#result-header', fields, model);
	view.resultList = new ResultList('#result', window.meta, model);
	view.searchOptions = new SearchOptions(model);
	
	// initial states
	view.form.disable();
	model.renderScheme.setFields(['pesticide', 'crop', 'disease', 'harvest-safe-period']);
	model.renderScheme.setLayout('table');
	
	
	
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
		view.form.setKeywords(keywords);
		// TODO: we may want setCriteria() API
		model.searchModel.setKeywords(keywords);
		popingState = false;
	};
	
	model.searchModel.on('keywords', function (keywords) {
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
		
		model.searchModel.setSource(usages);
		model.searchModel.enable();
		
		// remove loading mark & enable submit
		$('#loading')
		.one($.support.transition.end, function () {
			this.remove();
		})
		.removeClass('in');
		view.form.enable();
		
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

