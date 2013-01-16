<?php
	require("config.php");

	function connectDatabase()
	{
		$db = new PDO(DB_PDO_SOURCE, DB_USER, DB_PASS, array(
			# Need to request a persistent connection when constructing the
			# handle so it actually has an effect
			PDO::ATTR_PERSISTENT => true
		));
		# Can't set this during construction since it's not "driver specific"
		$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING);
		return $db;
	}
?>
