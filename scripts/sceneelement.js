var SceneElement = function() {
	THREE.Object3D.call(this);
};

SceneElement.prototype = Object.create(THREE.Object3D.prototype, {
	setupForRepresentation: function(representationType) {
		throw new Error('setupForRepresentation not implemented');
	}
});

SceneElement.prototype.constructor = SceneElement;