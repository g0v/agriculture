(function (window) {

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

var Form = function ($element) {
	var self = this;
	this.$element = $element;
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
	return Handlebars.compile($(selector).html())
}

var UsageList = function ($element) {
	this.$element = $element;
	this.templates = {
		container: getTemplate("#container-template"),
		usage: getTemplate("#usage-template")
	};
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

UsageList.prototype._usageHTML = function (row, id) {
	var item = row.data,
		pesticide = window.data.pesticides[item.pesticideId];
	// TODO: render hit information
	return this.templates.usage({
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
	});
};

UsageList.prototype._usageListHTML = function (rows) {
	var self = this,
		content = '',
		id = 0;
	rows.forEach(function (row) {
		content += self._usageHTML(row, id++);
	});
	return this.templates.container({ content: content });
};

UsageList.prototype.renderItems = function (rows) {
	this.clear();
	this.$element.append(this._usageListHTML(rows));
};

UsageList.prototype.renderGroups = function (groups) {
	this.clear();
	this.$element.append(this._groupListHTML(groups));
};



function start() {
	
	var list = new UsageList($('#result')),
		form = new Form($('#form'));
	
	function query(options) {
		if (!options || !options.keywords) {
			list.clear();
			return;
		}
		// TODO: push state
		var keywords = options.keywords,
			filter = multipleKeywordFilter(keywords),
			order = options.order,
			grouper = options.grouper;
		
		var result = window.search(window.data.usages, filter, order);
		// TODO: grouper
		list.renderItems(result);
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
