(function(initValues, autoStart, units) {
	var initialized = false;
		startEl = document.querySelector('#start-button'),
		editorEl = document.querySelector('.editor'),
		rendererEl = document.querySelector('#renderer'),
	setListeners();

	console.log('initValues', initValues);

	if (autoStart) {
		// Skip the introduction if autoStart is true.
		setTimeout(showEditor, 0);
	}

	function setListeners() {
		startEl.addEventListener('click', showEditor);
		document.body.addEventListener('renderer-event', function(e) {
			if (!e.detail.type) {
				throw new Error('Unspecified renderer event type.');
			}
			var type = e.detail.type;
			var detail = e.detail;
			delete detail.type
			rendererEl.dispatchEvent(new CustomEvent(type, {detail: detail}));
		});

		document.body.addEventListener('editor-state-change-request',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('editor-state-change', {detail: e.detail}));
		});

		document.body.addEventListener('units-change-request',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('units-change', {detail: e.detail}));
		});

		var alertEl = document.getElementById('alert');
		document.body.addEventListener('alert-set-message',
			function(e) {
				alertEl.message = e.detail.message;
		});
	}

	function showEditor() {
		startEl.disabled = true;
		document.body.classList.add('expanded-editor');
		document.querySelector('.editor').scrollIntoView();

		editorEl.reset();
		editorEl.init(initValues, units);
	}
})(initValues, autoStart, units);
