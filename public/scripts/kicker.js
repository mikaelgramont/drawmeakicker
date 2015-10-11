var Kicker = function(model) {
	this.model = model;
};

Kicker.prototype.refresh = function() {
	this.model.processDataParameters();
};

Kicker.prototype.getRepresentation3d = function() {
	return this.model.getRepresentation3d();
}