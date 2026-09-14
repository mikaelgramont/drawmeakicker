<?php
class Versioning {
	public static function getFullPaths($unversionedPaths, $versionedList, $filePrefix, $dev) {
		$versionedPaths = array();
		foreach ($unversionedPaths as $unversionedPath) {
			if (!isset($versionedList[$unversionedPath])) {
				throw new Exception("Could not find version information for: ".$unversionedPath);
			}
			if ($dev) {
			 	$versionedPaths[$unversionedPath] = $filePrefix . $unversionedPath;
			} else {
				$versionedPaths[$unversionedPath] = $filePrefix . $versionedList[$unversionedPath];	
			}
		}
		return $versionedPaths;
	}

	public static function getVersionList($unversionedPaths, $cache) {
		if($cache) {
			$versions = $cache->load('versions');
		} else {
			$versions = null;
		}

		if(!$versions) {
			$versions = array();
			foreach ($unversionedPaths as $unversionedPath) {
				$versions[$unversionedPath] = self::getVersionedFilePath($unversionedPath);
			}
		}
		
		if ($cache) {
			$cache->save($versions, 'versions');
		}
		return $versions;
	}

	public static function getVersionedFilePath($path) {
		// Insert the commit hash right before the extension.
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
					
		// Return only the first 6 characters of the commit hash,
		// as displayed in GitHub.
    	return substr($matches[1], 0, 6);
    }	
}