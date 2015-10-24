<?php
class OpenGraph {
	public static function getKickerData($data) {
		$ogData = array();
		
		$title = $data->title ? $data->title : SITE_TITLE;
		$ogData["og:title"] = $title;

		if ($data->description) {
			$description = $data->description . " - ". OG_DESCRIPTION;
		} else {
			$description = OG_DESCRIPTION;
		}
		$ogData["og:description"] = $description ;

		// Use '%' as a placeholder so it can be easily replaced on the client after saving.
		$ogData["og:url"] = SITE_URL . "/?id=". ($data->id ? $data->id : '%');

		$ogData["og:image"] = SITE_URL . "/" . DEFAULT_OG_IMAGE;

		return $ogData;
	}

	public static function renderProperties($ogData) {
		$out = "";
		foreach ($ogData as $k => $v) {
			$out .= self::_renderProperty($k, $v) . "\n";
		}
		return $out;
	}

	protected static function _renderProperty($name, $value) {
		return '<meta property="'.$name.'" content="'.htmlspecialchars($value).'" />';
	}
}