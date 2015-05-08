var KickerEditorView = function(rootEl) {
	var els = rootEl.querySelectorAll('bihi-design-parameter');
	this.parameters = {};
	for (var i = 0; i < els.length; i++) {
		var id = els[i].getAttribute('id');
		this.parameters[id] = els[i];
	};

	els = rootEl.querySelectorAll('bihi-design-result');
	this.results = {};
	for (var i = 0; i < els.length; i++) {
		var id = els[i].getAttribute('id');
		this.results[id] = els[i];
	};
};

KickerEditorView.prototype.refresh = function(radius, length, arc, height, width, angle) {
	this.lengthUnit = 'm';
	this.radius = radius;
	this.length = length;
	this.arc = arc;
	this.height = height;
	this.width = width;
	this.angle = angle;

	this.results.radius.setAttribute('value', radius.toFixed(2));
	this.results.length.setAttribute('value', length.toFixed(2));
	this.results.arc.setAttribute('value', arc.toFixed(2));
};

KickerEditorView.prototype.getHumanReadableDimensions = function() {
	return {
		radius: this.getHumanReadableDimension_(this.radius, this.lengthUnit),
		arc: this.getHumanReadableDimension_(this.arc, this.lengthUnit),
		length: this.getHumanReadableDimension_(this.length, this.lengthUnit),
		height: this.getHumanReadableDimension_(this.height, this.lengthUnit),
		width: this.getHumanReadableDimension_(this.width, this.lengthUnit),
		angle: this.getHumanReadableDimension_(this.angle, '°')
	};
};

KickerEditorView.prototype.getHumanReadableDimension_ = function(dimension, unit) {
	return dimension.toFixed(2) + unit;
}