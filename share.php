<?php
class Share {
	public static function facebook($url) {
		$encoded = urlencode($url);
		return "https://www.facebook.com/sharer.php?u=".$encoded;
	}

	public static function twitter($url) {
		$encoded = urlencode($url);
		return "https://twitter.com/intent/tweet?url=".$encoded;
	}

}


// https://twitter.com/intent/tweet
// 	?original_referer=https%3A%2F%2Fdev.twitter.com%2Fweb%2Ftweet-button
// 	&ref_src=twsrc%5Etfw&text=Tweet%20Button%20%7C%20Twitter%20Developers
// 	&tw_p=tweetbutton
// 	&url=https%3A%2F%2Fdev.twitter.com%2Fweb%2Ftweet-button