var ImageList = function() {
	this.images = {
		'side': BIHI.lazyLoadingFiles.wood1,
		'slat': BIHI.lazyLoadingFiles.wood2,
		'strut': BIHI.lazyLoadingFiles.wood3
	};
};

ImageList.prototype.getImageUrl = function(name) {
	return this.images[name];
};