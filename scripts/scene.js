var EditorScene = function() {};

EditorScene.getCamera = function(canvasEl) {
	var parent = canvasEl.parentElement;
	console.log('parent.clientWidth', parent.clientWidth, 'parent.clientHeight', parent.clientHeight)
	var aspectRatio = parent.clientWidth / parent.clientHeight;
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

	//scene.add(new THREE.AxisHelper(1));
	var gridHelper = new THREE.GridHelper(100,2);
	gridHelper.setColors(0x010845, 0xf8faff);
	scene.add(gridHelper);

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
}

EditorScene.createKicker = function(kicker, config, imageList) {
	var kickerObj = new THREE.Object3D();
	var rep = kicker.model.create3dObject(config, imageList);
	Utils.iterateOverParts(rep.parts, function(part) {
		kickerObj.add(part.mesh);
	});

	kickerObj.position.sub(new THREE.Vector3(1, 0, 0));
	return kickerObj;
};

EditorScene.createGhost = function(kicker, scene) {
	var threshold = Math.PI,
		ghostObj = new THREE.Object3D();

	for(var i = 0, l = kicker.children.length; i < l; i++) {
		var part = kicker.children[i];
		var edges = new THREE.EdgesHelper(part, 0xf8faff, threshold);
		ghostObj.add(edges);
	}
	return ghostObj;
};

	// 	p.push(part.mesh);

	// 	var edges = new THREE.EdgesHelper(part.mesh, 0xf8faff, Math.PI);
	// 	// edges.position.copy(part.mesh.position);
	// 	e.push(edges);
	// 	kickerObj.add(edges);
	// 	kickerObj.add(part.mesh);
	// });

	// window.log = {parts: p, edges: e};

	// kickerObj.position.sub(new THREE.Vector3(1, 0, 0));
	// return kickerObj;


EditorScene.getRenderer = function(canvasEl) {
	var threeRenderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: canvasEl
	});
	threeRenderer.setClearColor(0x3B69D5);
	return threeRenderer;
};

EditorScene.setSize = function(threeRenderer, canvasEl) {
	// TODO: maintain the desired aspect ratio at all times.
	// That means adjusting the height of the canvas element based
	// on the available width, and centering it vertically.
	// The aspect ratio should be a constant, not calculated in the
	// camera instantiation code in getCamera.
	var parent = canvasEl.parentElement;
	threeRenderer.setSize(parent.clientWidth, parent.clientHeight);
}