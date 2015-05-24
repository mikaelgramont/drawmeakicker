var Representation3D = function(data, points, length, angle, arc, radius, width, height, imageList, config, renderer) {
	this.data = data;
	this.parts = {};
	this.imageList = imageList;
	this.points = points;
	this.renderer = renderer;
	var offset = new THREE.Vector3(0, 0, width / 2);
	this.parts.sideR = this.buildSide(this.points, offset, imageList);
	this.parts.sideL = this.buildSide(this.points, offset.negate(), imageList);
	this.parts.struts = this.buildStruts(length, width, angle, arc, radius);
	this.parts.surface = this.buildSurface(this.points, width);
	this.parts.board = this.buildBoard(length, width, height);

	// Make a copy of the points, and drop the "coping" ones.
	var curvePoints = points.slice(0);
	curvePoints.splice(curvePoints.length - 2);
	this.parts.annotations = this.buildAnnotations(length, width, radius, height, arc, angle, curvePoints);
	
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
	var thickness = config.model3d.struts.side,
		extraLength = config.model3d.sides.extraLength;

	// We need to move the struts back a bit so they sit flush with the end
	// of the ramp. 
	var offsetAngleRad = thickness / (2 * radius);
	var strut,
		offset;
	while(i) {
		var currentAngle = angle * i / strutsCount;
		var currentAngleRad = currentAngle * Math.PI / 180 - offsetAngleRad;
		var y = radius * (1 - Math.cos(currentAngleRad));

		if (y < thickness) {
			// Use a smaller type of strut as the big ones don't fit.
			thickness = config.model3d.struts.smallSide;
		} 
		if (y < thickness) {
			// Can't fit anything anymore.
			break;
		} 

		offset = new THREE.Vector3( - extraLength, 0, 0);
		strut = new Strut(
			strutWidth, thickness, radius, currentAngleRad, offset, this.imageList
		);
		struts.push(strut);
		i--;
	}

	// Add two at the base.
	// One at the lip.
	thickness = config.model3d.struts.side;
	offset = new THREE.Vector3(
		(length - thickness / 2),
		thickness,
		0
	);
	strut = new Strut(
		strutWidth, thickness, null, null, offset, this.imageList
	);
	struts.push(strut);

	// One strut 2/3 of the length from entry to lip.
	offset = new THREE.Vector3(length * 2 / 3 - extraLength, thickness, 0);
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
	var thickness = config.model3d.slats.thickness;

	var slats = [];
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
		slatLength = defaultLength;
		remainingArcLength -= slatLength;

		x = radius * Math.sin(currentAngleRad);
		y = radius * (1 - Math.cos(currentAngleRad));

		offset = new THREE.Vector3(x, y , 0);

		slats.push(new Slat(
			width + 0.125, slatLength, thickness, currentAngle, offset, this.imageList
		));
		i--;
	}
	return slats;
};

Representation3D.prototype.buildMeasurements = function(length, width, radius, height) {
	var distance = 0.3;
	var lengthRotation = new THREE.Euler(0, 0, 0, 'XYZ');
	var lengthPosition = new THREE.Vector3(length / 2, - distance * 1.75, 0);
	return [
		new Measurement(
			'radius',
			this.getHumanReadableDimension_(radius, 'm'),
			new THREE.Vector3(0, radius / 2, 0),
			new THREE.Euler(0, 0, 0, 'XYZ')
		),
		new Measurement(
			'length',
			this.getHumanReadableDimension_(length, 'm'),
			lengthPosition,
			lengthRotation,
			new Arrow(lengthPosition, length, lengthRotation, distance)
		),
		new Measurement(
			'height',
			this.getHumanReadableDimension_(height, 'm'),
			new THREE.Vector3(length + distance, height / 2, 0),
			new THREE.Euler(0, 0, Math.PI / 2, 'XYZ')
		)
	];
};

Representation3D.prototype.buildAnnotations = function(length, width, radius, height, arc, angle, points) {
	var distance = 0.2,
		textDistance = distance,
		material = new THREE.MeshBasicMaterial({color: 0xffffff}),
		angleRad = angle * Math.PI / 180,
		fakeRadiusSize = 2.0;
	return [
		new Annotation(
			Annotation.types.STRAIGHT,
			'length',
			new THREE.Vector3(0, - distance, width / 2),
			length,
			this.getHumanReadableDimension_(length, 'm'),
			textDistance,
			new THREE.Euler(0, 0, 0, 'XYZ'),
			material,
			true,
			true,
			false
		),
		new Annotation(
			Annotation.types.STRAIGHT,
			'width',
			// new THREE.Vector3(length, height + distance, - width / 2),
			new THREE.Vector3(- distance, - distance, - width / 2),
			width,
			this.getHumanReadableDimension_(width, 'm'),
			textDistance,
			new THREE.Euler(0, - Math.PI / 2, 0, 'XYZ'),
			material,
			true,
			true,
			false
		),
		new Annotation(
			Annotation.types.STRAIGHT,
			'height',
			new THREE.Vector3(length + distance, 0, width / 2),
			height,
			this.getHumanReadableDimension_(height, 'm'),
			textDistance,
			new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'),
			material,
			true,
			true,
			false
		),
		new Annotation(
			Annotation.types.STRAIGHT,
			'radius',
			new THREE.Vector3(0, distance, - width / 2),
			fakeRadiusSize - distance,
			this.getHumanReadableDimension_(radius, 'm'),
			textDistance,
			new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'),
			material,
			true,
			false,
			false
		),
		new Annotation(
			Annotation.types.CURVED,
			'arc',
			new THREE.Vector3(0, 0, - width / 2),
			arc,
			angle,
			radius,
			this.getHumanReadableDimension_(arc, 'm'),
			distance,
			textDistance,
			material
		),
		new Annotation(
			Annotation.types.ANGLE,
			'angle',
			new THREE.Vector3(length + distance * Math.cos(angleRad) - config.model3d.sides.extraLength, height + distance * Math.sin(angleRad), - width / 2),
			angle,
			this.getHumanReadableDimension_(angle, '°'),
			.1,
			material
		)
	];
};

Representation3D.prototype.getHumanReadableDimension_ = function(dimension, unit) {
	return dimension.toFixed(2) + unit;
};

Representation3D.prototype.buildBoard = function(length, width, height) {
	var board = new Board(length, width, height, this.renderer);
	return board;
};