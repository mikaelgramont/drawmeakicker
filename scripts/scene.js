var EditorScene = function() {};

EditorScene.createCameras = function(canvasEl, kickerObj) {
	var parent = canvasEl.parentElement;
	var persp = EditorScene.createPerspectiveCamera_(parent);
	var ortho = EditorScene.createOrthoCamera_(parent, kickerObj);

	return {
		perspective: persp,
		ortho: ortho
	};	
};

EditorScene.createPerspectiveCamera_ = function(el) {
	var aspectRatio = el.clientWidth / el.clientHeight;
	var camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 1000);

	camera.position.copy(new THREE.Vector3(
		-1.953021168199046,
		2.9067382584295327,
		2.6965944941147135
	));
	return camera;
};

EditorScene.createOrthoCamera_ = function(el, kickerObj) {
	var aspectRatio = el.clientWidth / el.clientHeight,
		bb = new THREE.BoundingBoxHelper(kickerObj),
		margin = 0.2,
		w, h;
	bb.update();

	var xRange = Math.ceil(bb.box.max.x - bb.box.min.x),
		yRange = Math.ceil(bb.box.max.y - bb.box.min.y);

	xRange += xRange % 3;
	yRange += yRange % 3;

	var xCenter = (bb.box.max.x + bb.box.min.x) / 2,
		yCenter = (bb.box.max.y + bb.box.min.y) / 2;

	if (xRange > yRange) {
		w = xRange;
		h = w / aspectRatio;
	} else {
		h = yRange;
		w = h * aspectRatio;
	}

	var viewSize = h;
	var viewport = {
	    viewSize: viewSize,
	    aspectRatio: aspectRatio,
	    left: xCenter - w / 2,
	    right: xCenter + w / 2,
	    top: yCenter + h / 2,
	    bottom: yCenter - h / 2,
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

	// scene.add(new THREE.AxisHelper(1));
	var gridHelper = new THREE.GridHelper(100,2);
	gridHelper.setColors(0xf8faff, 0x010845);
	scene.add(gridHelper);

	return scene;
};

EditorScene.createKicker = function(kicker, config, imageList, viz, models) {
	var kickerObj = new THREE.Object3D();
	var rep = kicker.model.create3dObject(config, imageList, models);
	Utils.iterateOverParts(rep.parts, function(part) {
		for (rep in part.meshes) {
			if (!part.meshes[rep]) {
				continue;
			}
			kickerObj.add(part.meshes[rep]);	
		}
	});
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