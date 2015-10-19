<?php
class Cache {
	const MEMCACHED = 'Memcached';
	const APC = 'APC';
	const FILE = 'File';	

	const DIR = CACHE_DIR;
	const TTL = 3600;

	/**
	 * Cache object
	 * @var Zend_Cache_Core
	 */
	protected static $_cache;

	public static function getCache($method)
	{
		if(!self::$_cache) {
			self::$_cache = self::cacheFactory(
				$method, array(
					'dir' => self::DIR,
					'ttl' => self::TTL
				)
			);
		}
		return self::$_cache;
	}	

	/**
	 * Factory method for a cache object
	 *
	 * @param string $method
	 * @return Zend_Cache_Core
	 */
	public static function cacheFactory($method = null, $options = array())
	{
		$frontOptions = array(
			'lifetime' => $options['ttl'],
			'automatic_serialization' => true
		);
		if(empty($method)){
			$method = self::MEMCACHED;
		}
		if($method == self::MEMCACHED && !extension_loaded('memcache')){
			$method = self::APC;
        }
		if($method == self::APC && !ini_get("apc.enabled")){
			$method = self::FILE;
		}
		
		switch ($method){
			case self::APC:
            	$backOptions  = array();
				break;
			case self::FILE:
			default:
				$backOptions  = array();
				$backOptions['cache_dir'] = realpath($options['dir']);
				break;
			case 'Memcached':
				$backOptions = array(
					'servers' => array(
						array(
							'host' => '127.0.0.1',
							'port' => 11211,
							'persistent' =>  true
						)
					)
				);
				break;
            }
        $cache = Zend_Cache::factory('Core', $method, $frontOptions, $backOptions);
		return $cache;
	}	
}