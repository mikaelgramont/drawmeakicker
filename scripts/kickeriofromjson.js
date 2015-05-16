var KickerIOFromJSON = function(storage) {
	KickerIO.call(this);

	// TODO: take in a JSON string instead of an object, and parse it
	// into the storage var.
	this.storage = storage;
};
KickerIOFromJSON.prototype = new KickerIO();

KickerIOFromJSON.prototype.get = function(name) {
	switch(name) {
		case 'height':
		case 'width':
		case 'angle':
			return parseFloat(this.storage[name]);
		case 'rep-type':
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
	var supported = ['arc', 'radius', 'length', 'rep-type', 'textured', 'mountainboard', 'rider'];
	if (supported.indexOf(name) == -1) {
		throw new Error('Set not supported:' + name);
	}
	var floatValues = ['arc', 'radius', 'length'];
	if (floatValues.indexOf(name) !== -1) {
		this.storage[name] = value.toFixed(2);
	} else {
		this.storage[name] = value;
	}
};