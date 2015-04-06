var Kicker = function(model) {
	this.model = model;
};

Kicker.prototype.refresh = function() {
	this.model.processViewParameters();
};