var KickerData = function(paramsEl, resultsEl, repEl, contextEl) {
	this.paramsEl = paramsEl;
	this.resultsEl = resultsEl;
	this.repEl = repEl;
	this.contextEl = contextEl;

	// TODO: get rid of this once consumers access it through data.get('...')
	this.viz = {};
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
			throw new Error('Get not supported:' + name);
	}
};

KickerData.prototype.set = function(name, value) {
	var supported = ['arc', 'radius', 'length', 'rep-type', 'textured', 'mountainboard', 'rider'];
	if (supported.indexOf(name) == -1) {
		throw new Error('Set not supported:' + name);
	}
	var floatValues = ['arc', 'radius', 'length'];
	if (floatValues.indexOf(name) !== -1) {
		this.resultsEl[name] = value.toFixed(2);
	} else {
		this.resultsEl[name] = value;
	}
};

KickerData.prototype.refresh = function(radius, length, arc, height, width, angle) {
	// TODO: we shouldn't need to rewrite some of these things.
	this.lengthUnit = 'm';
	this.radius = radius;
	this.length = length;
	this.arc = arc;
	this.height = height;
	this.width = width;
	this.angle = angle;

	this.set('radius', radius);
	this.set('length', length);
	this.set('arc', arc);
}


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