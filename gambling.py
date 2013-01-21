import bottle
import sqlite3

SQLITE3_FILE = "2013.sqlite3"

def initializeDatabase(connection):
	# Layer 1 tables which all other tables depend on
	connection.execute("""
		CREATE TABLE IF NOT EXISTS chops
		(
			chopID      INTEGER      NOT NULL CONSTRAINT "primaryKey" PRIMARY KEY AUTOINCREMENT,
			started     TIMESTAMP    NOT NULL,
			ended       TIMESTAMP    NOT NULL,
			description VARCHAR(256) NOT NULL
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS infoTypes
		(
			typeID INTEGER      NOT NULL CONSTRAINT "primaryKey" PRIMARY KEY AUTOINCREMENT,
			name   VARCHAR(256) NOT NULL
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS pools
		(
			poolID      INTEGER      NOT NULL CONSTRAINT "primaryKey" PRIMARY KEY AUTOINCREMENT,
			description VARCHAR(256) NOT NULL,
			teamID      INTEGER      NOT NULL,
			CONSTRAINT "foreignKeyTeamID" FOREIGN KEY (teamID) REFERENCES teams(teamID)
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS teams
		(
			teamID         INTEGER      NOT NULL CONSTRAINT "primaryKey" PRIMARY KEY AUTOINCREMENT,
			name           VARCHAR(256) NOT NULL,
			defaultChopID  INTEGER NOT NULL,
			triprollPoolID INTEGER NOT NULL,
			CONSTRAINT "foreignKeyDefaultChopID"  FOREIGN KEY (defaultChopID)  REFERENCES chops(chopID),
			CONSTRAINT "foreignKeyTriprollPoolID" FOREIGN KEY (triprollPoolID) REFERENCES pools(poolID)
		)
	""")

	# Layer 2 tables which depend on layer 1 tables
	connection.execute("""
		CREATE TABLE IF NOT EXISTS entries
		(
			entryID     INTEGER        NOT NULL CONSTRAINT "primaryKey" PRIMARY KEY AUTOINCREMENT,
			chopID      INT            NOT NULL,
			fromPoolID  INTEGER        NOT NULL,
			intoPoolID  INTEGER        NOT NULL,
			amount      DECIMAL(20, 2) NOT NULL,
			description VARCHAR(256)   NOT NULL,
			poolID      INT            NOT NULL,
			entered     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
			played      TIMESTAMP      NOT NULL,
			CONSTRAINT "foreignKeyChopID"     FOREIGN KEY(chopID)     REFERENCES chops(chopID),
			CONSTRAINT "foreignKeyFromPoolID" FOREIGN KEY(fromPoolID) REFERENCES pools(poolID),
			CONSTRAINT "foreignKeyIntoPoolID" FOREIGN KEY(intoPoolID) REFERENCES pools(poolID)
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS chopParticipants
		(
			chopID INTEGER NOT NULL,
			teamID INTEGER NOT NULL,
			shares INTEGER NOT NULL,
			CONSTRAINT "foreignKeyChopID" FOREIGN KEY(chopID) REFERENCES chops(chopID),
			CONSTRAINT "foreignKeyTeamID" FOREIGN KEY(teamID) REFERENCES teams(teamID)
		)
	""")

	# Layer 3 tables which depend on layer 2 tables
	connection.execute("""
		CREATE TABLE IF NOT EXISTS entryInfo
		(
			entryID INTEGER NOT NULL,
			typeID  INTEGER NOT NULL,
			data    INTEGER NOT NULL,
			CONSTRAINT "foreignKeyEntryID" FOREIGN KEY(entryID) REFERENCES entries(entryID),
			CONSTRAINT "foreignKeyTypeID"  FOREIGN KEY(typeID)  REFERENCES infoTypes(typeID)
		)
	""")

	connection.commit()
	# If the tables weren't created just now, vaccum to keep them optimized
	connection.execute("VACUUM")

@bottle.route("/teams")
def teams():
	return "Hello World"

if __name__ == "__main__":
	print("Opening database")
	connection = sqlite3.connect(SQLITE3_FILE)
	print("Initializing database")
	initializeDatabase(connection)
	bottle.run(host = "localhost", port = 8080)
	print("Closing database")
	connection.close()
