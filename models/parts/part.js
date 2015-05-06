var Part = function() {
	this.meshes = {
		'2d': null,
		'3d': null
	};
};

Part.prototype.setMeshVisibilityForDisplay = function(representation) {
	for (rep in this.meshes) {
		this.meshes[rep].visible = false;
	}
	return this.meshes['2d'].visible = true;
}

Part.prototype.createGhostFor = function(obj) {
	var threshold = Math.PI,
		ghostObj = new THREE.Object3D();

	var edges = new THREE.EdgesHelper(obj, 0xf8faff, threshold);
	ghostObj.add(edges);
	return ghostObj;
};

