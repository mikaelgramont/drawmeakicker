var Text = function(text, position, rotation) {
	Part.call(this);

	var material = new THREE.MeshLambertMaterial(),
		mesh = this.createMesh(text, material);

	mesh.position.copy(position);
	if (rotation) {
		mesh.rotation.copy(rotation);
	}

	this.meshes['3d'] = mesh;
	this.meshes['2d'] = mesh;
};
Text.prototype = new Part();

Text.prototype.createMesh = function(text, material) {
	var geometry = this.buildGeometry(text);
	var mesh = new THREE.Mesh(geometry, material);
	return mesh;
};

Text.prototype.buildGeometry = function(text) { 
	var geometry = new THREE.TextGeometry(text, {
		size: .15,
		height: 0
	});
	return geometry;
};