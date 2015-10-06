var KickerIO = function() {
	this.params = ['height', 'width', 'angle',];
	this.results = ['arc', 'radius', 'length',];
	this.rep = ['repType', 'textured'];
	this.context = ['annotations', 'grid', 'mountainboard', 'rider'];
	this.export = ['fill', 'borders'];
	this.save = ['description', 'title', 'id'];

	this.supported = this.params.concat(this.results, this.rep, this.context,
		this.export, this.save);

	this.floatValues = [
		'height', 'width', 'angle', 'arc', 'radius', 'length'
	];

	this.saveValues = this.params.concat(
		this.save,
		this.rep,
		this.context,
		this.save,
		this.export
	);

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

KickerIO.prototype.getDataForSaving = function() {
	var data = {};
	var get = this.get.bind(this);
	this.saveValues.forEach(function(name) {		
		data[name] = get(name);
	});
	if (data['id']) {
		// This will be present if the kicker was already saved.
		delete(data['id']);
	}
	return data;
};