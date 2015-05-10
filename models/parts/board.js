var Board = function(kickerLength, kickerWidth, kickerHeight) {
	Part.call(this);

	var mainMesh = this.createMesh(kickerLength, kickerWidth, kickerHeight);
	this.meshes['3d'] = mainMesh;
	this.meshes['2d'] = mainMesh;
};
Board.prototype = new Part();

Board.prototype.createMesh = function(kickerLength, kickerWidth, kickerHeight) {
	var board = new THREE.Object3D();
	board.name = 'mountainboard';

	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.load('./models/board.dae', function onBoardLoaded(collada) {
		var dae = collada.scene;
		dae.scale.set(1.0, 1.0, 1.0);
		board.add(dae);
	});

	var x = 1,
		y = .1;
		z = kickerWidth / 2 + .7;
	board.position.set(x, y, z);
	board.scale.set(.5, .5, .5)
	board.rotateY(10 * Math.PI/64);
	return board;
}

Board.prototype.setMeshVisibilityForDisplay = function(viz) {
	var representation = viz.representationType;
	this.meshes['2d'].visible = false;
	this.meshes['3d'].visible = (representation == '3d' && viz.mountainboard);
}