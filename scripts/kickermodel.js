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
	this.view.refresh(this.radius, this.length, this.arc, this.height, this.width, this.angle);
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

KickerModel.prototype.calculateSidePoints = function(angle, radius, config) {
	var points = [];

	var angleRad = angle * Math.PI / 180;
	var steps = config.model3d.sides.steps;
	var currentAngleRad, x, y,
		extraLength = config.model3d.sides.extraLength;

	// The first point is calculated outside of the loop because it must
	// account for a minimum height of the sides, otherwise it looks too
	// 'perfect': you can't build something that thin.
	var minY = config.model3d.sides.minHeight;
	var minX = Math.acos(1 - minY / radius);
	points.push([minX, minY]); 

	for (var i = 0; i <= steps; i++) {
		currentAngleRad = i / steps * angleRad;
		x = radius * Math.sin(currentAngleRad);
		y = radius * (1 - Math.cos(currentAngleRad));
		if (x < minX) {
			x = minX;
		}
		if (y < minY) {
			continue;
			y = minY;
		}
		points.push([x,y]);
	}
	var lastPointX = x + extraLength;
	points.push([lastPointX, y]); 
	points.push([lastPointX, 0]); 

	// Offset by extraLength to start at x=0.
	points.forEach(function(point) {
		point[0] -= extraLength;
	});
	return points;
};

KickerModel.prototype.create3dObject = function(config, imageList) {
	var points = this.calculateSidePoints(this.angle, this.radius, config);
	this.representation3d = new Representation3D(this.view, points, this.length, this.angle, this.arc, this.radius, this.width, this.height, imageList, config);
	return this.representation3d;
};

KickerModel.prototype.getRepresentation3d = function() {
	return this.representation3d;
}
