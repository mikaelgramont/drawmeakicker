var KickerModel = function(data) {
	this.data = data;
	this.processDataParameters();
};

KickerModel.prototype.processDataParameters = function() {
	this.readData();
	this.calculate();
	this.refreshData();
};

KickerModel.prototype.readData = function() {
	this.height = this.data.get('height');
	this.width = this.data.get('width');
	this.angle = this.data.get('angle');
};

KickerModel.prototype.refreshData = function() {
	this.data.set('radius', this.radius);
	this.data.set('length', this.length);
	this.data.set('arc', this.arc);
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
      l = h * Math.sin(alphaRad) / (1 - Math.cos(alphaRad)) + config.model3d.sides.extraLength;
  return l;    
}

KickerModel.prototype.calculateArc = function(radius, alphaDeg) {
  var arc = radius * alphaDeg * Math.PI / 180;
  return arc;
}

KickerModel.prototype.create3dObject = function(config, imageList, renderer) {
	var sidePoints = this.calculateSidePoints_(this.angle, this.radius, config);
	var surfacePoints = this.calculateSurfacePoints_(this.angle, this.radius, config, config.model3d.surface.thickness);

	this.representation3d = new Representation3D(this.data, sidePoints, surfacePoints, this.length, this.angle, this.arc, this.radius, this.width, this.height, imageList, config, renderer);
	return this.representation3d;
};

KickerModel.prototype.calculateSidePoints_ = function(angle, radius, config) {
	var minY = config.model3d.sides.minHeight;
	var minX = Math.acos(1 - minY / this.radius);

	var points = this.calculatePoints_(minX, minY, angle, radius, config);
	var lastPoint = points[points.length - 1];
	var extraLength = config.model3d.sides.extraLength;
	
	// Extend the sides a bit so we have room for a strut at the top
	points.push([lastPoint[0] + extraLength, lastPoint[1]]); 
	points.push([lastPoint[0] + extraLength, 0]); 

	points.unshift([points[0][0], 0]);

	return points;
};

KickerModel.prototype.calculateSurfacePoints_ = function(angle, radius, config, thickness) {
	var points = this.calculatePoints_(0, 0, angle, radius, config);
	var steps = points.length;
	var angleRad = angle * Math.PI / 180;

	for (l = points.length - 1, i = l; i >= 0; i--) {
		var currentAngleRad = i / steps * angleRad;
		x = points[i][0] - thickness * Math.sin(currentAngleRad);
		y = points[i][1] + thickness * Math.cos(currentAngleRad);

		points.push([x, y]);
	}

	return points;
};

KickerModel.prototype.calculatePoints_ = function(minX, minY, angle, radius, config, thickness) {
	var angleRad = angle * Math.PI / 180;
	var steps = config.model3d.sides.steps;
	var currentAngleRad, x, y;

	var points = [];
	for (var i = 0; i <= steps; i++) {
		currentAngleRad = i / steps * angleRad;
		x = radius * Math.sin(currentAngleRad);
		y = radius * (1 - Math.cos(currentAngleRad));
		if (y < minY) {
			continue;
		}
		points.push([x, y]);
	}

	return points;
};

KickerModel.prototype.getRepresentation3d = function() {
	return this.representation3d;
}
