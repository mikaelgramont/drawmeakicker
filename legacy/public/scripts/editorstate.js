var EditorState = function(readonly) {
	this.state_ = readonly ? EditorState.READ_ONLY : undefined;
};

EditorState.prototype.setState = function(newState, data) {
	data = data || {};
	var allowedNewStates = [];
	if (this.state_ == EditorState.NEW) {
		allowedNewStates = [EditorState.NEW, EditorState.READY];

	} else if (this.state_ == EditorState.READY) {
		allowedNewStates = [EditorState.NEW, EditorState.SAVED];

	} else if (this.state_ == EditorState.SAVED) {
		allowedNewStates = [EditorState.NEW, EditorState.READY, EditorState.READ_ONLY];

	} else if (this.state_ == EditorState.READ_ONLY) {
		allowedNewStates = [EditorState.NEW, EditorState.READY];
	}

	if (allowedNewStates.indexOf(newState) === -1 && this.state_) {
		throw new Error('Transition to state from state "' +
			this.state_ + '" to "' + newState + '" not allowed.');
	}
	this.setState_(newState, data);
};

EditorState.prototype.setState_ = function(newState, data) {
	var previousState = this.state_;
	this.state_ = newState;
	var event = new CustomEvent('published-state-change',
		{detail: {'state': newState, 'previousState': previousState, data: data}});

	document.body.dispatchEvent(event);
}

EditorState.prototype.getState = function() {
	return this.state_;
}

// Basic state on page load.
EditorState.NEW = 'new';

// State once the editor is initialized and interactive.
EditorState.READY = 'ready';

// State after the user has pressed save at least once.
EditorState.SAVED = 'saved';

// State when the user loaded an existing url.
EditorState.READ_ONLY = 'read-only';