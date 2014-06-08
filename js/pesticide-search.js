(function (window) {

var $ = window.jQuery;

function keywordFilter(keyword) {
	return function (item) {
		return (item['作物名稱'] && item['作物名稱'].indexOf(keyword) > -1) ||
			(item['病蟲名稱'] && item['病蟲名稱'].indexOf(keyword) > -1);
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

var UsageList = function ($element) {
	this.$element = $element;
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
	return '<li class="usage">' + item.pesticide + ' / ' + item['作物名稱'] + 
		' / ' + item['病蟲名稱'] + '</li>';
};

UsageList.prototype._usageListHTML = function (items) {
	var self = this;
		html = '<ul class="usages">';
	items.forEach(function (item) {
		html += self._usageHTML(item);
	});
	html += '</ul>';
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
	
	var usages, 
		grouped,
		list = new UsageList($('#result')),
		form = new Form($('#form'));
	
	function query(options) {
		if (!options) {
			list.clear();
			return;
		}
		// TODO: push state
		//var result = window.search(usages, options);
		list[grouped ? 'renderGroups' : 'renderItems'](window.search(usages, options));
	}
	
	form.$element.on('query', function (event, options) {
		query(options);
	});
	
	$.ajax('../../../data/pesticide/usages.json')
	.done(function (data) {
		usages = data;
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
