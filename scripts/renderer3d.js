var Renderer3d = function(kicker, canvasEl) {
	this.kicker = kicker;
	this.canvasEl = canvasEl;
	this.parts = null;
	this.rafId = null;

	this.init();
};

Renderer3d.prototype.init = function() {
	/**
      TODO:
      - create a threejs renderer object
      - create parts
      - create light, camera, scene
      - add everything.
	 */
	var aspectRatio = this.canvasEl.clientWidth / this.canvasEl.clientHeight;
	this.camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 1000);
	this.camera.position.x = 4.2;
	this.camera.position.y = 1.2;
	this.camera.position.z = 1.2;

	this.scene = new THREE.Scene();

	var light = new THREE.DirectionalLight(0xffffff);
	light.position.set(300, 10, 300);
	this.scene.add(light);

	var light2 = new THREE.DirectionalLight(0xffffff);
	light2.position.set(-100, 200, -120);
	this.scene.add(light2);

	this.threeRenderer = new THREE.WebGLRenderer({
		antialias: true,
		canvas: this.canvasEl
	});
	this.threeRenderer.setClearColor(0xf0f0f0);
	this.threeRenderer.setSize(
	this.canvasEl.clientWidth, this.canvasEl.clientHeight);

	this.scene.add(new THREE.AxisHelper(1));
	this.scene.add(new THREE.GridHelper(100,2));

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
};

