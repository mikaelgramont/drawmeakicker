var Renderer3d = function(sequencer, kicker, canvas3dEl, imageList, config, canvas2dEl, mergedCanvasEl) {
	this.sequencer = sequencer;
	this.kicker = kicker;
	this.data = this.kicker.model.data;
	this.canvasEl = canvas3dEl;
	this.canvas2dEl = canvas2dEl;
	this.blueprintBorderRenderer = new BlueprintBorderRenderer(canvas2dEl);
	this.mergedCanvasEl = mergedCanvasEl;
	this.mergedRenderer = new MergedRenderer(canvas3dEl, canvas2dEl, mergedCanvasEl);
	this.imageList = imageList;
	this.config = config;
	this.parts = null;
	this.rafId = null;
	this.drawCounter = 0;
	this.VRstate = false;

	this.elapsedTime = 0;
	this.VRCameraTarget = new THREE.Vector3(1.5, .5, 0);
	this.VRCameraTimeConstant = .0005;


	// Placeholder empty objects:
	this.models = {
		board: new THREE.Object3D()
	};
	Utils.makeAvailableForDebug('renderer3d', this);
};

Renderer3d.prototype.onStateChange = function(newState) {
	switch(newState) {
		case EditorState.NEW:
			this.init();
			break;
	}
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
	this.stereoRenderer = new THREE.StereoEffect(this.threeRenderer);
	this.onVRStateUpdate();

	this.setVisibleObjects();
	this.resize();

	this.sequencer.start();
};

Renderer3d.prototype.setVRState = function(state) {
	this.VRstate = state;
	this.onVRStateUpdate();
};

Renderer3d.prototype.onVRStateUpdate = function() {
	// This is needed because THREE.StereoEffect does renderer.autoClear = false for some reason.
	console.log("this.VRstate", this.VRstate);
	if (this.VRstate) {
		this.elapsedTime = 0;
		this.VRControls.connect();
		this.orbitControls.enabled = false;
		this.threeRenderer.autoClear = false;
		this.renderContinuously();
		this.sequencer.requestContinuousUpdating();
	} else {
		this.VRControls.disconnect();
		this.orbitControls.enabled = true;
		this.threeRenderer.autoClear = true;
		this.stopRendering();
		this.sequencer.requestStopUpdating();
	}
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
	if (!this.sequencer.isContinuouslyRendering()) {
		this.sequencer.requestSingleRender();
	}
};

Renderer3d.prototype.renderContinuously = function() {
	this.sequencer.requestContinuousRendering();
};

Renderer3d.prototype.stopRendering = function() {
	this.sequencer.requestStopRendering();
};

Renderer3d.prototype.update = function() {
	// TODO: perform physics updates here.
	var radius = 4.0;
	if (this.VRstate) {
		this.VRControls.update();

		// // Rotate the camera around the kicker.
		// this.camera.position.x = this.VRCameraTarget.x + radius * Math.cos(this.VRCameraTimeConstant * this.elapsedTime);         
		// this.camera.position.z = this.VRCameraTarget.z + radius * Math.sin(this.VRCameraTimeConstant * this.elapsedTime);
		// this.camera.lookAt(this.VRCameraTarget);
		// this.elapsedTime += 16;
	} else {
		if (this.orbitControls.enabled && this.orbitControls.autorotate) {
			this.orbitControls.update();
		}
	}
};

Renderer3d.prototype.draw = function() {
	if (this.VRstate) {
		this.stereoRenderer.render(this.scene, this.camera);	
	} else {
		this.threeRenderer.render(this.scene, this.camera);
	}
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
	this.renderOnce();
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

	this.VRControls = new THREE.DeviceOrientationControls(this.cameras.perspective);
	this.VRControls.enabled = false;
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
	this.renderOnce();
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
	this.stereoRenderer.setSize(parent.clientWidth, parent.clientHeight, false);
	// StereoEffect's default separation is in cm, we're in M
    // Actual cardboard eye separation is 2.5in
    // Finally, separation is per-eye so divide by 2
    this.stereoRenderer.separation = 2.5 * 0.0254 / 2;

	this.prepareCameras();
	this.blueprintBorderRenderer.resize();
	this.mergedRenderer.resize();
	this.renderOnce();
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

Renderer3d.prototype.getDataForSaving = function () {
	return this.data.getDataForSaving();
};

Renderer3d.prototype.setUnits = function (units) {
	this.config.units = units;
	this.kicker.getRepresentation3d().setConfig(this.config);
	this.refresh();
};
