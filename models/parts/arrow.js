var Arrow = function(length, material) {    
	var mainObj = new THREE.Object3D();

    var start = new THREE.Vector3(0, 0, 0);
    var end = new THREE.Vector3(length, 0, 0);

	var lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(start);
    lineGeometry.vertices.push(end);
    var line = new THREE.Line(lineGeometry, material);

    var arrowSize = .2;
    var startArrow = this.createStartArrow(arrowSize, material);
    var endArrow = this.createEndArrow(arrowSize, length, material);

	mainObj.add(startArrow);
	mainObj.add(line);
	mainObj.add(endArrow);

	this.mesh = mainObj;
};

Arrow.prototype.createStartArrow = function(arrowSize, material) {
	var start = new THREE.Vector3(.05, -.05, 0);
	var mid = new THREE.Vector3(0, 0, 0);
	var end = new THREE.Vector3(.05, .05, 0);

	var startArrowGeometry = new THREE.Geometry();
    startArrowGeometry.vertices.push(start);
    startArrowGeometry.vertices.push(mid);
    startArrowGeometry.vertices.push(end);
    var startArrow = new THREE.Line(startArrowGeometry, material);
    
    return startArrow;
};

Arrow.prototype.createEndArrow = function(arrowSize, length, material) {
	var start = new THREE.Vector3(-.05 + length, -.05, 0);
	var mid = new THREE.Vector3(length, 0, 0);
	var end = new THREE.Vector3(-.05 + length, .05, 0);

	var endArrowGeometry = new THREE.Geometry();
    endArrowGeometry.vertices.push(start);
    endArrowGeometry.vertices.push(mid);
    endArrowGeometry.vertices.push(end);
    var endArrow = new THREE.Line(endArrowGeometry, material);
    
    return endArrow;
};