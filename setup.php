<?php
	require("common.php");
	$db = connectDatabase();

	# This is MySQL specific - use InnoDB tables by default so we get
	# transactions
	$db->query("SET storage_engine=INNODB")->closeCursor();



	# Layer 1 tables: tables which do not depend on any others
	
	$db->query("
		CREATE TABLE IF NOT EXISTS gamblingPools
		(
			poolID      INT          NOT NULL auto_increment,
			description VARCHAR(256) NOT NULL,
			PRIMARY KEY(poolID)
		)
	")->closeCursor();

	$db->query("
		CREATE TABLE IF NOT EXISTS gamblingTeams
		(
			teamID INT          NOT NULL auto_increment,
			name   VARCHAR(256) NOT NULL,
			PRIMARY KEY(teamID)
		)
	")->closeCursor();



	# Layer 2 tables: tables which depend on layer 1 tables

	$db->query("
		CREATE TABLE IF NOT EXISTS gamblingChops
		(
			chopID INT NOT NULL auto_increment,
			teamID INT NOT NULL,
			shares INT NOT NULL,
			PRIMARY KEY(chopID),
			INDEX(teamID),
			FOREIGN KEY(teamID) REFERENCES gamblingTeams(teamID)
		 )
	")->closeCursor();

	$db->query("
		CREATE TABLE IF NOT EXISTS gamblingTransfers
		(
			transferID INT            NOT NULL auto_increment,
			fromID     INT            NOT NULL,
			toID       INT            NOT NULL,
			amount     DECIMAL(20, 2) NOT NULL,
			PRIMARY KEY(transferID),
			FOREIGN KEY(fromID) REFERENCES gamblingPools(poolID),
			FOREIGN KEY(toID)   REFERENCES gamblingPools(poolID)
		)
	")->closeCursor();



	# Layer 3 tables: tables which depend on layer 2 tables

	$db->query("
		CREATE TABLE IF NOT EXISTS gamblingSessions
		(
			sessionID   INT            NOT NULL auto_increment,
			teamID      INT            NOT NULL,
			chopID      INT            NOT NULL,
			result      DECIMAL(20, 2) NOT NULL,
			description VARCHAR(256)   NOT NULL,
			poolID      INT            NOT NULL,
			entered     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
			played      TIMESTAMP      NOT NULL,
			PRIMARY KEY(sessionID),
			FOREIGN KEY(teamID) REFERENCES gamblingTeams(teamID),
			FOREIGN KEY(chopID) REFERENCES gamblingChops(chopID),
			FOREIGN KEY(poolID) REFERENCES gamblingPools(poolID)
		)
	")->closeCursor();



	header("Location: index.php");
?>

