var BlueprintBorderRenderer = function(canvasEl) {
	this.canvasEl = canvasEl;
};

BlueprintBorderRenderer.prototype.render = function() {
	if (!this.canvasEl) {
		return;
	}
	var ctx = this.canvasEl.getContext('2d');
	ctx.strokeStyle = "#f8faff";

	var parent = this.canvasEl.parentElement,
	    width = parent.clientWidth,
	    height = parent.clientHeight;

	// Main border
	ctx.strokeRect(0, 0, width, height);

	// Break down the canvas into 4 columns and 4 row, thus, we need
	// to slice it in 3 places in both directions

	var rows = 4,
		cols = 4,
		borderWidth = 1,
		notchLength = 10;
	
	// Total width minus number of notches - 2 borders.
	var distH = (width - (cols - 1) - 2 * borderWidth) / cols;
	for (var i = 1, l = cols; i < l; i++) {
		var x = (distH * i) | 0;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, notchLength);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(x, height);
		ctx.lineTo(x, height - notchLength);
		ctx.stroke();
	}

	var distV = (height - (rows - 1) - 2 * borderWidth) / rows;
	for (var i = 1, l = rows; i < l; i++) {
		var y = (distV * i) | 0;
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(notchLength, y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(width, y);
		ctx.lineTo(width - notchLength, y);
		ctx.stroke();
	}
}

BlueprintBorderRenderer.prototype.resize = function() {
	var parent = this.canvasEl.parentElement;
	this.canvasEl.width = parent.clientWidth;
	this.canvasEl.height = parent.clientHeight;
};