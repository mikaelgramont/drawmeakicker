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
		-0.95,
		2.64,
		3.85
	));
	return camera;
};

EditorScene.createOrthoCamera_ = function(el, kickerObj) {
	var aspectRatio = el.clientWidth / el.clientHeight,
		bb = new BoundingBoxHelper(kickerObj),
		margin = 0.1,
		w, h;
	bb.update(true);

	var xRange = (1 + margin) * Math.ceil(bb.box.max.x - bb.box.min.x),
		yRange = (1 + margin) * Math.ceil(bb.box.max.y - bb.box.min.y);

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

	return scene;
};

EditorScene.createKicker = function(kicker, config, imageList, renderer) {
	var kickerObj = new THREE.Object3D();
	var rep = kicker.model.create3dObject(config, imageList, renderer);
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
	var options = {
		antialias: true,
		canvas: canvasEl,
		alpha: true,
		preserveDrawingBuffer: true
	};

	if (!window.WebGLRenderingContext) {
		return new THREE.CanvasRenderer(options);
	} else {
		return threeRenderer = new THREE.WebGLRenderer(options);
	}
};