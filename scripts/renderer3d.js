var Renderer3d = function(sequencer, kicker, canvas3dEl, imageList, config, canvas2dEl) {
	this.sequencer = sequencer;

	this.kicker = kicker;
	this.data = this.kicker.model.data;
	this.canvasEl = canvas3dEl;
	this.canvas2dEl = canvas2dEl;
	this.blueprintBorderRenderer = new BlueprintBorderRenderer(canvas2dEl);
	this.imageList = imageList;
	this.config = config;
	this.parts = null;
	this.rafId = null;
	this.drawCounter = 0;
	// Placeholder empty objects:
	this.models = {
		board: new THREE.Object3D()
	};
	Utils.makeAvailableForDebug('renderer3d', this);
};

Renderer3d.prototype.init = function() {
	// Scene
	this.scene = EditorScene.getScene();
	Utils.makeAvailableForDebug('scene', this.scene);

	// Kicker
	this.createKicker();

	// Cameras - needs to happen before calling setRepresentationType.
	this.createCameras();

	this.threeRenderer = EditorScene.getRenderer(this.canvasEl);
	this.setVisibleObjects();
	this.resize();

	this.sequencer.start();
};

Renderer3d.prototype.replaceModel = function(name, model) {
	this.models[name] = model;
	this.refresh();
};

Renderer3d.prototype.getModel = function(name) {
	if (!name in this.models) {
		throw new Error('No model exists with name', name);
	}
	return this.models[name];
};

Renderer3d.prototype.renderOnce = function() {
	this.sequencer.requestSingleRender();
};

Renderer3d.prototype.renderContinuously = function() {
	this.sequencer.requestContinuousRendering();
};

Renderer3d.prototype.stopRendering = function() {
	this.sequencer.requestStopRendering();
};

Renderer3d.prototype.update = function() {
	// TODO: perform physics updates here.
	 // this.camera.rotation.y += 0.005;
	 if (this.orbitControls.enabled && this.orbitControls.autorotate) {
	 	this.orbitControls.update();
	 }
	this.draw();
};

Renderer3d.prototype.draw = function() {
	this.threeRenderer.render(this.scene, this.camera);
	this.blueprintBorderRenderer.render();
};

Renderer3d.prototype.refresh = function() {
	this.kicker.refresh();
	this.createKicker();
	if (this.data.get('repType') == '2d') {
		// Need to recenter the camera on the new kicker.
		this.prepareCameras();
	}
	this.setVisibleObjects();
	this.sequencer.requestSingleRender();
}

Renderer3d.prototype.createCameras = function() {
	this.cameras = EditorScene.createCameras(this.canvasEl, this.kickerObj);
	this.orbitControls = new THREE.OrbitControls(this.cameras.perspective, this.canvasEl);	
	this.orbitControls.zoomSpeed = .3;
	this.orbitControls.maxDistance = 12;
	this.orbitControls.minDistance = 2.5;
	Utils.makeAvailableForDebug('orbitControls', this.orbitControls);
	
	this.orbitControls.addEventListener('start', this.onOrbitStart.bind(this));
	this.orbitControls.addEventListener('end', this.onOrbitEnd.bind(this));
};

Renderer3d.prototype.onOrbitStart = function(update) {
	this.renderContinuously();
};

Renderer3d.prototype.onOrbitEnd = function(update) {
	this.orbitControls.update();
	this.renderOnce();
};

Renderer3d.prototype.updateViz = function(update) {
	for (prop in update) {
		if (!update.hasOwnProperty(prop)) {
			continue;
		}
		this.data.set(prop, update[prop]);	
	}

	this.setVisibleObjects();
	this.sequencer.requestSingleRender();
};

Renderer3d.prototype.setVisibleObjects = function() {
	// Go over all parts and tell them which needs to show.
	var rep = this.kicker.getRepresentation3d();
	var data = this.data;
	Utils.iterateOverParts(rep.parts, function(part) {
		part.setMeshVisibilityForDisplay(data);
	});

	this.prepareCameras();
};

Renderer3d.prototype.pickCamera = function() {
	if (this.data.get('repType') == '2d') {
		// TODO: recenter the camera on the kicker
		this.camera = this.cameras.ortho;
		this.orbitControls.enabled = false;
	} else {
		this.camera = this.cameras.perspective;
		this.orbitControls.target.copy(this.cameraTarget.position);
		this.orbitControls.update();
		this.orbitControls.enabled = true;
	}
	Utils.makeAvailableForDebug('camera', this.camera);
};

Renderer3d.prototype.resize = function() {
	var parent = this.canvasEl.parentElement;
	this.threeRenderer.setSize(parent.clientWidth, parent.clientHeight, false);
	this.prepareCameras();
	this.blueprintBorderRenderer.resize();
	this.sequencer.requestSingleRender();
};

Renderer3d.prototype.prepareCameras = function() {
	this.createCameras();
	this.pickCamera();
}

Renderer3d.prototype.createKicker = function() {
	if (this.kickerObj) {
		this.scene.remove(this.kickerObj);
	}
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList, this);

	this.cameraTarget = new THREE.AxisHelper(1);
	this.kickerObj.add(this.cameraTarget);
	this.cameraTarget.visible = false;
	this.cameraTarget.position.x = this.kicker.model.length / 2;

	this.scene.add(this.kickerObj);
};

