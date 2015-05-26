<?php
define('UPLOAD_DIR', 'uploads/');

if (!isset($_POST['img'])) {
	throw new Exception("No image found", 1);
}

$img = $_POST['img'];
$img = str_replace('data:image/png;base64,', '', $img);
$img = str_replace(' ', '+', $img);
$data = base64_decode($img);

$file = UPLOAD_DIR . uniqid() . '.png';
$success = file_put_contents($file, $data);

$response = new stdClass();
if ($success) {
	$response->status = 'ok';
	$response->url = $file;
} else {
	$response->status = 'error';
}

echo json_encode($response);