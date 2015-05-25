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
      l = h * Math.sin(alphaRad) / (1 - Math.cos(alphaRad));
  return l;    
}

KickerModel.prototype.calculateArc = function(radius, alphaDeg) {
  var arc = radius * alphaDeg * Math.PI / 180;
  return arc;
}

KickerModel.prototype.calculateSidePoints_ = function(minX, minY, angle, radius, config) {
	// The first point is calculated outside of the loop because it must
	// account for a minimum height of the sides, otherwise it looks too
	// 'perfect': you can't build something that thin.
	var firstPoint = [minX, minY]; 

	var points = this.calculatePoints_([firstPoint], minX, minY, angle, radius, config);
	var lastPoint = points[points.length - 1];
	var extraLength = config.model3d.sides.extraLength;
	points.push([lastPoint[0] + extraLength, lastPoint[1]]); 
	points.push([lastPoint[0] + extraLength, 0]); 

	return points;
};

KickerModel.prototype.calculateSurfaceSidePoints_ = function(minX, minY, angle, radius, config, thickness) {
	return this.calculatePoints_([], minX, minY, angle, radius, config);
};

KickerModel.prototype.calculatePoints_ = function(points, minX, minY, angle, radius, config, thickness) {
	var angleRad = angle * Math.PI / 180;
	var steps = config.model3d.sides.steps;
	var currentAngleRad, x, y;

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
		points.push([x - minX, y]);
	}

	return points;
};

KickerModel.prototype.create3dObject = function(config, imageList, renderer) {
	var minY = config.model3d.sides.minHeight;
	var minX = Math.acos(1 - minY / this.radius);

	var sidePoints = this.calculateSidePoints_(minX, minY, this.angle, this.radius, config);
	var surfacePoints = this.calculateSidePoints_(minX, minY, this.angle, this.radius, config, config.model3d.surface.thickness);
	this.representation3d = new Representation3D(this.data, sidePoints, surfacePoints, this.length, this.angle, this.arc, this.radius, this.width, this.height, imageList, config, renderer);
	return this.representation3d;
};

KickerModel.prototype.getRepresentation3d = function() {
	return this.representation3d;
}
