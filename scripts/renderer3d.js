var Renderer3d = function(kicker, canvasEl) {
	this.kicker = kicker;
	this.canvasEl = canvasEl;

	console.log('Renderer3d - constructor');
};

Renderer3d.prototype.refresh = function() {
	this.kicker.refresh();
};