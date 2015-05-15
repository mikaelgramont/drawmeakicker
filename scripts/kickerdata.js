var KickerData = function(paramsEl, resultsEl, repEl, contextEl) {
	this.parameters = {};
	this.results = {};
	this.viz = {};

	this.paramsEl = paramsEl;
	this.resultsEl = resultsEl;
	this.repEl = repEl;
	this.contextEl = contextEl;

	this.parse();
}	

KickerData.prototype.parse = function() {
	this.viz.representationType = this.get('rep-type');
	this.viz.textured = this.get('textured');

	this.viz.mountainboard = this.get('mountainboard');
	this.viz.rider = this.get('rider');
};

KickerData.prototype.get = function(name) {
	switch(name) {
		case 'height':
		case 'width':
		case 'angle':
			return parseFloat(this.paramsEl.getAttribute(name));
		case 'rep-type':
			return this.repEl.getAttribute(name);
		case 'textured':
			return this.repEl.hasAttribute(name);
		case 'mountainboard':
		case 'rider':
			return this.contextEl.hasAttribute(name);
		default:
			throw new Error('Not supported:' + name);
	}
};


KickerData.prototype.refresh = function(radius, length, arc, height, width, angle) {
	this.lengthUnit = 'm';
	this.radius = radius;
	this.length = length;
	this.arc = arc;
	this.height = height;
	this.width = width;
	this.angle = angle;

	this.reflect(radius, length, arc);
}

KickerData.prototype.reflect = function(radius, length, arc) {
	this.resultsEl.radius = radius.toFixed(2);
	this.resultsEl.length = length.toFixed(2);
	this.resultsEl.arc = arc.toFixed(2);
};

KickerData.prototype.getHumanReadableDimensions = function() {
	return {
		radius: this.getHumanReadableDimension_(this.radius, this.lengthUnit),
		arc: this.getHumanReadableDimension_(this.arc, this.lengthUnit),
		length: this.getHumanReadableDimension_(this.length, this.lengthUnit),
		height: this.getHumanReadableDimension_(this.height, this.lengthUnit),
		width: this.getHumanReadableDimension_(this.width, this.lengthUnit),
		angle: this.getHumanReadableDimension_(this.angle, '°')
	};
};

KickerData.prototype.getHumanReadableDimension_ = function(dimension, unit) {
	return dimension.toFixed(2) + unit;
}