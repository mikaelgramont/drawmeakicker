var Strut = function(width, thickness, radius, currentAngleRad, offset, imageList) {
	Part.call(this);

	this.thickness = thickness;
	this.imageList = imageList;
	var mainMesh = this.createMesh(width, thickness, radius, currentAngleRad, offset);
	this.meshes['3d'] = mainMesh;
	this.meshes['2d'] = this.createGhostFor(mainMesh);
};
Strut.prototype = new Part();

Strut.prototype.createMesh = function(width, thickness, radius, currentAngleRad, offset) {
	var geometry = this.buildGeometry(width, thickness);
	var material = new THREE.MeshLambertMaterial({
        map: THREE.ImageUtils.loadTexture(this.imageList.getImageUrl('strut'))
    });
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'Strut';
	if (radius) {
		// Rotate the vertices to follow the kicker profile.
		this.positionByAngle(mesh, radius, currentAngleRad);
	}
	if (offset) {
		this.applyOffset(mesh, offset);
	}

	return mesh;
};

Strut.prototype.buildGeometry = function(width, thickness) {
	var geometry = new THREE.BoxGeometry(thickness, thickness, width);
	return geometry;
};

Strut.prototype.positionByAngle = function(mesh, radius, angle) {
	var offset = new THREE.Vector3(0, -radius - this.thickness/2, 0);
	var radiusYOffset = new THREE.Vector3(0, radius, 0);
	mesh.geometry.vertices.forEach(function(vertex) {
		// 1. Move all the points down by radius.
 		vertex.add(offset);
		// 2. Rotate them by angle.
 		var m4 = new THREE.Matrix4();
 		m4.set(
 			  Math.cos(-angle), Math.sin(-angle), 0, 0,
 			- Math.sin(-angle), Math.cos(-angle), 0, 0,
 			0, 0, 1, 0,
 			0, 0, 0, 1
 		);
 		vertex.applyMatrix4(m4);
		// 3. Move the position up by radius
 		vertex.add(radiusYOffset);
	});
};

Strut.prototype.applyOffset = function(mesh, offset) {
	mesh.geometry.vertices.forEach(function(vertex) {
 		vertex.add(offset);
	});	
};