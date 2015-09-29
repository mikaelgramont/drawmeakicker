var Representation3D = function(data, sidePoints, surfaceSidePoints, length, angle, arc, radius, width, height, imageList, config, renderer) {
	var offset = new THREE.Vector3(0, 0, width / 2);

	this.data = data;
	this.parts = {};
	this.imageList = imageList;
	this.sidePoints = sidePoints;
	this.surfaceSidePoints = surfaceSidePoints;
	this.renderer = renderer;
	this.parts.grid = this.buildGrid();
	this.parts.sideR = this.buildSide(this.sidePoints, offset, imageList);
	this.parts.sideL = this.buildSide(this.sidePoints, offset.negate(), imageList);
	this.parts.struts = this.buildStruts(length, width, angle, arc, radius);
	this.parts.surface = this.buildSurface(this.surfaceSidePoints, width);
	this.parts.board = this.buildBoard(length, width, height);

	// Make a copy of the points, and drop the "coping" ones.
	var curvePoints = sidePoints.slice(0);
	curvePoints.splice(curvePoints.length - 2);
	var annotations = this.buildAnnotations(length, width, radius, height, arc, angle, curvePoints, config);
	for (key in annotations) {
		this.parts[key] = annotations[key];
	}
	
	Utils.makeAvailableForDebug('parts', this.parts);
};

Representation3D.prototype.getParts = function() {
	return this.parts;
};

Representation3D.prototype.buildGrid = function() {
	return new Grid();
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
	var minY = config.model3d.sides.minHeight;
	var minX = Math.acos(1 - minY / radius);

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

		offset = new THREE.Vector3(0, 0, 0);
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
		(length - thickness),
		thickness,
		0
	);
	strut = new Strut(
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

Representation3D.prototype.buildAnnotations = function(length, width, radius, height, arc, angle, points, config) {
	var distance = 0.2,
		textDistance = distance,
		material = new THREE.MeshBasicMaterial({color: 0xffffff}),
		lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2}),
		angleRad = angle * Math.PI / 180,
		fakeRadiusSize = 2.0,
		angleX = length + distance * Math.cos(angleRad) - config.model3d.sides.extraLength,
		angleY = height + distance * Math.sin(angleRad);
	return {
		length: new Annotation(Annotation.types.STRAIGHT, {
			name: 'length',
			origin: new THREE.Vector3(0, - distance, width / 2),
			length: length,
			text: this.getHumanReadableDimension_(length, config.units),
			textDistance: textDistance,
			rotation: new THREE.Euler(0, 0, 0, 'XYZ'),
			material: material,
			lineMaterial: lineMaterial,
			hasStartTip: true,
			hasEndTip: true,
			switchTextPosition: false
		}),
		width: new Annotation(Annotation.types.STRAIGHT, {
			name: 'width',
			origin: new THREE.Vector3(angleX - .02, angleY, - width / 2),
			length: width,
			text: this.getHumanReadableDimension_(width, config.units),
			textDistance: textDistance,
			rotation: new THREE.Euler(0, - Math.PI / 2, 0, 'XYZ'),
			material: material,
			lineMaterial: lineMaterial,
			hasStartTip: true,
			hasEndTip: true,
			switchTextPosition: true,
			visibilityFunction: function(data) {
				return data.get('repType') == '3d' && data.get('annotations');
			}
		}),
		height: new Annotation(Annotation.types.STRAIGHT, {
			name: 'height',
			origin: new THREE.Vector3(length + distance, 0, width / 2),
			length: height,
			text: this.getHumanReadableDimension_(height, config.units),
			textDistance: textDistance,
			rotation: new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'),
			material: material,
			lineMaterial: lineMaterial,
			hasStartTip: true,
			hasEndTip: true,
			switchTextPosition: false
		}),
		radius: new Annotation(Annotation.types.STRAIGHT, {
			name: 'radius',
			origin: new THREE.Vector3(0, distance, - width / 2),
			length: fakeRadiusSize - distance,
			text: this.getHumanReadableDimension_(radius, config.units),
			textDistance: textDistance,
			rotation: new THREE.Euler(0, 0, Math.PI / 2, 'XYZ'),
			material: material,
			lineMaterial: lineMaterial,
			hasStartTip: true,
			hasEndTip: false,
			switchTextPosition: false
		}),
		arc: new Annotation(Annotation.types.CURVED, {
			name: 'arc',
			origin: new THREE.Vector3(0, 0, - width / 2),
			arc: arc,
			angle: angle,
			radius: radius,
			text: this.getHumanReadableDimension_(arc, config.units),
			distance: distance,
			textDistance: textDistance,
			material: material,
			lineMaterial: lineMaterial
		}),
		angle: new Annotation(Annotation.types.ANGLE, {
			name: 'angle',
			origin: new THREE.Vector3(angleX, angleY, width / 2),
			angle: angle,
			text: this.getHumanReadableDimension_(angle, config.UNIT_DEGREES),
			cornerSide: .25,
			textDistance: .1,
			material: material,
			lineMaterial: lineMaterial
		})
	};
};

Representation3D.prototype.getHumanReadableDimension_ = function(dimension, unit) {
	if (unit == config.UNIT_METERS) {
		return dimension.toFixed(2) + 'm';	
	}
	if (unit == config.UNIT_DEGREES) {
		return dimension.toFixed(0) + '°';	
	}
	
	if (unit == config.UNIT_FEET) {
		return Utils.metersToDumb(dimension);	
	}

	throw new Error("Unit '" + unit + "' not supported");
};

Representation3D.prototype.buildBoard = function(length, width, height) {
	var board = new Board(length, width, height, this.renderer);
	return board;
};