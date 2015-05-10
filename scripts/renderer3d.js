var Renderer3d = function(kicker, canvas3dEl, imageList, config, canvas2dEl) {
	this.kicker = kicker;
	this.view = this.kicker.model.view;
	this.canvasEl = canvas3dEl;
	this.canvas2dEl = canvas2dEl;
	this.blueprintBorderRenderer = new BlueprintBorderRenderer(canvas2dEl);
	this.imageList = imageList;
	this.config = config;
	this.parts = null;
	this.rafId = null;
	var init = this.init.bind(this);
	setTimeout(function(){
		// Some kind of race condition is causing the canvas element to not
		// be sized correctly unless we push this to the next tick. Sigh.
		init();
	}, 0);
	
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
	this.renderOnce();	
};

Renderer3d.prototype.renderOnce = function() {
	this.setRenderingPace_('once');
};

Renderer3d.prototype.renderContinuously = function() {
	this.setRenderingPace_('continuous');
};

Renderer3d.prototype.stopRendering = function() {
	this.setRenderingPace_('done');
	cancelAnimationFrame(this.rafId);
	this.rafId = null;	
};

Renderer3d.prototype.setRenderingPace_ = function(renderingPace) {
	if (renderingPace == 'once' || renderingPace == 'continuous' || renderingPace == 'done') {
		console.log('setRenderingPace', renderingPace);
		this.renderingPace = renderingPace;
	}

	if (this.renderingPace == 'once') {
		console.log('calling draw');
		this.draw();
	} else if(this.renderingPace == 'continuous') {
		console.log('calling render');
		this.render();
	}
}

Renderer3d.prototype.createCameras = function() {
	this.cameras = EditorScene.createCameras(this.canvasEl, this.kickerObj);
	this.orbitControls = new THREE.OrbitControls(this.cameras.perspective, this.canvasEl);	
	this.orbitControls.zoomSpeed = .3;
	Utils.makeAvailableForDebug('orbitControls', this.orbitControls);
	
	this.orbitControls.addEventListener('start', this.renderContinuously.bind(this));
	this.orbitControls.addEventListener('end', this.stopRendering.bind(this));
};

Renderer3d.prototype.updateViz = function(update) {
	console.log('updateViz', update);
	for (prop in update) {
		if (prop in this.view.viz) {
			this.view.viz[prop] = update[prop];
		} else if (prop == 'type') {
			this.view.viz.representationType = update[prop];	
		}
	}

	this.setVisibleObjects();
	this.renderOnce();
};

Renderer3d.prototype.setVisibleObjects = function() {
	// Go over all parts and tell them which needs to show.
	var rep = this.kicker.getRepresentation3d(),
		viz = this.view.viz;
	Utils.iterateOverParts(rep.parts, function(part) {
		part.setMeshVisibilityForDisplay(viz);
	});

	this.pickCamera();
};

Renderer3d.prototype.pickCamera = function() {
	if (this.view.viz.representationType == '2d') {
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
	this.renderOnce();
};

Renderer3d.prototype.prepareCameras = function() {
	this.createCameras();
	this.pickCamera();
}

Renderer3d.prototype.render = function() {
	if (!this.rafId) {
		this.animate();
	}
};

Renderer3d.prototype.animate = function() {
	var animate = this.animate.bind(this);
	this.rafId = requestAnimationFrame(animate);
	this.step();
};

Renderer3d.prototype.step = function() {
	// TODO: perform physics updates here.
	 // this.camera.rotation.y += 0.005;
	 if (this.orbitControls.enabled && this.orbitControls.autorotate) {
	 	this.orbitControls.update();
	 }
	this.draw();
};

Renderer3d.prototype.draw = function() {
	console.log('draw')
	this.threeRenderer.render(this.scene, this.camera);
	this.blueprintBorderRenderer.render();
	if (this.renderingPace == 'once') {
		this.stopRendering();
	}	
};

Renderer3d.prototype.refresh = function() {
	this.kicker.refresh();
	this.createKicker();
	if (this.view.viz.representationType == '2d') {
		// Need to recenter the camera on the new kicker.
		this.prepareCameras();
	}
	this.setVisibleObjects();
	this.renderOnce();
}

Renderer3d.prototype.createKicker = function() {
	if (this.kickerObj) {
		this.scene.remove(this.kickerObj);
	}
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList, this.view.viz.representationType);

	this.cameraTarget = new THREE.AxisHelper(1);
	this.kickerObj.add(this.cameraTarget);
	this.cameraTarget.visible = false;
	this.cameraTarget.position.x = this.kicker.model.length / 2;

	this.scene.add(this.kickerObj);
};

