var KickerEditorView = function(rootEl) {
	var els = rootEl.querySelectorAll('bihi-design-parameter');
	this.parameters = {};
	for (var i = 0; i < els.length; i++) {
		var id = els[i].getAttribute('id');
		this.parameters[id] = els[i];
	};

	els = rootEl.querySelectorAll('bihi-design-result');
	this.results = {};
	for (var i = 0; i < els.length; i++) {
		var id = els[i].getAttribute('id');
		this.results[id] = els[i];
	};
};

KickerEditorView.prototype.refresh = function(radius, length, arc) {
	this.results.radius.setAttribute('value', radius.toFixed(2));
	this.results.length.setAttribute('value', length.toFixed(2));
	this.results.arc.setAttribute('value', arc.toFixed(2));
};