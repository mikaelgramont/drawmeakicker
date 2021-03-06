var MergedRenderer = function(canvas3dEl, canvas2dEl, mergedCanvasEl) {
	this.canvas3dEl = canvas3dEl;
	this.canvas2dEl = canvas2dEl;
	this.mergedCanvasEl = mergedCanvasEl;
};

MergedRenderer.prototype.resize = function() {
	var parent = this.mergedCanvasEl.parentElement;
	this.mergedCanvasEl.width = parent.clientWidth * window.devicePixelRatio;
	this.mergedCanvasEl.height = parent.clientHeight * window.devicePixelRatio;

};

MergedRenderer.prototype.getData = function(options) {
	var ctx = this.mergedCanvasEl.getContext('2d');
	ctx.clearRect(0, 0, this.mergedCanvasEl.width, this.mergedCanvasEl.height);
	if (options.fill) {
		ctx.fillStyle = '#3B69D5';
		ctx.fillRect(0, 0, this.mergedCanvasEl.width, this.mergedCanvasEl.height);          
	}
	ctx.drawImage(this.canvas3dEl, 10, 10, this.mergedCanvasEl.width, this.mergedCanvasEl.height);
	if (options.borders) {
		ctx.drawImage(this.canvas2dEl, 10, 10, this.mergedCanvasEl.width - 20, this.mergedCanvasEl.height - 20);
	}

	return this.mergedCanvasEl.toDataURL();
};