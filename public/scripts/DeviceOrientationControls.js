/**
 * Heavily modified by Mika.
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.DeviceOrientationControls = function () {
	// this.enabled = true;
	var zee = new THREE.Vector3( 0, 0, 1 );
	var euler = new THREE.Euler();
	var q0 = new THREE.Quaternion();
	var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

	this.deviceOrientation = {};
	this.screenOrientation = 0;

	this.onDeviceOrientationChangeEvent = function ( event ) {
		console.log('onDeviceOrientationChangeEvent', this.getCamera().uuid, event);
		this.deviceOrientation = event;
		if (this.enabled) {
			this.update();
		}
	};

	this.onScreenOrientationChangeEvent = function (e) {
		this.screenOrientation = window.orientation || 0;
		if (this.enabled) {
			this.update();
		}
	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''
	this.updateCamera = function (alpha, beta, gamma, orient ) {
		var q = this.getCamera().quaternion;
		euler.set( beta, alpha, - gamma, 'YXZ' );                       		// 'ZXY' for the device, but 'YXZ' for us
		q.setFromEuler( euler );                            	// orient the device
		q.multiply( q1 );                                      	// camera looks out the back of the device, not the top
		q.multiply( q0.setFromAxisAngle( zee, - orient ) );    	// adjust for screen orientation
	};

	this.getCamera = function() {
		return this.renderer.cameras.perspective;
	}

	this.connect = function(renderer) {
		this.renderer = renderer;
		window.cam = this.getCamera();
		this.getCamera().rotation.reorder("YXZ");
		this.onScreenOrientationChangeEvent(); // run once on load

		window.addEventListener( 'orientationchange', this.onScreenOrientationChangeEvent.bind(this), false );
		window.addEventListener( 'deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false );

		this.enabled = true;
	};

	this.disconnect = function() {
		window.removeEventListener( 'orientationchange', this.onScreenOrientationChangeEvent.bind(this), false );
		window.removeEventListener( 'deviceorientation', this.onDeviceOrientationChangeEvent.bind(this), false );

		this.enabled = false;
	};

	this.update = function () {
		if (!this.enabled) {
			return;
		}
		var alpha  = this.deviceOrientation.alpha ? THREE.Math.degToRad(this.deviceOrientation.alpha) : 0; // Z
		var beta   = this.deviceOrientation.beta  ? THREE.Math.degToRad(this.deviceOrientation.beta ) : 0; // X'
		var gamma  = this.deviceOrientation.gamma ? THREE.Math.degToRad(this.deviceOrientation.gamma) : 0; // Y''
		var orient = this.screenOrientation       ? THREE.Math.degToRad(this.screenOrientation      ) : 0; // O

		this.updateCamera(alpha, beta, gamma, orient);
	};
};