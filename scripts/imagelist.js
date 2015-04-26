var ImageList = function() {
	this.images = {
		'side': "./images/textures/wood1_256.jpg",
		'slat': "./images/textures//wood2_256.jpg",
		'strut': "./images/textures//wood3_256.jpg"
	};
};

ImageList.prototype.getImageUrl = function(name) {
	return this.images[name];
};