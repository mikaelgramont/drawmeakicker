var KickerIOFromDOM = function(paramsEl, resultsEl, repEl, contextEl, initialValues) {
	KickerIO.call(this);

	this.paramsEl = paramsEl;
	this.resultsEl = resultsEl;
	this.repEl = repEl;
	this.contextEl = contextEl;

	this.init(initialValues);
};
KickerIOFromDOM.prototype = new KickerIO();

KickerIOFromDOM.prototype.init = function(initialValues) {
	if (!initialValues) {
		return;
	}
	for (name in initialValues) {
		this.set(name, initialValues[name]);
	}
};

KickerIOFromDOM.prototype.get = function(name) {
	switch(name) {
		case 'height':
		case 'width':
		case 'angle':
			return parseFloat(this.paramsEl[name]);
		case 'repType':
			return this.repEl[name];
		case 'textured':
			return !!this.repEl[name];
		case 'annotations':
		case 'grid':
		case 'mountainboard':
		case 'rider':
			return !!this.contextEl[name];
		default:
			throw new Error('Get not supported:' + name);
	}
};

KickerIOFromDOM.prototype.set = function(name, value) {
	if (this.supported.indexOf(name) == -1) {
		throw new Error('Set not supported:' + name);
	}

	var targetEl = this.resultsEl;
	if (this.params.indexOf(name) !== -1) {
		targetEl = this.paramsEl;	
	} else if (this.rep.indexOf(name) !== -1) {
		targetEl = this.repEl;	
	} else if (this.context.indexOf(name) !== -1) {
		targetEl = this.contextEl;	
	}

	if (this.floatValues.indexOf(name) !== -1) {
		targetEl[name] = value.toFixed(2);
	} else {
		targetEl[name] = value;
	}
};