var Kicker = function(model) {
	this.model = model;

	console.log('Kicker - constructor');
};

Kicker.prototype.refresh = function() {
	this.model.processViewParameters();
};