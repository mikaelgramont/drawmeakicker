<?php
class KickerDao {
	protected static $_table = 'kickers';

	public static function loadById($id, $dbh) {
		$stmt = $dbh->prepare("SELECT * FROM " . self::$_table . " WHERE id = :id");
		$stmt->bindParam(':id', $id);
		$stmt->execute();
		$row = $stmt->fetch();

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
}