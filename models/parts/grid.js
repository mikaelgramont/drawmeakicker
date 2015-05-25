var Grid = function(type, options) {
	Part.call(this);

	this.meshes['2d'] = null;
	this.meshes['3d'] = this.createGrid_();
};
Grid.prototype = new Part();

Grid.prototype.setMeshVisibilityForDisplay = function(data) {
	this.meshes['3d'].visible = data.get('grid') && data.get('repType') == '3d';
}

Grid.prototype.createGrid_ = function() {
	var gridHelper = new THREE.GridHelper(100, 1);
	gridHelper.setColors(0xf8faff, 0x010845);
	gridHelper.name = 'grid';	
	return gridHelper;	
};