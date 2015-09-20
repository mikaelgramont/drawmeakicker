<?php
require("validators.php");

class KickerDao {
	protected static $_table = 'kickers';

	protected static $_dataValidatorClasses = array(
		'id' => 'NullValidator', // Kind of dumb, but oh well.
		'height' => 'FloatValidator',
		'width' => 'FloatValidator',
		'angle' => 'IntValidator',
		'repType' => 'RepTypeValidator',
		'annotations' => 'BooleanValidator',
		'grid' => 'BooleanValidator',
		'mountainboard' => 'BooleanValidator',
		'textured' => 'BooleanValidator',
		'rider' => 'BooleanValidator',
		'fill' => 'BooleanValidator',
		'borders' => 'BooleanValidator',
		'description' => 'TextValidator',
		'title' => 'TextValidator'
	);

	protected static $_convertBoolean = array(
		'annotations',
		'grid',
		'mountainboard',
		'textured',
		'rider',
		'fill',
		'borders'
	);

	public static function getDb() {
		$dsn = 'mysql:host='.MYSQL_HOST.';dbname='.MYSQL_SCHEME.'';
		$options = array(
		    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
		); 

		$dbh = new PDO($dsn, MYSQL_USER, MYSQL_PWD, $options);
		$dbh->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
		return $dbh;
	}

	public static function loadById($id, $dbh) {
		if (!$id) {
			return self::getDefaultData();
		}

		$stmt = $dbh->prepare("SELECT * FROM " . self::$_table . " WHERE id = :id");
		$stmt->bindParam(':id', $id);
		$stmt->execute();
		$row = $stmt->fetch();

		if (!$row) {
			throw new NotFoundKickerException("Kicker ".$id." not found.");
		}

		return $row;
	}

	public static function getDefaultData() {
		$data = new stdClass;
        $data->height = 1.2;
        $data->width = 1;
        $data->angle = 45;

        $data->repType = '2d';

        $data->annotations = true;
        $data->grid = true;
        $data->mountainboard = false;
        $data->textured = true;
        $data->rider = false;
        $data->fill = true;
        $data->borders = true;

        $data->description = '';
        $data->title = '';

        $data->id = null;

        return $data;
	}

	public static function create($data, $dbh) {
		list($errors) = self::_validateCreationInput($data);
		if ($errors) {
			return array($errors, null);
		}

		$columns = "height,width,angle,title,description,repType,annotations,grid,mountainboard,textured,rider,fill,borders";
		$columnArr = explode(",", $columns);
		$paramsArr = array();
		foreach ($columnArr as $column) {
			$paramsArr[$column] = ":".$column;
		}
		$params = implode(",", $paramsArr);

		$insert  = "INSERT INTO " . self::$_table . " (".$columns.") VALUES (".$params.")";
		
		$stmt = $dbh->prepare($insert);
		foreach ($paramsArr as $column => $prefixed) {			
			if (in_array($column, self::$_convertBoolean)) {
				// echo "found ".$column." in array";
				$value = $data[$column] ? "1" : "0";
			} else {
				// echo "did not find ".$column." in array";
				$value = $data[$column];
			}
			$stmt->bindParam($prefixed, $value);
		}
		$success = $stmt->execute();
		if ($success) {
			$lastId = $dbh->lastInsertId();	
		} else {
			$lastId = null;
			$errors[] = "Could not save the kicker.";
		}

		return array($errors, $lastId);
	}

	protected static function _validateCreationInput($data) {
		$errors = array();
		$allowedInputs = array_keys(self::$_dataValidatorClasses);
		foreach ($data as $k => $v) {
			if (!in_array($k, $allowedInputs)) {
				$errors[] = $k . " not an allowed input";
				continue;
			}
			$validatorClass = self::$_dataValidatorClasses[$k];
			$validator = new $validatorClass($v);
			if (!$validator->isValid()) {
				$errors[] = $k . $validator->getErrorMessage();
				continue;
			}
		}

		return array($errors);
	}

}

class KickerException extends Exception {}

class NotFoundKickerException extends KickerException {}

