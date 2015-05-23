var Annotation = function(type) {
	Part.call(this);

	// Convert arguments to an array, and pop 'type' off.
	var args = Array.prototype.slice.call(arguments);
	args.shift();
	var mesh = null;

	switch(type) {
		case Annotation.types.TWO_SIDED_STRAIGHT:
			mesh = this.getTwoSidedStraight_.apply(this, args);
			break;
		case Annotation.types.ONE_SIDED_STRAIGHT:
			mesh = this.getOneSidedStraight_.apply(this, args);
			break;
		case Annotation.types.TWO_SIDED_CURVED:
			mesh = this.getTwoSidedCurved_.apply(this, args);
			break;
		default:
			throw new Error('Annotation type not supported: ' + type);
	}

	this.meshes['3d'] = null;
	this.meshes['2d'] = mesh;
};
Annotation.prototype = new Part();

Annotation.prototype.getTwoSidedStraight_ = function() {
	var args = Array.prototype.slice.call(arguments);
	// hasStartTip = true;
	args.push(true);
	return this.getStraight_.apply(this, args);
};

Annotation.prototype.getOneSidedStraight_ = function() {
	var args = Array.prototype.slice.call(arguments);
	// hasStartTip = false;
	args.push(false);
	return this.getStraight_.apply(this, args);
};

Annotation.prototype.getStraight_ = function(name, origin, length, text, textDistance, rotation, material, hasStartTip) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrowObj = new Arrow(length, material, hasStartTip);
	var textObj = new Text(text, material);

	textObj.mesh.position.copy(new THREE.Vector3(length / 2 + textObj.offsetX, - textDistance, 0));

	mainObj.add(arrowObj.mesh);
	mainObj.add(textObj.mesh);
	mainObj.position.copy(origin);
	mainObj.rotation.copy(rotation);

	return mainObj;
};

Annotation.prototype.getTwoSidedCurved_ = function(name, arc, angle, radius, text, distance, textDistance, material) {
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

	return mainObj;
};

Annotation.prototype.getAngle_ = function() {

};

Annotation.types = {
	TWO_SIDED_STRAIGHT: 'TWO_SIDED_STRAIGHT',
	ONE_SIDED_STRAIGHT: 'ONE_SIDED_STRAIGHT',
	TWO_SIDED_CURVED: 'TWO_SIDED_CURVED',
	ANGLE: 'ANGLE'
};