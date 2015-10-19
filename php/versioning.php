<?php
class Versioning {
	public static function getFullPaths($unversionedPaths, $versionedList, $dev) {
		$versionedPaths = array();
		foreach ($unversionedPaths as $unversionedPath) {
			if (!isset($versionedList[$unversionedPath])) {
				throw new Exception("Could not find version information for: ".$unversionedPath);
			}
			if ($dev) {
			 	$versionedPaths[$unversionedPath] = $unversionedPath;
			} else {
				$versionedPaths[$unversionedPath] = $versionedList[$unversionedPath];	
			}
		}
		return $versionedPaths;
	}

	public static function getVersionList($unversionedPaths) {
		$versions = array();
		foreach ($unversionedPaths as $unversionedPath) {
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