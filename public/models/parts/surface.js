var Surface = function(points, width, imageList) {
	Part.call(this);
	
	this.points = points.slice(0);
	this.width = width;
	this.imageList = imageList;
	var mainMesh = this.createMesh(this.points, width + config.model3d.sides.thickness * 2);
	this.meshes['3d'] = mainMesh;
	this.meshes['2d'] = this.createGhostFor(mainMesh);
};
Surface.prototype = new Part();

Surface.prototype.createMesh = function(points, width) {
	var geometry = this.buildGeometry(points, width);
	var woodMap = this.getTexture(this.imageList.getImageUrl('side'));
	var material = new THREE.MeshLambertMaterial({
        map: woodMap
    });	
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = 'Surface';
	return mesh;
};

Surface.prototype.buildGeometry = function(points, width) {
	var shape = new THREE.Shape();
	shape.moveTo(points[0][0], points[0][1]);
	for (var i = 1, l = points.length; i < l; i++) {
		shape.lineTo(points[i][0], points[i][1]);
	}

	var extrudeSettings = {
		amount: width,
		bevelSize: 0,
		bevelSegments: 1,
		bevelThickness: 0
	};
	var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

	var offset = new THREE.Vector3(0, 0, - width / 2);
	geometry.vertices.forEach(function(vertex) {
 		vertex.add(offset);
	});	

	Utils.setupUVMapping(geometry, 'z', 'y');

	return geometry;
};