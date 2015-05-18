var Part = function() {
	this.meshes = {
		'2d': null,
		'3d': null
	};
};

Part.prototype.setMeshVisibilityForDisplay = function(data) {
	var representation = data.get('repType');
	for (rep in this.meshes) {
		if (!this.meshes[rep]) {
			continue;
		}
		this.meshes[rep].visible = false;
	}

	if (representation == '2d' || !data.get('textured')) {
		if (this.meshes['2d']) {
			this.meshes['2d'].visible = true;
		}
	} else {
		if (this.meshes['3d']) {
			this.meshes['3d'].visible = true;
		}			
	}
}

Part.prototype.createGhostFor = function(obj) {
	var threshold = Math.PI,
		ghostObj = new THREE.Object3D();

	var edges = new THREE.EdgesHelper(obj, 0xf8faff, threshold);
	ghostObj.add(edges);
	return ghostObj;
};

Part.prototype.getTexture = function(url) {
	return THREE.ImageUtils.loadTexture(url, undefined, this.requestRedraw_.bind(this));
};

Part.prototype.requestRedraw_ = function() {
	var event = new Event('renderer-redraw-request');
	document.body.dispatchEvent(event);
}