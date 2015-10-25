(function(initValues, autoStart, units, three, files) {
	if (document.body.classList.contains('loading-editor')) {
		// Scroll the loading placeholder into view asap.
		document.querySelector('.loading-placeholder').scrollIntoView();
	}

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
		var body = document.body;
		startEl.addEventListener('click', showEditor);
		body.addEventListener('renderer-event', function(e) {
			if (!e.detail.type) {
				throw new Error('Unspecified renderer event type.');
			}
			var type = e.detail.type;
			var detail = e.detail;
			delete detail.type
			rendererEl.dispatchEvent(new CustomEvent(type, {detail: detail}));
		});

		body.addEventListener('published-state-change',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('editor-react-to-state-change', {detail: e.detail}));
		});

		body.addEventListener('requested-state-change',
			function(e) {
				editorEl.dispatchEvent(new CustomEvent('editor-apply-state-change', {detail: e.detail}));
		});

		body.addEventListener('units-change-request',
			function(e) {
				var event = new CustomEvent('units-change', {detail: e.detail})
				editorEl.dispatchEvent(event);
				paramsEl.dispatchEvent(event);
				resultsEl.dispatchEvent(event);
		});

		body.addEventListener('vr-start', function(e) {
			editorEl.startVR();
		});

		body.addEventListener('vr-stop', function(e) {
			editorEl.stopVR();
		});

		var alertEl = document.getElementById('alert');
		body.addEventListener('alert-set-message',
			function(e) {
				alertEl.message = e.detail.message;
		});

		// MOBILE MENU
		var menuEl = document.getElementById('mobile-menu');
		menuEl.addEventListener('click', function(e) {
			body.classList.add('accordion-visible');
			e.stopPropagation();
		}, false);
		var maskEl = document.getElementById('renderer-mask');
		var isTouchMoving = false;
		maskEl.addEventListener('touchmove', function(e) {
			// Disable scrolling by touching the mask.
			e.preventDefault();
			isTouchMoving = true;
		}, true);
		maskEl.addEventListener('touchend', function(e) {
			e.preventDefault();
			if (isTouchMoving) {
				isTouchMoving = false;
				return;
			} else {
				if (body.classList.contains('accordion-visible')) {
					body.classList.remove('accordion-visible');
				}
			}
		}, true);
	}

	function showEditor() {
		startEl.disabled = true;
		document.body.classList.remove('loading-editor');
		document.body.classList.add('expanded-editor');
		document.querySelector('.editor').scrollIntoView();
		editorEl.reset();
		editorEl.init(initValues, units);		
	}
})(BIHI.initValues, BIHI.autoStart, BIHI.units, BIHI.three, BIHI.files);
