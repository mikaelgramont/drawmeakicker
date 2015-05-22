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

Annotation.prototype.getTwoSidedStraight_ = function(name, origin, length, text, textDistance, rotation, material) {
	var args = Array.prototype.slice.call(arguments);
	// hasStartTip = true;
	args.push(true);
	return this.getStraight_.apply(this, args);
};

Annotation.prototype.getOneSidedStraight_ = function(name, origin, length, text, textDistance, rotation, material) {
	var args = Array.prototype.slice.call(arguments);
	// hasStartTip = false;
	args.push(false);
	return this.getStraight_.apply(this, args);
};

Annotation.prototype.getStraight_ = function(name, origin, length, text, textDistance, rotation, material, hasStartTip) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrow = new Arrow(length, material, hasStartTip);
	var text = new Text(text, material);

	text.mesh.position.copy(new THREE.Vector3(length / 2 + text.offset, - textDistance, 0));

	mainObj.add(arrow.mesh);
	mainObj.add(text.mesh);
	mainObj.position.copy(origin);
	mainObj.rotation.copy(rotation);

	return mainObj;
};

Annotation.prototype.getTwoSidedCurved_ = function(name, origin, arc, angle, points, text, textDistance, material) {
	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrow = new CurvedArrow(points, arc, angle, material);
	mainObj.add(arrow.mesh);
	var text = new Text(text, material);
	mainObj.add(text.mesh);
	var angleRad = angle * Math.PI / 180;
	text.mesh.rotation.z = angleRad / 2;
	text.mesh.position.x = (points[0][0] + points[points.length - 1][0]) / 2;
	text.mesh.position.y = (points[0][1] + points[points.length - 1][1]) / 2;

	mainObj.position.copy(origin);

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