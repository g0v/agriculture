(function (window) {

// TODO: rename to select/options

'use strict';

var $ = window.jQuery;

var Combobutton = function (element) {
	$(element).on('click.bs.combobutton', '.combobutton-item', this.select);
};

Combobutton.prototype.select = function (e) {
	if (e === undefined)
		return;
	// TODO: normalize e/this
	var item = e.currentTarget || this,
		$item = item && $(item),
		$this = $item.closest('.combobutton');
	
	if (!item || !$this.length)
		return;
	
	var value = $item && $item.data('value'),
		text = $item && ($item.data('text') || $item.text());
	
	var oldItem = $this.data('selected-element');
	
	$this.trigger(e = $.Event('select.bs.combobutton', {
		element: item,
		value: value
	}));
	if (e.isDefaultPrevented()) 
		return;
	
	$this[value ? 'data' : 'removeData']('selected', value);
	$this.data('selected-element', item);
	
	var label = getLabel($this);
	
	if (label && (label = label[0]))
		label.innerHTML = text;
	
	$(oldItem).removeClass('selected');
	$item.addClass('selected');
};

function getLabel($this) {
	var selector = $this.attr('data-label'),
		$label = selector && $(selector);
	return $label && $label.length ? $label : $this.find('.combobutton-label');
}

function Plugin(option) {
	if (option == 'selected' || option == 'selected-element')
		return this.data(option);
	return this.each(function () {
		var $this = $(this);
		var data = $this.data('bs.combobutton');
		if (!data) 
			$this.data('bs.combobutton', (data = new Combobutton(this)));
		/*
		if (typeof option == 'string') 
			data[option].call($this);
		*/
	});
}

var old = $.fn.combobutton;

$.fn.combobutton = Plugin;
$.fn.combobutton.Constructor = Combobutton;

$.fn.combobutton.noConflict = function () {
	$.fn.combobutton = old;
	return this;
};

$(window.document)
.on('click.bs.combobutton.data-api', '.combobutton-item', Combobutton.prototype.select);

})(this);
