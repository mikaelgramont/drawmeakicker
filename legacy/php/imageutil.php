<?php
class ImageUtil {
	public static function saveImage($data, $path) {
		$data = str_replace('data:image/png;base64,', '', $data);
		$data = str_replace(' ', '+', $data);
		$data = base64_decode($data);

		$file = UPLOAD_DIR . uniqid() . '.png';
		$success = file_put_contents($path, $data);
		return $success;
	}
}