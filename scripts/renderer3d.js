var Renderer3d = function(kicker, canvasEl, imageList, config) {
	this.kicker = kicker;
	this.canvasEl = canvasEl;
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
	this.camera = EditorScene.getCamera(this.canvasEl);
	this.scene = EditorScene.getScene();
	EditorScene.setupContent(this.scene, this.kicker, this.config, this.imageList);
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList);
	this.scene.add(this.kickerObj);

	this.threeRenderer = EditorScene.getRenderer(this.canvasEl);
	this.orbitControls = new THREE.OrbitControls(this.camera, this.canvasEl);
	this.render();
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
};

Renderer3d.prototype.refresh = function() {
	this.kicker.refresh();
	// TODO: clear parts, rebuild all objects
	// and bind them to the threejs renderer.
	this.scene.remove(this.kickerObj);
	this.kickerObj = EditorScene.createKicker(this.kicker, this.config, this.imageList);
	this.scene.add(this.kickerObj);
};

