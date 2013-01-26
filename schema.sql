-- Layer 1 tables which all other tables depend on

CREATE TABLE IF NOT EXISTS chops
(
	chopID      INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
	description VARCHAR(256) NOT NULL,
	started     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
	ended       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS infoTypes
(
	typeID INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
	name   VARCHAR(256) NOT NULL
);

CREATE TABLE IF NOT EXISTS pools
(
	poolID      INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
	description VARCHAR(256) NOT NULL,
	teamID      INTEGER      NOT NULL REFERENCES teams(teamID)
);

CREATE TABLE IF NOT EXISTS teams
(
	teamID         INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
	name           VARCHAR(256) NOT NULL,
	defaultChopID  INTEGER      NOT NULL REFERENCES chops(chopID),
	triprollPoolID INTEGER      NOT NULL REFERENCES pools(poolID) DEFERRABLE INITIALLY DEFERRED
);


-- Layer 2 tables which depend on layer 1 tables

CREATE TABLE IF NOT EXISTS entries
(
	entryID     INTEGER        NOT NULL PRIMARY KEY AUTOINCREMENT,
	chopID      INT            NOT NULL REFERENCES chops(chopID),
	fromPoolID  INTEGER        NOT NULL REFERENCES pools(poolID),
	intoPoolID  INTEGER        NOT NULL REFERENCES pools(poolID),
	amount      DECIMAL(20, 2) NOT NULL,
	description VARCHAR(256)   NOT NULL,
	poolID      INT            NOT NULL,
	entered     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
	played      TIMESTAMP      NOT NULL
);

CREATE TABLE IF NOT EXISTS chopParticipants
(
	chopID INTEGER NOT NULL REFERENCES chops(chopID),
	teamID INTEGER NOT NULL REFERENCES teams(teamID),
	shares INTEGER NOT NULL
);


-- Layer 3 tables which depend on layer 2 tables

CREATE TABLE IF NOT EXISTS entryInfo
(
	entryID INTEGER NOT NULL REFERENCES entries(entryID),
	typeID  INTEGER NOT NULL REFERENCES infoTypes(typeID),
	data    INTEGER NOT NULL
);
