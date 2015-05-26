(function(initValues) {
	var initialized = false;
		startEl = document.getElementById('start-button'),
		rendererEl = document.getElementById('renderer'),

	init();

	function init() {
		if (initialized) {
			return;
		}
		initialized = true;

		setListeners();

		// Temporary for dev purposes.
		setTimeout(function(){
			startEl.dispatchEvent(new Event('click'));
		}, 50);
	}

	function setListeners() {
		startEl.addEventListener('click', function(e) {
			e.target.disabled = true;
			document.body.classList.add('expanded-editor');
			document.querySelector('.editor').scrollIntoView();
			rendererEl.dispatchEvent(
				new CustomEvent('renderer-init', {detail: initValues}));
		});
		document.body.addEventListener('renderer-redraw-request',
			function() {
				rendererEl.dispatchEvent(new Event('renderer-redraw'));
		});
		document.body.addEventListener('renderer-upload-request',
			function() {
				rendererEl.dispatchEvent(new Event('renderer-upload'));
		});
		document.body.addEventListener('renderer-save-request',
			function() {
				rendererEl.dispatchEvent(new Event('renderer-save'));
		});
	}
})(initValues);
