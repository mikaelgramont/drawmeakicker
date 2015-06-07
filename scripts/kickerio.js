var KickerIO = function() {
	this.params = ['height', 'width', 'angle',];
	this.results = ['arc', 'radius', 'length',];
	this.rep = ['repType', 'textured'];
	this.context = ['annotations', 'grid', 'mountainboard', 'rider'];
	this.export = ['fill', 'borders'];
	this.save = ['description', 'id'];

	this.supported = this.params.concat(this.results, this.rep, this.context,
		this.export, this.save);

	this.floatValues = [
		'height', 'width', 'angle', 'arc', 'radius', 'length'
	];
};

KickerIO.prototype.init = function() {
	throw new Error('KickerIO.init not implemented');
};

KickerIO.prototype.get = function(name) {
	throw new Error('KickerIO.get not implemented');
};

KickerIO.prototype.set = function(name, value) {
	throw new Error('KickerIO.set not implemented');
};