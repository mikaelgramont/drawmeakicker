(function(initValues, autoStart) {
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
	}

	function showEditor() {
		startEl.disabled = true;
		document.body.classList.add('expanded-editor');
		document.querySelector('.editor').scrollIntoView();

		editorEl.reset();
		editorEl.init(initValues);
	}
})(initValues, autoStart);
