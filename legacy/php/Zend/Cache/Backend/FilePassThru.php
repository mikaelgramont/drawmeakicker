<?php
require_once('Zend/Cache/Backend/File.php');
class Zend_Cache_Backend_FilePassThru extends Zend_Cache_Backend_File
{
	public function load($id, $doNotTestCacheValidity = false)
	{
		return false;
	}
	
	public function save($data, $id, $tags = array(), $specificLifetime = false)
	{
		return true;
	}
}
