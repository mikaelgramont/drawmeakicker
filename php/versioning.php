<?php
class Versioning {
	public static function getFullFilePath($path, $versionedList, $dev) {
		if ($dev) {
		  return $path;
		}
		if (!isset($versionedList[$path])) {
			throw new Exception("Could not find version information for: ".$path);
		}
		return $versionedList[$path];
	}

	public static function getVersionList($files) {
		$versions = array();
		foreach ($files as $unversionedPath) {
			$versions[$unversionedPath] = self::getVersionedFilePath($unversionedPath);
		}
		return $versions;
	}

	public static function getVersionedFilePath($path) {
		$parts = explode('.', $path);
		$extension = array_pop($parts);
		$parts[] = self::getGitCommitHash($path);
		$parts[] = $extension;
		return implode('.', $parts);
	}

	public static function getGitCommitHash($path) {
		$commandTemplate = 'git log -n 1 %s';
    	$gitResponse = @shell_exec(sprintf($commandTemplate, $path));
		$preg = '/commit ([a-f0-9]{32})/';
		preg_match($preg, $gitResponse, $matches);
		if(!isset($matches[1])) {
			error_log("Cannot find revision for file: ".$path);
			return '';
		}
					
    	return substr($matches[1], 0, 6);
    }	
}