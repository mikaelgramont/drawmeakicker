var Text = function(text, material) {
	this.mesh = this.createMesh(text, material);
};

Text.prototype.createMesh = function(text, material) {
	var geometry = this.buildGeometry(text);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'Text - ' + ' - ' + text;

	var bb = geometry.boundingBox;
	var size = bb.max.sub(bb.min);
	this.offsetX = - size.x / 2;
	this.offsetY = - size.y / 2;
	return mesh;
};

Text.prototype.buildGeometry = function(text) { 
	var geometry = new THREE.TextGeometry(text, {
		size: .15,
		height: 0,
		font: "archer medium"
	});
	geometry.computeBoundingBox();
	return geometry;
};