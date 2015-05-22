var Arrow = function(length, material, hasStartTip) {    
	var mainObj = new THREE.Object3D();

    var tipSize = .2;
    if (hasStartTip) {
	    var startTip = this.createStartTip(tipSize, material);
		mainObj.add(startTip);
    }

    this.start = new THREE.Vector3(0, 0, 0);
    this.end = new THREE.Vector3(length, 0, 0);
    this.material = material;
    var line = this.createLine();
	mainObj.add(line);

    var endTip = this.createEndTip(tipSize, length, material);
	mainObj.add(endTip);

	this.mesh = mainObj;
};

Arrow.prototype.createLine = function() {
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push(this.start);
	lineGeometry.vertices.push(this.end);
	var line = new THREE.Line(lineGeometry, this.material);

	return line;
};

Arrow.prototype.createStartTip = function(tipSize, material) {
	var start = new THREE.Vector3(.05, -.05, 0);
	var mid = new THREE.Vector3(0, 0, 0);
	var end = new THREE.Vector3(.05, .05, 0);

	var startTipGeometry = new THREE.Geometry();
    startTipGeometry.vertices.push(start);
    startTipGeometry.vertices.push(mid);
    startTipGeometry.vertices.push(end);
    var startTip = new THREE.Line(startTipGeometry, material);
    
    return startTip;
};

Arrow.prototype.createEndTip = function(tipSize, length, material) {
	var start = new THREE.Vector3(-.05 + length, -.05, 0);
	var mid = new THREE.Vector3(length, 0, 0);
	var end = new THREE.Vector3(-.05 + length, .05, 0);

	var endTipGeometry = new THREE.Geometry();
    endTipGeometry.vertices.push(start);
    endTipGeometry.vertices.push(mid);
    endTipGeometry.vertices.push(end);
    var endTip = new THREE.Line(endTipGeometry, material);
    
    return endTip;
};