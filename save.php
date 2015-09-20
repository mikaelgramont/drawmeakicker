<?php
require("constants.php");
require("dbsettings.php");
require("kickerdao.php");
require("opengraph.php");

$kickerData = null;
try {
	$dbh = KickerDao::getDb();
	list($errors, $id) = KickerDao::create($_POST, $dbh);
	$status = $id ? "success" : "error";
	if ($id) {
		$kickerData = KickerDao::loadById($id, $dbh);
		$ogData = OpenGraph::getKickerData($kickerData);
	}
} catch (Exception $e) {
	$status = "error";
	$errors = array("exception");
}

$response = new stdClass();
$response->status = $status;
if ($errors) {
	$response->errors = $errors;
} else {
	$response->data = $kickerData;
	$response->ogData = $ogData;
}

echo json_encode($response);