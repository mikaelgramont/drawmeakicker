(function(initValues, autoStart, units, three, files) {
	var initialized = false;
		startEl = document.querySelector('#start-button'),
		editorEl = document.querySelector('.editor'),
		rendererEl = document.querySelector('#renderer'),
		paramsEl = document.querySelector('#params'),
		resultsEl = document.querySelector('#results');
	//console.log('initValues', initValues);

	// Wait for the DOM to be ready before we start downloading three.js.
	// Once it's loaded, fetch fonts, scripts and Polymer components (one file each).
	// Once both have loaded, then look into possibly starting the editor.
	var loaderPromises = [];
	document.addEventListener("DOMContentLoaded", function(event) {
		var head = document.getElementsByTagName('head')[0];
		var threePromise = new Promise(function(resolve, reject) {
			var el = document.createElement('script');
			el.setAttribute('src', three);
			el.addEventListener('load', function(e) {
				resolve();
			});
			el.addEventListener('error', function(e) {
				reject();
			});
			head.appendChild(el);

		});
		threePromise.then(function() {
			files.forEach(function(fileInfo) {
				loaderPromises.push(new Promise(function(resolve, reject) {
					var el;
					if (fileInfo[0] == 'link') {
						el = document.createElement('link');
						el.setAttribute('rel', 'import');
						el.setAttribute('href', fileInfo[1]);
					} else {
						el = document.createElement('script');
						el.setAttribute('src', fileInfo[1]);
					}
					el.setAttribute('charset', 'utf-8');
					el.addEventListener('load', function(e) {
						resolve();
					});
					el.addEventListener('error', function(e) {
						reject();
					});
					head.appendChild(el);
				}));
			});
			Promise.all(loaderPromises).then(function() {
				setListeners();
				if (autoStart) {
					// Skip the introduction if autoStart is true.
					showEditor();
				}

			});
		});
	});

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

		document.body.addEventListener('published-state-change',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('editor-react-to-state-change', {detail: e.detail}));
		});

		document.body.addEventListener('requested-state-change',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('editor-apply-state-change', {detail: e.detail}));
		});

		document.body.addEventListener('units-change-request',
			function(e) {
				var event = new CustomEvent('units-change', {detail: e.detail})
				editorEl.dispatchEvent(event);
				paramsEl.dispatchEvent(event);
				resultsEl.dispatchEvent(event);
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
})(BIHI.initValues, BIHI.autoStart, BIHI.units, BIHI.three, BIHI.files);
