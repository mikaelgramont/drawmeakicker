var Annotation = function(name, origin, length, text, textDistance, rotation, material) {
	Part.call(this);

	var mainObj = new THREE.Object3D();
	mainObj.name = name;

	var arrow = new Arrow(length, material);
	var text = new Text(text, material);

	text.mesh.position.copy(new THREE.Vector3(length / 2 + text.offset, - textDistance, 0));

	mainObj.add(arrow.mesh);
	mainObj.add(text.mesh);
	mainObj.position.copy(origin);
	mainObj.rotation.copy(rotation);

	this.meshes['3d'] = null;
	this.meshes['2d'] = mainObj;
};
Annotation.prototype = new Part();