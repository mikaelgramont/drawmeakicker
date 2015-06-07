var Board = function(kickerLength, kickerWidth, kickerHeight, renderer) {
	Part.call(this);

	this.length = kickerLength;
	this.width = kickerWidth;
	this.height = kickerHeight;
	this.renderer = renderer;

	this.createMeshes();
};
Board.prototype = new Part();

Board.prototype.createMeshes = function() {
	var board = this.renderer.getModel('board');
	if (!board.name) {
		// Model has not started loading yet.
		var loader = new THREE.ColladaLoader();
		loader.options.convertUpAxis = true;
		loader.load('./models/board.dae', this.onBoardLoaded.bind(this));
	}

	var x = .5,
		y = .1;
		z = this.width / 2 + 1;
	board.position.set(x, y, z);
	board.scale.set(.5, .5, .5)
	board.rotation.set(0, 10 * Math.PI / 64, 0);

	this.meshes['3d'] = board;
	this.meshes['2d'] = board;
}

Board.prototype.onBoardLoaded = function(collada) {
	var board = collada.scene;
	// Mark as loaded
	board.name = 'mountainboard';
	this.renderer.replaceModel('board', board);
	this.createMeshes();
};

Board.prototype.setMeshVisibilityForDisplay = function(data) {
	var representation = data.get('repType');
	this.meshes['2d'].visible = false;
	this.meshes['3d'].visible = (representation == '3d' && data.get('mountainboard'));
};