(function (window) {

'use strict';

var $ = window.jQuery;

function clientOf(e) {
	return { x: e.clientX, y: e.clientY };
}

function distanceBetween(p, q) {
	var dx = p.x - q.x,
		dy = p.y - q.y;
	return window.Math.sqrt(dx * dx + dy * dy);
}

function Dragger(element, options) { // TODO: polyfill with HTML 5 and mobile
	
	options = options || {};
	
	var selector = options.selector || '.draggable',
		moveThreshold = options.moveThreshold || 3;
	
	var self = this,
		context;
	
	$(element)
	.on('mousedown', selector, function (e) {
		// TODO: escape input & textarea
		if (e.which != 1) // left mouse button
			return;
		context = {
			dragging: false,
			dragged: this, // event target
			initialClient: clientOf(e),
			initialEvent: e
		};
	});
	
	$(window.document)
	.on('mousemove', function (e) {
		if (!context)
			return;
		var client = clientOf(e);
		
		if (context.dragging) {
			self.trigger('move', {
				context: context,
				client: client,
				event: e
			});
			
		} else if (distanceBetween(client, context.initialClient) >= moveThreshold) {
			self.trigger('start', {
				context: context,
				client: client,
				event: e
			});
			context.dragging = true;
		}
	})
	.on('mouseup', function (e) {
		if (!context || !context.dragging)
			return;
		// TODO: expose end() API
		var client = clientOf(e);
		self.trigger('end', {
			context: context,
			client: client,
			event: e
		});
		context = null;
	});
}
window.inherit(Dragger, window.DataModel);

Dragger.prototype.end = function () {
	// TODO
};

window.drag = function (element, options) {
	return new Dragger(element, options);
};

})(this);
