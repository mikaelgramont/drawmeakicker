<?php
require_once('Zend/Cache/Backend/Apc.php');
class Zend_Cache_Backend_ApcPassThru extends Zend_Cache_Backend_Apc
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
