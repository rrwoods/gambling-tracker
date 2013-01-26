import bottle
import sqlite3

SQLITE3_DATABASE = "2013.sqlite3"
SQLITE3_SCHEMA = "schema.sql"
connection = sqlite3.connect(SQLITE3_DATABASE)

@bottle.route("/")
def index():
	return bottle.static_file("index.html", root = "static/")

def initializeDatabase(connection):
	with open(SQLITE3_SCHEMA, "r") as schema_file:
		connection.executescript(schema_file.read())
	connection.commit()
	# If the tables weren't created just now, vaccum to keep them optimized
	connection.execute("VACUUM")

@bottle.route("/pools")
def pools():
	rows = connection.execute("""
		SELECT
			poolID,
			teamID,
			description
		FROM pools
		ORDER BY poolID ASC
	""")
	output = {"pools": []}
	for row in rows:
		poolID = int(row[0])
		teamID = int(row[1])
		description = str(row[2])
		output["pools"].append({"poolID": poolID, "teamID": teamID, "description": description})
	return output

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
		teamID = int(row[0])
		name = str(row[1])
		output["teams"].append({"teamID": teamID, "name": name})
	return output

@bottle.route("/teams/add", method = "POST")
def teamsAdd():
	teamName = bottle.request.forms.name

	cursor = connection.cursor()

	defaultChopDescription = teamName + " default chop"
	cursor.execute("""
		INSERT INTO chops(description)
		VALUES (?)
	""", (defaultChopDescription, ))
	defaultChopID = cursor.lastrowid

	# The real value for triprollPoolID will be assigned below
	cursor.execute("""
		INSERT INTO teams(name, defaultChopID, triprollPoolID)
		VALUES (?, ?, ?)
	""", (teamName, defaultChopID, -1))
	teamID = cursor.lastrowid

	triprollPoolName = teamName + " triproll"
	cursor.execute("""
		INSERT INTO pools(teamID, description)
		VALUES (?, ?)
	""", (teamID, triprollPoolName))
	triprollPoolID = cursor.lastrowid

	cursor.execute("""
		UPDATE teams
		SET triprollPoolID = ?
		WHERE teamID = ?
	""", (triprollPoolID, teamID))

	defaultChopShares = 1
	cursor.execute("""
		INSERT INTO chopParticipants(chopID, teamID, shares)
		VALUES (?, ?, ?)
	""", (defaultChopID, teamID, defaultChopShares))

	connection.commit()
	return {
		"defaultChopDescription": defaultChopDescription,
		"defaultChopID": defaultChopID,
		"defaultChopShares": defaultChopShares,
		"teamID": teamID,
		"teamName": teamName,
		"triprollPoolID": triprollPoolID,
		"triprollPoolName": triprollPoolName
	}

@bottle.route("/teams/edit", method = "POST")
def teamsEdit():
	name = bottle.request.forms.name
	teamID = bottle.request.forms.teamID

	connection.execute("""
		UPDATE teams
		SET name = ?
		WHERE teamID = ?
	""", (name, teamID))
	connection.commit()
	return {"teamID": teamID, "name": name}

if __name__ == "__main__":
	print("Initializing database")
	initializeDatabase(connection)
	bottle.run(host = "localhost", port = 8080)
	print("Closing database")
	connection.close()
