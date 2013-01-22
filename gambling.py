import bottle
import sqlite3

SQLITE3_FILE = "2013.sqlite3"
connection = sqlite3.connect(SQLITE3_FILE)

@bottle.route("/")
def index():
	return bottle.static_file("index.html", root = "static/")

def initializeDatabase(connection):
	# Layer 1 tables which all other tables depend on
	connection.execute("""
		CREATE TABLE IF NOT EXISTS chops
		(
			chopID      INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
			started     TIMESTAMP    NOT NULL,
			ended       TIMESTAMP    NOT NULL,
			description VARCHAR(256) NOT NULL
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS infoTypes
		(
			typeID INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
			name   VARCHAR(256) NOT NULL
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS pools
		(
			poolID      INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
			description VARCHAR(256) NOT NULL,
			teamID      INTEGER      NOT NULL REFERENCES teams(teamID)
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS teams
		(
			teamID         INTEGER      NOT NULL PRIMARY KEY AUTOINCREMENT,
			name           VARCHAR(256) NOT NULL,
			defaultChopID  INTEGER      NOT NULL REFERENCES chops(chopID),
			triprollPoolID INTEGER      NOT NULL REFERENCES pools(poolID) DEFERRABLE INITIALLY DEFERRED
		)
	""")

	# Layer 2 tables which depend on layer 1 tables
	connection.execute("""
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
		)
	""")
	connection.execute("""
		CREATE TABLE IF NOT EXISTS chopParticipants
		(
			chopID INTEGER NOT NULL REFERENCES chops(chopID),
			teamID INTEGER NOT NULL REFERENCES teams(teamID),
			shares INTEGER NOT NULL
		)
	""")

	# Layer 3 tables which depend on layer 2 tables
	connection.execute("""
		CREATE TABLE IF NOT EXISTS entryInfo
		(
			entryID INTEGER NOT NULL REFERENCES entries(entryID),
			typeID  INTEGER NOT NULL REFERENCES infoTypes(typeID),
			data    INTEGER NOT NULL
		)
	""")

	connection.commit()
	# If the tables weren't created just now, vaccum to keep them optimized
	connection.execute("VACUUM")

@bottle.route("/static/<filename:path>")
def static(filename):
	return bottle.static_file(filename, root = "static/")

@bottle.route("/teams")
def teams():
	rows = connection.execute("""
		SELECT
			teamID,
			name
		FROM teams
		ORDER BY teamID ASC
	""")
	output = {"teams": []}
	for row in rows:
		teamID = int(row["teamID"])
		name = str(row["name"])
		output["teams"].append({"teamID": teamID, "name": name})
	return output

@bottle.route("/teams/add/:name", method = "POST")
def teamsAdd(name):
	print(name)
	cursor = connection.cursor()
	cursor.execute("""
		INSERT INTO teams(name)
		VALUES (?)
	""", (name, ))
	connection.commit()
	return {"teamID": cursor.lastrowid, "name": name}

@bottle.route("/teams/edit/:teamID/:name", method = "POST")
def teamsEdit(teamID, name):
	connection.execute("""
		UPDATE teams
		SET name = ?
		WHERE teamID = ?
	""", name, teamID)
	connection.commit()
	return {"teamID": teamID, "name": name}

if __name__ == "__main__":
	print("Initializing database")
	initializeDatabase(connection)
	bottle.run(host = "localhost", port = 8080)
	print("Closing database")
	connection.close()
