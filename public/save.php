<?php
set_include_path('../php');
require("constants.php");
require('Zend/Loader.php');
require('Zend/Cache.php');
require('Zend/Exception.php');
require("cache.php");
require("dbsettings.php");
require("imageutil.php");
require("kickerdao.php");
require("opengraph.php");

$cache = Cache::getCache(CACHE_METHOD);
$kickerData = null;
try {	
	$dbh = KickerDao::getDb();
	list($errors, $id) = KickerDao::create($_POST, $dbh);
	$status = $id ? "success" : "error";
	if ($id) {
		$kickerData = KickerDao::loadById($id, $cache);
	}
} catch (Exception $e) {
	$status = "error";
	$errors = array("An error occured, we were unable to save the kicker. Please try again later.");
}

$response = new stdClass();
$response->status = $status;
if ($errors) {
	$response->errors = $errors;
} else {
	$response->data = $kickerData;
}

echo json_encode($response);