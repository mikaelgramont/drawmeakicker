<?php
abstract class Validator {
	protected $_data;

	protected $_errorMessage;

	public function __construct($data) {
		$this->_data = $data;
	}

	public abstract function isValid()

	public function getErrorMessage() {
		return $this->_errorMessage();
	}
}

class FloatValidator extends Validator {
	protected $_errorMessage = " not a floating point value.";

	public function isValid() {
		return is_float($this->_data + 0);
	}
}

class IntValidator extends Validator {
	protected $_errorMessage = " not an integer value.";

	public function isValid() {
		return(ctype_digit(strval($this->_data)));
	}
}

class RepTypeValidator extends Validator {
	protected $_errorMessage = " not an correct representation type value.";
	
	public function isValid() {
		return ($this->_data == '2d' || $this->_data == '3d');
	}
}

class BooleanValidator extends Validator {
	protected $_errorMessage = " not a boolean value.";
	
	public function isValid() {
		return ($this->_data == false || $this->_data == true);
	}
}

class TextValidator extends Validator {
	protected $_errorMessage = " not valid text.";
	
	public function isValid() {
		return (htmlspecialchars($this->_data) == $this->_data);
	}
}