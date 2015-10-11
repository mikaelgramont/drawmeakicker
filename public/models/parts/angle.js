var Angle = function(origin, angleDeg, cornerSide, material) {
	this.origin = origin;
	this.angleDeg = angleDeg;
	this.angleRad = angleDeg * Math.PI / 180;
	this.material = material;

	var mainObj = new THREE.Object3D();
	mainObj.add(this.createCorner_(cornerSide));
	var arcRadius = cornerSide * .6;
	mainObj.add(this.createArc_(arcRadius, 12));

	this.mesh = mainObj;
};

Angle.prototype.createCorner_ = function(side) {
	var cornerGeometry = new THREE.Geometry();
	cornerGeometry.vertices = [
		new THREE.Vector3(side, 0, 0),
		new THREE.Vector3(0, 0, 0),
		new THREE.Vector3(side * Math.cos(this.angleRad), side * Math.sin(this.angleRad), 0)
	];
	
	var corner = new THREE.Line(cornerGeometry, this.material);
	corner.name = 'angleCorner';
	return corner;
};

Angle.prototype.createArc_ = function(radius, steps) {
	var arcGeometry = new THREE.Geometry();

	for (var i = 0; i <= steps; i++) {
		arcGeometry.vertices.push(new THREE.Vector3(
			radius * Math.cos(this.angleRad * i / steps),
			radius * Math.sin(this.angleRad * i / steps),
			0
		));		
	}

	var arc = new THREE.Line(arcGeometry, this.material);
	arc.name = 'angleArc';
	return arc;
};
