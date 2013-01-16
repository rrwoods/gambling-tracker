<?php
	require("common.php");
	$db = connectDatabase();

	$output = array();

	if(array_key_exists("action", $_POST))
	{
		$action = $_POST["action"];
		if("addTeam" === $action)
		{
			if(array_key_exists("name", $_POST))
			{
				$name = $_POST["name"];
				$statement = $db->prepare("
					INSERT INTO gamblingTeams
					SET name = :name
				");
				$statement->bindValue("name", $name);
				$statement->execute();
				$statement->closeCursor();

				$output["teamID"] = $db->lastInsertID();
				$output["name"] = $name;
			}
			else
			{
				$output["error"] = "No name specified";
			}
		}
		else
		{
			$output["error"] = "Invalid action";
		}
	}
	else
	{
		$statement = $db->prepare("
			SELECT
				teamID,
				name
			FROM gamblingTeams
			ORDER BY teamID ASC
		");
		$statement->execute();

		$output["teams"] = array();
		while(FALSE !== ($row = $statement->fetch()))
		{
			$teamID = intval($row["teamID"]);
			$name = $row["name"];
			$output["teams"][] = array("teamID" => $teamID, "name" => $name);
		}
		$statement->closeCursor();
	}

	echo(json_encode($output));
?>
