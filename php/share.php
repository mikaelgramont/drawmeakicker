<?php
class Share {
	public static function facebook($url) {
		$url .= "&utm=facebook";
		$encoded = urlencode($url);
		return "https://www.facebook.com/sharer.php?u=".$encoded;
	}

	public static function twitter($url, $title, $description) {
		$url .= "&utm=twitter";
		$encoded = urlencode($url);
		$shareUrl = "https://twitter.com/intent/tweet";

		$text = array();
		if ($title) {
			$text[] = $title;
		}
		if ($description) {
			$text[] = $description;
		}
		$text[] = $url;
		$text = implode(" - ", $text);
		$shareUrl .= "?text=".$text;

		return $shareUrl;
	}

}