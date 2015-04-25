var EditorScene = function() {};

EditorScene.getCameras = function(canvasEl) {
	var parent = canvasEl.parentElement;
	var persp = EditorScene.getPerspectiveCamera_(parent);
	var ortho = EditorScene.getOrthoCamera_(parent);

	return {
		perspective: persp,
		ortho: ortho
	};	
};

EditorScene.getPerspectiveCamera_ = function(el) {
	var aspectRatio = el.clientWidth / el.clientHeight;
	var camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 1000);

	camera.position.copy(new THREE.Vector3(
		-2.953021168199046,
		2.9067382584295327,
		2.3965944941147135
	));
	return camera;
};

EditorScene.getOrthoCamera_ = function(el) {
	var w = 5
	var h = w * el.clientHeight / el.clientWidth;
	var viewSize = h;
	var aspectRatio = w / h;

	var viewport = {
	    viewSize: viewSize,
	    aspectRatio: aspectRatio,
	    left: (-aspectRatio * viewSize) / 2,
	    right: (aspectRatio * viewSize) / 2,
	    top: viewSize / 2,
	    bottom: -viewSize / 2,
	    near: -10,
	    far: 10
	}

	var camera = new THREE.OrthographicCamera ( 
	    viewport.left, 
	    viewport.right, 
	    viewport.top, 
	    viewport.bottom, 
	    viewport.near, 
	    viewport.far 
	);

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
	gridHelper.setColors(0xf8faff, 0x010845);
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

EditorScene.createKicker = function(kicker, config, imageList, representation) {
	var kickerObj = new THREE.Object3D();
	var rep = kicker.model.create3dObject(config, imageList);
	Utils.iterateOverParts(rep.parts, function(part) {
		kickerObj.add(part.getMeshForDisplay(representation));
	});

	kickerObj.position.sub(new THREE.Vector3(1, 0, 0));
	return kickerObj;
};

EditorScene.getRenderer = function(canvasEl) {
	var threeRenderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: canvasEl,
		alpha: true
	});
	return threeRenderer;
};

EditorScene.setSize = function(threeRenderer, canvasEl) {
	// TODO: maintain the desired aspect ratio at all times.
	// That means adjusting the height of the canvas element based
	// on the available width, and centering it vertically.
	// The aspect ratio should be a constant, not calculated in the
	// camera instantiation code in getCamera.
	var parent = canvasEl.parentElement;
	threeRenderer.setSize(parent.clientWidth, parent.clientHeight, false);
}