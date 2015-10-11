var Measurement = function(name, text, position, rotation, arrow) {
	Part.call(this);

	var material = new THREE.MeshBasicMaterial(0xfff),
		mesh = this.createMesh(name, text, material, rotation);

	var bb = mesh.geometry.boundingBox;
	var size = bb.max.sub(bb.min);
	var finalPosition = position.clone().sub(size.divideScalar(2));
	mesh.position.copy(finalPosition);
	if (arrow) {
		mesh.add(arrow);
	}

	this.meshes['3d'] = null;
	this.meshes['2d'] = mesh;
};
Measurement.prototype = new Part();

Measurement.prototype.createMesh = function(name, text, material, rotation) {
	var geometry = this.buildGeometry(text, rotation);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'Text - '+ name + ' - ' + text;
	return mesh;
};

Measurement.prototype.buildGeometry = function(text, rotation) { 
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

Measurement.prototype.setMeshVisibilityForDisplay = function(data) {
	var representation = data.get('repType');
	for (rep in this.meshes) {
		if (!this.meshes[rep]) {
			continue;
		}
		this.meshes[rep].visible = false;
	}

	if (representation == '2d') {
		this.meshes['2d'].visible = true;
	}
}