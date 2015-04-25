var Renderer3d = function(kicker, canvas3dEl, imageList, config, canvas2dEl) {
	this.kicker = kicker;
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
	// Cameras - needs to happen before calling setRepresentationType.
	this.cameras = EditorScene.getCameras(this.canvasEl, this.kickerObj);
	this.orbits = {
		ortho: new THREE.OrbitControls(this.cameras.ortho, this.canvasEl),
		prespective: new THREE.OrbitControls(this.cameras.perspective, this.canvasEl)
	}

	this.setRepresentationType('2d');

	// Scene
	this.scene = EditorScene.getScene();
	Utils.makeAvailableForDebug('scene', this.scene);

	// Kicker
	this.createKicker();
	this.scene.add(this.kickerObj);

	// Additional content
	// EditorScene.setupContent(this.scene, this.kicker, this.config, this.imageList);

	this.threeRenderer = EditorScene.getRenderer(this.canvasEl);

	this.resize();
	this.render();
};

Renderer3d.prototype.setRepresentationType = function(type) {
	this.representationType = type;
	if (type == '2d') {
		// TODO: disable the orbitControls
		this.camera = this.cameras.ortho;
		this.orbitControls = this.orbits.ortho;
	} else {
		// TODO: enable the orbitControls
		this.camera = this.cameras.perspective;
		this.orbitControls = this.orbits.perspective;		
	}
	Utils.makeAvailableForDebug('camera', this.camera);
}

Renderer3d.prototype.resize = function() {
	EditorScene.setSize(this.threeRenderer, this.canvasEl);
	this.blueprintBorderRenderer.resize();
};

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
}

Renderer3d.prototype.createKicker = function() {
	if (this.kickerObj) {
		this.scene.remove(this.kickerObj);
	}
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList, this.representationType);
	this.scene.add(this.kickerObj);
};

