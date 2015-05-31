BoundingBoxHelper = function(object, hex) {
	var color = (hex !== undefined) ? hex : 0x888888;
	this.object = object;
	this.box = new Box();
	THREE.Mesh.call(this, new THREE.BoxGeometry(1, 1, 1),
		new THREE.MeshBasicMaterial({color: color, wireframe: true}));
};

BoundingBoxHelper.prototype = Object.create(THREE.Mesh.prototype);
BoundingBoxHelper.prototype.constructor = THREE.BoundingBoxHelper;

BoundingBoxHelper.prototype.update = function(disregardInvisibleObjects) {
	this.box.setFromObject(this.object, disregardInvisibleObjects);
	this.box.size(this.scale);
	this.box.center(this.position);
};
