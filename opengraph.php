<?php
class OpenGraph {
	public static function getKickerData($data) {
		$ogData = array();
		
		$title = $data->title ? $data->title : SITE_TITLE;
		$ogData["og:title"] = $title;

		$description = $data->description ? $data->description : OG_DESCRIPTION;
		$ogData["og:description"] = $description;

		$ogData["og:url"] = "http://www.local.dev/?id=".$data->id;

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