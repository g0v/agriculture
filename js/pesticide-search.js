(function (window) {

var $ = window.jQuery;

function fieldContains(obj, field, keyword) {
	return obj && obj[field] && obj[field].indexOf(keyword) > -1;
}

function keywordFilter(keyword) {
	return function (item) {
		var pesticide = window.data.pesticides[item.pesticideId];
		return fieldContains(item, '作物名稱', keyword) ||
			fieldContains(item, '病蟲名稱', keyword) ||
			fieldContains(pesticide, 'name', keyword) ||
			fieldContains(pesticide, 'engName', keyword) ||
			fieldContains(pesticide, 'products', keyword);
	};
}

var Form = function ($element) {
	var self = this;
	this.$element = $element;
	this.keywordInput = $element.find('.keyword')[0];
	this.submitButton = $element.find('.submit')[0];
	
	$element
	.on('click', '.submit', function (event) {
		var keyword = self.keywordInput.value,
			query = keyword.length && {
				filter: keywordFilter(keyword)
			};
		$element.trigger('query', query);
	});
};

function getTemplate(selector) {
	return Handlebars.compile($(selector).html())
}

var UsageList = function ($element) {
	this.$element = $element;
	this.templates = {
		header: getTemplate("#header-template"),
		usage: getTemplate("#usage-template")
	};
};

UsageList.prototype.clear = function () {
	this.$element.empty();
};

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

UsageList.prototype._usageHTML = function (item) {
	return this.templates.usage({
		pesticide: window.data.pesticides[item.pesticideId].name,
		corp: item['作物名稱'],
		disease: item['病蟲名稱']
	});
};

UsageList.prototype._usageListHTML = function (items) {
	var self = this;
		html = '<table class="table">';
	html += this.templates.header();
	items.forEach(function (item) {
		html += self._usageHTML(item);
	});
	html += '</table>';
	return html;
};

UsageList.prototype.renderItems = function (items) {
	this.clear();
	this.$element.append(this._usageListHTML(items));
};

UsageList.prototype.renderGroups = function (groups) {
	this.clear();
	this.$element.append(this._groupListHTML(groups));
};



function start() {
	
	var list = new UsageList($('#result')),
		form = new Form($('#form'));
	
	function query(options) {
		if (!options) {
			list.clear();
			return;
		}
		// TODO: push state
		var grouped = options.grouper,
			result = window.search(window.data.usages, options);
		list[grouped ? 'renderGroups' : 'renderItems'](result);
	}
	
	form.$element.on('query', function (event, options) {
		query(options);
	});
	
	$.ajax('../../data/pesticide/usages-search.json')
	.done(function (data) {
		window.data = data;
		// remove loading mark & enable submit
		// TODO: loading mark
		form.submitButton.disabled = false;
		
		// process query params, if any
		// TODO
	});
	
}

// start when DOM is ready
$(start);

})(this);
