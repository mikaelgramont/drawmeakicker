var KickerIOFromJSON = function(initialValues) {
	KickerIO.call(this);

	if (typeof initialValues === 'string') {
		this.storage = JSON.parse(JSONString);
	} else {
		// Also support plain objects
		this.storage = initialValues;
	}
	
};
KickerIOFromJSON.prototype = new KickerIO();

KickerIOFromJSON.prototype.get = function(name) {
	switch(name) {
		case 'height':
		case 'width':
		case 'angle':
			return parseFloat(this.storage[name]);
		case 'repType':
			return this.storage[name];
		case 'textured':
		case 'mountainboard':
		case 'rider':
			return !!this.storage[name];
		default:
			throw new Error('Get not supported:' + name);
	}
};

KickerIOFromJSON.prototype.set = function(name, value) {
	if (this.supported.indexOf(name) == -1) {
		throw new Error('Set not supported:' + name);
	}
	if (this.floatValues.indexOf(name) !== -1) {
		this.storage[name] = value.toFixed(2);
	} else {
		this.storage[name] = value;
	}
};