var KickerModel = function(view) {
	this.view = view;
	this.processViewParameters()
};

KickerModel.prototype.processViewParameters = function() {
	this.readView();
	this.calculate();
	this.refreshView();
};

KickerModel.prototype.readView = function() {
	this.height = parseFloat(this.view.parameters.height.getAttribute('value'));
	this.width = parseFloat(this.view.parameters.width.getAttribute('value'));
	this.angle = parseFloat(this.view.parameters.angle.getAttribute('value'));
};

KickerModel.prototype.refreshView = function() {
	this.view.refresh(this.radius, this.length, this.arc);
};

KickerModel.prototype.calculate = function() {
	this.radius = this.calculateRadius(this.height, this.angle);
	this.length = this.calculateLength(this.height, this.angle);
	this.arc = this.calculateArc(this.radius, this.angle);
};

KickerModel.prototype.calculateRadius = function(h, alphaDeg) {
  var alphaRad = alphaDeg * Math.PI / 180,
      r = h / (1 - Math.cos(alphaRad));
  return r;
}

KickerModel.prototype.calculateLength = function(h, alphaDeg) {
  var alphaRad = alphaDeg * Math.PI / 180,
      l = h * Math.sin(alphaRad) / (1 - Math.cos(alphaRad));
  return l;    
}

KickerModel.prototype.calculateArc = function(radius, alphaDeg) {
  var arc = radius * alphaDeg * Math.PI / 180;
  return arc;
}

