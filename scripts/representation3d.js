var Representation3D = function(points, length, angle, arc, radius, width, height, imageList, config) {
	this.parts = {};
	this.imageList = imageList;
	this.points = points;
	var offset = new THREE.Vector3(0, 0, width / 2);
	this.parts.sideR = this.buildSide(this.points, offset, imageList);
	this.parts.sideL = this.buildSide(this.points, offset.negate(), imageList);
	this.parts.struts = this.buildStruts(length, width, angle, arc, radius);
	this.parts.surface = this.buildSurface(this.points, width);
	// this.parts.measurements = this.buildMeasurements(length, width, radius, height);
	
	Utils.makeAvailableForDebug('parts', this.parts);
};

Representation3D.prototype.getParts = function() {
	return this.parts;
};

Representation3D.prototype.buildSide = function(points, offset, imageList) {
	var side = new Side(points, offset, imageList);
	return side;
};

Representation3D.prototype.buildStruts = function(length, width, angle, arc, radius) {
	var struts = [];
	var strutWidth = width;
	var strutsCount = Math.ceil(arc / config.model3d.struts.maximumDistance);
	var i = strutsCount;
	var smallStrutSide;
	var thickness = config.model3d.struts.side;

	// We need to move the struts back a bit so they sit flush with the end
	// of the ramp. 
	var offsetAngleRad = thickness / (2 * radius);

	while(i) {
		var currentAngle = angle * i / strutsCount;
		var currentAngleRad = currentAngle * Math.PI / 180 - offsetAngleRad;
		var x = radius * Math.sin(currentAngleRad);
		var y = radius * (1 - Math.cos(currentAngleRad));

		if (y < thickness) {
			// Use a smaller type of strut as the big ones don't fit.
			thickness = config.model3d.struts.smallSide;
		} 
		if (y < thickness) {
			// Can't fit anything anymore.
			break;
		} 

		var strut = new Strut(
			strutWidth, thickness, radius, currentAngleRad, null, this.imageList
		);
		struts.push(strut);
		i--;
	}

	// Add two at the base.
	// One at the lip.
	thickness = config.model3d.struts.side;
	offset = new THREE.Vector3(
		(length + config.model3d.sides.extraLength - thickness / 2),
		thickness,
		0
	);
	var strut = new Strut(
		strutWidth, thickness, null, null, offset, this.imageList
	);
	struts.push(strut);

	// One strut 2/3 of the length from entry to lip.
	offset = new THREE.Vector3(length * 2 / 3, thickness, 0);
	strut = new Strut(
		strutWidth, thickness, null, null, offset, this.imageList
	);
	struts.push(strut);
	return struts;
};

Representation3D.prototype.buildSurface = function(points, width) {
	var surfaceWidth = width + 2 * config.model3d.sides.thickness / 60;
	var surface = new Surface(points, surfaceWidth, this.imageList);
	return surface;	
};

Representation3D.prototype.buildSlats = function(width, angle, arc, radius) {
	var defaultLength = config.model3d.slats.defaultLength;
	var minLength = config.model3d.slats.minLength;
	var thickness = config.model3d.slats.thickness;

	var slats = [];
	var currentSlat;
	var currentAngle = 0;
	var currentAngleRad;
	var remainingArcLength = arc;
	var slatCount = Math.ceil(remainingArcLength / defaultLength);
	var slatLength;
	var i = 0, x, y;
	var offset;
	var angles = [];
	i = slatCount;
	while(i) {
		currentAngle = angle * i / slatCount;
		currentAngleRad = currentAngle * Math.PI / 180;
		angles.push(currentAngle);
		slatLength = defaultLength
		remainingArcLength -= slatLength;

		x = radius * Math.sin(currentAngleRad);
		y = radius * (1 - Math.cos(currentAngleRad));

		offset = new THREE.Vector3(x, y , 0);

		slats.push(new Slat(
			width + .125, slatLength, thickness, currentAngle, offset, this.imageList
		));
		i--;
	}
	return slats;
};

Representation3D.prototype.buildMeasurements = function(length, width, radius, height, rendering) {
	/*
	 TODO: write a function that can generate a text representation.
	 That will then need to be moved/rotated to be on a certain plane
	*/
	return [
		// this.buildTextObject('length', new THREE.Vector3(2, 2, 2), rendering),
		// this.buildTextObject('width',  new THREE.Vector3(3, 3, 3), rendering),
		// this.buildTextObject('radius', new THREE.Vector3(4, 4, 4), rendering),
		this.buildTextObject('height', new THREE.Vector3(length + .3, height / 4, 0), rendering)
	];
};

Representation3D.prototype.buildTextObject = function(text, position, rendering) {
	var geometry = new THREE.TextGeometry(text, {
		size: .15,
		height: 0
	});
	var material = new THREE.MeshLambertMaterial();
	mesh = new THREE.Mesh(geometry, material);
	mesh.position.copy(position);
	mesh.rotation.z = Math.PI / 2;	
	return {mesh: mesh, rendering: rendering};
};