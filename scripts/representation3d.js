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
	this.parts.measurements = this.buildMeasurements(length, width, radius, height);
	this.parts.board = this.buildBoard(length, width, height);
	
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
	var thickness = config.model3d.struts.side,
		extraLength = config.model3d.sides.extraLength;

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

		var offset = new THREE.Vector3( - extraLength, 0, 0);
		var strut = new Strut(
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
	var strut = new Strut(
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

Representation3D.prototype.buildMeasurements = function(length, width, radius, height) {
	var distance = .3;
	var dimensions = this.data.getHumanReadableDimensions();
	return [
		new Text(
			'radius',
			dimensions.radius,
			new THREE.Vector3(0, height, 0),
			new THREE.Euler(0, 0, 0, 'XYZ')
		),
		// new Text(
		// 	'width',
		// 	dimensions.width,
		// 	new THREE.Vector3(length, height + distance, 0),
		// 	new THREE.Euler(0, 0 / 2, 0, 'XYZ')
		// ),
		new Text(
			'length',
			// 'abcdefghijklmnopqrstuvwxyz0123456789,;.',
			dimensions.length,
			new THREE.Vector3(length / 2, - distance, 0),
			new THREE.Euler(0, 0, 0, 'XYZ')
		),
		new Text(
			'height',
			dimensions.height,
			new THREE.Vector3(length + distance, height / 2, 0),
			new THREE.Euler(0, 0, Math.PI / 2, 'XYZ')
		)
	];
}

Representation3D.prototype.buildBoard = function(length, width, height) {
	var board = new Board(length, width, height, this.renderer);
	return board;
};