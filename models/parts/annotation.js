var Annotation = function(type) {
	Part.call(this);

	// Convert arguments to an array, and pop 'type' off.
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	var mesh = null;

	switch(type) {
		case Annotation.types.STRAIGHT:
			mesh = this.getStraight_.apply(this, args);
			break;
		case Annotation.types.CURVED:
			mesh = this.getCurved_.apply(this, args);
			break;
		case Annotation.types.ANGLE:
			mesh = this.getAngle_.apply(this, args);
			break;
		default:
			throw new Error('Annotation type not supported: ' + type);
	}

	this.meshes['3d'] = null;
	this.meshes['2d'] = mesh;
};
Annotation.prototype = new Part();

Annotation.prototype.getStraight_ = function(name, origin, length, text, textDistance, rotation, material, hasStartTip, hasEndTip, switchTextPosition) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrowObj = new Arrow(length, material, hasStartTip, hasEndTip);
	var textObj = new Text(text, material);

	var verticalOffset = (switchTextPosition ? 1 : -1) * textDistance
	textObj.mesh.position.copy(new THREE.Vector3(length / 2 + textObj.offsetX, verticalOffset, 0));

	mainObj.add(arrowObj.mesh);
	mainObj.add(textObj.mesh);
	mainObj.position.copy(origin);
	mainObj.rotation.copy(rotation);

	return mainObj;
};

Annotation.prototype.getCurved_ = function(name, origin, arc, angle, radius, text, distance, textDistance, material) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrowObj = new CurvedArrow(arc, angle, radius, distance, material);
	var points = arrowObj.points;
	mainObj.add(arrowObj.mesh);

	var textObj = new Text(text, material);
	mainObj.add(textObj.mesh);
	var angleRad = angle * Math.PI / 180;
	textObj.mesh.rotation.z = angleRad / 2;
	textObj.mesh.position.x = (points[0][0] + points[points.length - 1][0]) / 2 + textObj.offsetX /2;
	textObj.mesh.position.y = (points[0][1] + points[points.length - 1][1]) / 2 - 0.15;

	mainObj.position.copy(origin);
	return mainObj;
};

Annotation.prototype.getAngle_ = function(name, origin, angle, text, textDistance, material) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var angleObj = new Angle(origin, angle, material);
	mainObj.add(angleObj.mesh);

	var textObj = new Text(text, material);
	textObj.mesh.position.copy(new THREE.Vector3(length / 2 + textObj.offsetX, textDistance, 0));
	mainObj.add(textObj.mesh);

	mainObj.position.copy(origin);
	return mainObj;
};

Annotation.types = {
	STRAIGHT: 'STRAIGHT',
	CURVED: 'CURVED',
	ANGLE: 'ANGLE'
};