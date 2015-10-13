var Sequencer = function(debug) {
	this.renderer = null;
	this.debug_ = !!debug;
	this.updateState_ = this.STATES_.DONE;
	this.renderingState_ = this.STATES_.DONE;

	Utils.makeAvailableForDebug('Sequencer', this);
};

Sequencer.prototype.STATES_ = {
	CONTINUOUS: 'continuous',
	DONE: 'done',
	ONCE: 'once'
};

Sequencer.prototype.start = function() {
	this.raf_();
};

Sequencer.prototype.stop = function() {
	cancelAnimationFrame(this.rafId_);
};

Sequencer.prototype.raf_ = function() {
	this.rafId_ = requestAnimationFrame(this.raf_.bind(this));
	this.log('raf');

	if (this.updateState_ != this.STATES_.DONE) {
		this.renderer.update();

		if (this.updateState_ == this.STATES_.ONCE) {
			this.updateState_ = this.STATES_.DONE
		}
	}

	if (this.renderingState_ != this.STATES_.DONE) {
		this.renderer.draw();	

		if (this.renderingState_ == this.STATES_.ONCE) {
			this.renderingState_ = this.STATES_.DONE
		}
	}
};

Sequencer.prototype.requestSingleRender = function() {
	this.log('requestSingleRender');
	this.renderingState_ = this.STATES_.ONCE;
};

Sequencer.prototype.requestContinuousRendering = function() {
	this.log('requestContinuousRendering');
	this.renderingState_ = this.STATES_.CONTINUOUS;
};

Sequencer.prototype.isContinuouslyRendering = function() {
	return this.renderingState_ == this.STATES_.CONTINUOUS;
};

Sequencer.prototype.requestStopRendering = function() {
	this.log('requestStopRendering');
	this.renderingState_ = this.STATES_.DONE;
};

Sequencer.prototype.requestSingleUpdate = function() {
	this.log('requestSingleUpdate');
	this.updateState_ = this.STATES_.ONCE;
};

Sequencer.prototype.requestContinuousUpdating = function() {
	this.log('requestContinuousUpdating');
	this.updateState_ = this.STATES_.CONTINUOUS;
};

Sequencer.prototype.requestStopUpdating = function() {
	this.log('requestStopUpdating');
	this.updateState_ = this.STATES_.DONE;
};

Sequencer.prototype.log = function() {
	if (!this.debug_) {
		return;
	}
	var args = Array.prototype.slice.call(arguments);
	args.unshift('Sequencer log -');
	console.log.apply(console, args);
}