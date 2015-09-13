<?php
class KickerDao {
	protected static $_table = 'kickers';

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
			return self::_getDefaultData();
		}

		$stmt = $dbh->prepare("SELECT * FROM " . self::$_table . " WHERE id = :id");
		$stmt->bindParam(':id', $id);
		$stmt->execute();
		$row = $stmt->fetch();

		if (!$row) {
			throw new Exception("Kicker not found.");
		}

		return $row;
	}

	protected static function _getDefaultData() {
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

	public static function create($data) {

	}
}