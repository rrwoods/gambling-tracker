import bottle
# Any function with a route should return a JSON string, but Bottle doesn't
# automatically translate lists/tuples into JSON, so use this library to do it
# manually
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
	return json.dumps([{
		"chopID": int(row[0]),
		"description": str(row[1]),
		"started": str(row[2])
	} for row in rows])

# Anytime we have an error caused by us, not by the client
@bottle.error(500)
def error(exception):
	connection.rollback()
	return exception.body

@bottle.route("/execute", method = "POST")
def execute():
	statement = formParameter("statement")
	rows = connection.execute(statement)
	# rows isn't a type the JSON library knows how to encode by default, but
	# tuple is, so use it for output instead
	return json.dumps(tuple(rows))

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
			description,
			(
				SELECT total(amount)
				FROM entries
				WHERE intoPoolID = poolID
			) - (
				SELECT total(amount)
				FROM entries
				WHERE fromPoolID = poolID
			) as balance
		FROM pools
		ORDER BY poolID ASC
	""")
	return json.dumps([{
		"poolID": int(row[0]),
		"teamID": int(row[1]),
		"description": str(row[2]),
		"balance": float(row[3])
	} for row in rows])

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
	return json.dumps([{
		"teamID": int(row[0]),
		"name": str(row[1])
	} for row in rows])

@bottle.route("/teams/add", method = "POST")
def teamsAdd():
	name = formParameter("name")

	defaultChop = {"description": name + " default chop"}
	triprollPool = {"description": name + " triproll", "balance": 0.0}

	cursor = connection.cursor()

	cursor.execute("""
		INSERT INTO chops(description)
		VALUES (?)
	""", (defaultChop["description"], ))
	defaultChop["chopID"] = cursor.lastrowid

	rows = cursor.execute("""
		SELECT started
		FROM chops
		WHERE chopID = ?
	""", (defaultChop["chopID"], ))
	for row in rows:
		defaultChop["started"] = str(row[0])

	# The real value for triprollPoolID will be assigned below
	cursor.execute("""
		INSERT INTO teams(name, defaultChopID, triprollPoolID)
		VALUES (?, ?, ?)
	""", (name, defaultChop["chopID"], -1))
	teamID = cursor.lastrowid

	cursor.execute("""
		INSERT INTO pools(teamID, description)
		VALUES (?, ?)
	""", (teamID, triprollPool["description"]))
	triprollPool["poolID"] = cursor.lastrowid
	triprollPool["teamID"] = teamID

	cursor.execute("""
		UPDATE teams
		SET triprollPoolID = ?
		WHERE teamID = ?
	""", (triprollPool["poolID"], teamID))

	cursor.execute("""
		INSERT INTO chopParticipants(chopID, teamID, shares)
		VALUES (?, ?, ?)
	""", (defaultChop["chopID"], teamID, 1))

	connection.commit()
	return {
		"teamID": teamID,
		"name": name,
		"defaultChop": defaultChop,
		"triprollPool": triprollPool
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
