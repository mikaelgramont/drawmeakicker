var CurvedArrow = function(arc, exitAngle, radius, distance, material) {
	var angleOffset = 5;
	var points = this.calculatePoints(angleOffset, exitAngle - angleOffset, radius, distance);

	var mainObj = new THREE.Object3D();

    var tipSize = 0.05;
    var startTip = this.createStartTip(points[0], tipSize, material);
	mainObj.add(startTip);

    var line = this.createLine(points, material);
	mainObj.add(line);

    var endTip = this.createEndTip(points[points.length - 1], tipSize, arc - .05, exitAngle + angleOffset, material);
	mainObj.add(endTip);
	this.mesh = mainObj;
	this.points = points;
};

CurvedArrow.prototype.createLine = function(points, material) {
	var lineGeometry = new THREE.Geometry();
    points.forEach(function(point) {
		lineGeometry.vertices.push(new THREE.Vector3(point[0], point[1], 0));
    });
	var line = new THREE.Line(lineGeometry, material);

	return line;
};

CurvedArrow.prototype.createStartTip = function(origin, tipSize, material) {
	var start = new THREE.Vector3(tipSize + origin[0], -tipSize / 2 + origin[1], 0);
	var mid = new THREE.Vector3(0 + origin[0], 0 + origin[1], 0);
	var end = new THREE.Vector3(tipSize + origin[0], tipSize / 2 + origin[1], 0);

	var startTipGeometry = new THREE.Geometry();
    startTipGeometry.vertices.push(start);
    startTipGeometry.vertices.push(mid);
    startTipGeometry.vertices.push(end);
    var startTip = new THREE.Line(startTipGeometry, material);
    
    return startTip;
};

CurvedArrow.prototype.createEndTip = function(origin, tipSize, arc, angle, material) {
    var angleRad = angle * Math.PI / 180;
    var rot = new THREE.Euler(0, 0, angleRad, 'XYZ');
	var endTipGeometry = new THREE.Geometry();

    endTipGeometry.vertices.push(new THREE.Vector3(-tipSize, -tipSize / 2, 0));
    endTipGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    endTipGeometry.vertices.push(new THREE.Vector3(-tipSize, + tipSize / 2, 0));
    endTipGeometry.vertices.forEach(function(vertex) {
    	vertex.applyEuler(rot);
    	vertex.add(new THREE.Vector3(origin[0], origin[1]));
    });
    var endTip = new THREE.Line(endTipGeometry, material);
    
    return endTip;
};

CurvedArrow.prototype.calculatePoints = function(angleStart, angleEnd, actualRadius, distance) {
	var points = [];

	// Reduce the radius a bit so the curve sits a little far from the kicker.
	var radius = actualRadius - distance,
		extraLength = config.model3d.sides.extraLength;

	var angleStartRad = angleStart * Math.PI / 180;
	var angleEndRad = angleEnd * Math.PI / 180;
	var steps = 20;
	var currentAngleRad, x, y;

	for (var i = 0; i <= steps; i++) {
		currentAngleRad = i / steps * (angleEndRad - angleStartRad) + angleStartRad;
		x = radius * Math.sin(currentAngleRad);
		y = radius * (1 - Math.cos(currentAngleRad));
		points.push([x,y]);
	}

	points.forEach(function(point) {
		point[0] -= extraLength;
		point[1] += distance;
	});
	return points;
};

