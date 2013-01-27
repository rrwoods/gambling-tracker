import bottle
import json
import sqlite3

SQLITE3_DATABASE = "2013.sqlite3"
SQLITE3_SCHEMA = "schema.sql"
connection = sqlite3.connect(SQLITE3_DATABASE)

@bottle.route("/chops")
def chops():
	rows = connection.execute("""
		SELECT
			chopID,
			description,
			started
		FROM chops
		WHERE ended IS NULL
		ORDER BY chopID ASC
	""")
	output = {"chops": []}
	for row in rows:
		chopID = int(row[0])
		description = str(row[1])
		started = str(row[2])
		output["chops"].append({"chopID": chopID, "description": description, "started": started})
	return output

@bottle.route("/execute", method = "POST")
def execute():
	statement = formParameter("statement")
	rows = connection.execute(statement)
	# rows isn't a type the JSON library knows how to encode by default, but
	# tuple is, so use it for output instead
	output = tuple(rows)
	# This function should return JSON data, but Bottle doesn't automatically
	# translate tuples into JSON, so do it manually
	return json.dumps(output)

def formParameter(name):
	if name in bottle.request.forms:
		# Use getattr to take advantage of Bottle automatically decoding the
		# parameter
		return getattr(bottle.request.forms, name)
	raise bottle.HTTPResponse(status = 400, body = "Expected form parameter " + name)

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

def queryParameter(name):
	if name in bottle.request.query:
		# Use getattr to take advantage of Bottle automatically decoding the
		# parameter
		return getattr(bottle.request.query, name)
	raise bottle.HTTPResponse(status = 400, body = "Expected query parameter " + name)

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
	teamName = formParameter("name")

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
	name = formParameter("name")
	teamID = formParameter("teamID")

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
