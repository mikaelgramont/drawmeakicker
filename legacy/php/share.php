<?php
class Share {
	public static function facebook($url) {
		$url .= "&utm=facebook";
		$encoded = urlencode($url);
		return "https://www.facebook.com/sharer.php?u=".$encoded;
	}

	public static function twitter($url, $title, $description) {
		$url .= "&utm=twitter";

		$shareUrl = "https://twitter.com/intent/tweet";
		$shareUrl .= "?url=".urlencode($url);

		$text = array();
		if ($title) {
			$text[] = $title;
		}
		if ($description) {
			$text[] = $description;
		}
		$shareUrl .= "&text=".urlencode(implode(" - ", $text));

		return $shareUrl;
	}

}