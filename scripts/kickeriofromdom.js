var KickerIOFromDOM = function(paramsEl, resultsEl, repEl, contextEl) {
	KickerIO.call(this);

	this.paramsEl = paramsEl;
	this.resultsEl = resultsEl;
	this.repEl = repEl;
	this.contextEl = contextEl;
};
KickerIOFromDOM.prototype = new KickerIO();

KickerIOFromDOM.prototype.get = function(name) {
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

KickerIOFromDOM.prototype.set = function(name, value) {
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