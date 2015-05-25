var Annotation = function(type, options) {
	Part.call(this);

	var mesh;

	if (options.visibilityFunction) {
		this.visibilityFunction_ = options.visibilityFunction;
	} else {
		this.visibilityFunction_ = null;
	}

	switch(type) {
		case Annotation.types.STRAIGHT:
			mesh = this.getStraight_(options);
			break;
		case Annotation.types.CURVED:
			mesh = this.getCurved_(options);
			break;
		case Annotation.types.ANGLE:
			mesh = this.getAngle_(options);
			break;
		default:
			throw new Error('Annotation type not supported: ' + type);
	}

	this.meshes['3d'] = null;
	this.meshes['2d'] = mesh;
};
Annotation.prototype = new Part();

Annotation.prototype.setMeshVisibilityForDisplay = function(data) {
	var visible;
	if (this.visibilityFunction_) {
		visible = this.visibilityFunction_(data);
	} else {
		visible = data.get('annotations');
	}
	this.meshes['2d'].visible = visible;
}

Annotation.prototype.getStraight_ = function(o) {
	var mainObj = new THREE.Object3D();
	mainObj.name = o.name;

	var arrowObj = new Arrow(o.length, o.material, o.hasStartTip, o.hasEndTip);
	var textObj = new Text(o.text, o.material);

	var verticalOffset = (o.switchTextPosition ? 1 : -1) * o.textDistance
	textObj.mesh.position.copy(new THREE.Vector3(o.length / 2 + textObj.offsetX, verticalOffset, 0));

	mainObj.add(arrowObj.mesh);
	mainObj.add(textObj.mesh);
	mainObj.position.copy(o.origin);
	mainObj.rotation.copy(o.rotation);

	return mainObj;
};

Annotation.prototype.getCurved_ = function(o) {
	var mainObj = new THREE.Object3D();
	mainObj.name = o.name;

	var arrowObj = new CurvedArrow(o.arc, o.angle, o.radius, o.distance, o.material);
	var points = arrowObj.points;
	mainObj.add(arrowObj.mesh);

	var textObj = new Text(o.text, o.material);
	mainObj.add(textObj.mesh);
	var angleRad = o.angle * Math.PI / 180;
	textObj.mesh.rotation.z = angleRad / 2;
	textObj.mesh.position.x = (points[0][0] + points[points.length - 1][0]) / 2 + textObj.offsetX /2;
	textObj.mesh.position.y = (points[0][1] + points[points.length - 1][1]) / 2 - 0.15;

	mainObj.position.copy(o.origin);
	return mainObj;
};

Annotation.prototype.getAngle_ = function(o) {
	var mainObj = new THREE.Object3D();
	mainObj.name = o.name;

	var angleObj = new Angle(o.origin, o.angle, o.cornerSide, o.material);
	mainObj.add(angleObj.mesh);

	var textObj = new Text(o.text, o.material);
	textObj.mesh.position.copy(new THREE.Vector3(o.cornerSide, o.textDistance, 0));
	mainObj.add(textObj.mesh);

	mainObj.position.copy(o.origin);
	return mainObj;
};

Annotation.types = {
	STRAIGHT: 'STRAIGHT',
	CURVED: 'CURVED',
	ANGLE: 'ANGLE'
};