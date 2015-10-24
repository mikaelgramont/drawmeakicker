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
require("share.php");

$cache = Cache::getCache(CACHE_METHOD);
$kickerData = null;
try {	
	$dbh = KickerDao::getDb();
	list($errors, $id) = KickerDao::create($_POST, $dbh);
	$status = $id ? "success" : "error";
	if ($id) {
		$kickerData = KickerDao::loadById($id, $cache);
		$ogData = OpenGraph::getKickerData($kickerData);
	}
} catch (Exception $e) {
	$status = "error";
	$errors = array("An error occured, we were unable to save the kicker. Please try again later.");
}

$response = new stdClass();
$response->status = $status;
$response->share = new stdClass();
$response->share->twitterUrl = Share::twitter($ogData["og:url"], $ogData["og:title"], $ogData["og:description"]);
$response->share->facebookUrl = Share::facebook($ogData["og:url"], $ogData["og:title"], $ogData["og:description"]);
if ($errors) {
	$response->errors = $errors;
} else {
	$response->data = $kickerData;
}

echo json_encode($response);