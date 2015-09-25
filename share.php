<?php
class Share {
	public static function facebook($url) {
		$encoded = urlencode($url);
		return "https://www.facebook.com/sharer.php?u=".$encoded;
	}

	public static function twitter($url, $text) {
		$encoded = urlencode($url);
		return "https://twitter.com/intent/tweet?url=".$encoded;
	}

}