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
	this.scene.add(this.kickerObj);

	// Cameras - needs to happen before calling setRepresentationType.
	this.createCameras();

	// TODO: fetch relevant data from the view, and pass it through.
	this.representationType = '2d';
	this.updateRenderingForRepresentationType();

	this.threeRenderer = EditorScene.getRenderer(this.canvasEl);

	// Additional content
	// EditorScene.setupContent(this.scene, this.kicker, this.config, this.imageList);
	this.resize();
	this.render();
};

Renderer3d.prototype.createCameras = function() {
	this.cameras = EditorScene.createCameras(this.canvasEl, this.kickerObj);
	this.orbitControls = new THREE.OrbitControls(this.cameras.perspective, this.canvasEl);	
	// this.orbitControls.addEventListener('start', function(){
	// 	console.log('orbitControls, start');
	// });
	// this.orbitControls.addEventListener('end', function(){
	// 	console.log('orbitControls, end');
	// });
};

Renderer3d.prototype.updateViz = function(update) {
	console.log('Renderer3d.prototype.updateViz', update);
	if ('type' in update) {
		this.representationType = update.type;
	}
	this.updateRenderingForRepresentationType();
};

Renderer3d.prototype.updateRenderingForRepresentationType = function() {
	// Go over all parts and tell them which needs to show.
	var rep = this.kicker.getRepresentation3d();
	repType = this.representationType;
	Utils.iterateOverParts(rep.parts, function(part) {
		part.setMeshVisibilityForDisplay(repType);
	});

	this.installCameras();
};

Renderer3d.prototype.installCameras = function() {
	if (this.representationType == '2d') {
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
};

Renderer3d.prototype.prepareCameras = function() {
	this.createCameras();
	this.installCameras();
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
	this.draw();
};

Renderer3d.prototype.stop = function() {
	cancelAnimationFrame(this.rafId);
	this.rafId = null;	
};

Renderer3d.prototype.draw = function() {
	this.threeRenderer.render(this.scene, this.camera);
	this.blueprintBorderRenderer.render();
};

Renderer3d.prototype.refresh = function() {
	this.kicker.refresh();
	this.createKicker();
	if (this.representationType == '2d') {
		// Need to recenter the camera on the new kicker.
		this.prepareCameras();
	}
}

Renderer3d.prototype.createKicker = function() {
	if (this.kickerObj) {
		this.scene.remove(this.kickerObj);
	}
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList, this.representationType);

	this.cameraTarget = new THREE.AxisHelper(1);
	this.kickerObj.add(this.cameraTarget);
	this.cameraTarget.visible = false;
	this.cameraTarget.position.x = this.kicker.model.length / 2;

	this.scene.add(this.kickerObj);
};

