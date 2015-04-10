var EditorScene = function() {};

EditorScene.getCamera = function(canvasEl) {
	var aspectRatio = canvasEl.clientWidth / canvasEl.clientHeight;
	var camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 1000);
	camera.position.x = 4.2;
	camera.position.y = 1.2;
	camera.position.z = 1.2;
	camera.rotation.y = 1.0600000000000007;
	window.camera = camera;
	return camera;	
};

EditorScene.getScene = function() {
	var scene = new THREE.Scene();

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(300, 10, 300);
	scene.add(light);

	var light2 = new THREE.DirectionalLight(0xffffff);
	light2.position.set(-100, 200, -120);
	scene.add(light2);	

	scene.add(new THREE.AxisHelper(1));
	scene.add(new THREE.GridHelper(100,2));

	return scene;
};

EditorScene.setupContent = function(scene, kicker, config, imageList) {
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.load('./models/board.dae', function onBoardLoaded(collada) {
		var dae = collada.scene;
		dae.scale.set(1.0, 1.0, 1.0);
		
		var boardGroup = new THREE.Object3D();
		boardGroup.add(dae);
		boardGroup.position.set(5, 0, -5);
		boardGroup.scale.set(.5, .5, .5)
		boardGroup.rotateY(10 * Math.PI/64);
		scene.add(boardGroup);
	});

	var kickerObj = new THREE.Object3D();
	window.kicker = kickerObj;

	var rep = kicker.model.create3dObject(config, imageList);
	Utils.iterateOverParts(rep.parts, function(part) {kickerObj.add(part.mesh);});

	kickerObj.position.x = -1;
	scene.add(kickerObj);
};

EditorScene.getRenderer = function(canvasEl) {
	var threeRenderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: canvasEl
	});
	threeRenderer.setClearColor(0xf0f0f0);
	threeRenderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight);
	return threeRenderer;
};