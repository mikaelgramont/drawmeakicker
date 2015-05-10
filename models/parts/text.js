var Text = function(name, text, position, rotation) {
	Part.call(this);

	var material = new THREE.MeshLambertMaterial(0xfff),
		mesh = this.createMesh(name, text, material, rotation);

	var bb = mesh.geometry.boundingBox;
	var size = bb.max.sub(bb.min);
	var finalPosition = position.sub(size.divideScalar(2));
	mesh.position.copy(finalPosition);

	this.meshes['3d'] = null;
	this.meshes['2d'] = mesh;
};
Text.prototype = new Part();

Text.prototype.createMesh = function(name, text, material, rotation) {
	var geometry = this.buildGeometry(text, rotation);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'Text - '+ name + ' - ' + text;
	return mesh;
};

Text.prototype.buildGeometry = function(text, rotation) { 
	var geometry = new THREE.TextGeometry(text, {
		size: .15,
		height: 0,
		font: "archer medium"
	});
	if (rotation) {
		// Rotate individual vertices so we can just move
		// the object around later
		geometry.vertices.forEach(function(vertex) {
			vertex.applyEuler(rotation);
		});
	}
	geometry.computeBoundingBox();
	return geometry;
};