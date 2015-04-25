var Part = function() {
	this.meshes = {
		'2d': null,
		'3d': null
	};
};

Part.prototype.getMeshForDisplay = function(representation) {
	return this.meshes[representation];
}

Part.prototype.createGhostFor = function(obj) {
	var threshold = Math.PI,
		ghostObj = new THREE.Object3D();

	var edges = new THREE.EdgesHelper(obj, 0xf8faff, threshold);
	ghostObj.add(edges);
	return ghostObj;
};

