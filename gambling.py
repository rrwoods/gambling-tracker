import bottle
import sqlite3

SQLITE3_DATABASE = "2015.sqlite3"
SQLITE3_SCHEMA = "schema.sql"
connection = sqlite3.connect(SQLITE3_DATABASE)

@bottle.route("/chops", method = "GET")
def chops():
	chopRows = connection.execute("""
		SELECT
			chopID,
			description,
			started
		FROM chops
		WHERE ended IS NULL
		ORDER BY chopID ASC
	""")
	ret = {}
	for chopRow in chopRows:
		chopID = int(chopRow[0])
		participants = {}
		participantRows = connection.execute("""
			SELECT
				chopParticipantID,
				teamID,
				shares,
				(
					SELECT sum(amount)
					FROM entries JOIN pools ON entries.intoPoolID = pools.poolID
					WHERE
						entries.chopID = :chopID AND
						pools.teamID = chopParticipants.teamID
				) as intoAmount,
				(
					SELECT sum(amount)
					FROM entries JOIN pools ON entries.fromPoolID = pools.poolID
					WHERE
						entries.chopID = :chopID AND
						pools.teamID = chopParticipants.teamID
				) as fromAmount
			FROM chopParticipants
			WHERE chopID = :chopID
			ORDER BY teamID ASC
		""", {
			"chopID": chopID
		})
		for participantRow in participantRows:
			chopParticipantID = int(participantRow[0])
			# SQL sum() returns NULL without any rows
			intoAmount = intOrNone(participantRow[3])
			if intoAmount is None:
				intoAmount = 0
			# SQL sum() returns NULL without any rows
			fromAmount = intOrNone(participantRow[4])
			if fromAmount is None:
				fromAmount = 0
			participants[chopParticipantID] = {
				"chopParticipantID": chopParticipantID,
				"teamID": int(participantRow[1]),
				"shares": int(participantRow[2]),
				"amount": intoAmount - fromAmount,
			}
		ret[chopID] = {
			"chopID": chopID,
			"description": str(chopRow[1]),
			"ended": None,
			"participants": participants,
			"started": str(chopRow[2]),
		}
	return ret

@bottle.route("/chops", method = "POST")
def chopsAdd():
	description = str(jsonParameter("description"))
	cursor = connection.cursor()
	cursor.execute("""
		INSERT INTO chops(description)
		VALUES (?)
	""", (description, ))
	chopID = cursor.lastrowid
	connection.commit()
	rows = cursor.execute("""
		SELECT started
		FROM chops
		WHERE chopID = (?)
	""", (chopID, ))
	for row in rows:
		started = str(row[0])
	return {
		"chopID": chopID,
		"description": description,
		"ended": None,
		"started": started,
	}

@bottle.route("/chops/<chopID>", method = "PUT")
def chopsEdit(chopID):
	ended = strOrNone(jsonParameter("ended"))
	description = str(jsonParameter("description"))
	cursor = connection.cursor()
	if ended is not None:
		cursor.execute("""
			UPDATE chops
			SET ended = ?
			WHERE
				chopID = ? AND
				chopID NOT IN
				(
					SELECT defaultChopID
					FROM teams
				)
		""", (ended, chopID))
	else:
		cursor.execute("""
			UPDATE chops
			SET description = ?
			WHERE
				chopID = ? AND
				chopID NOT IN
				(
					SELECT defaultChopID
					FROM teams
				)
		""", (description, chopID))
	if 1 != cursor.rowcount:
		raise bottle.HTTPResponse(status = 400, body = "Must specify the chopID of an existing non-default chop")
	connection.commit()
	return {
		"chopID": chopID,
		"description": description,
	}

@bottle.route("/chops/<chopID>/participants", method = "POST")
def chopsParticipantsAdd(chopID):
	teamID = int(jsonParameter("teamID"))
	shares = int(jsonParameter("shares"))
	cursor = connection.cursor()
	cursor.execute("""
		INSERT INTO chopParticipants(chopID, teamID, shares)
		VALUES (?, ?, ?)
	""", (chopID, teamID, shares))
	chopParticipantID = cursor.lastrowid
	connection.commit()
	rows = connection.execute("""
		SELECT
			(
				SELECT sum(amount)
				FROM entries JOIN pools ON entries.intoPoolID = pools.poolID
				WHERE
					entries.chopID = :chopID AND
					pools.teamID = :teamID
			) as intoAmount,
			(
				SELECT sum(amount)
				FROM entries JOIN pools ON entries.fromPoolID = pools.poolID
				WHERE
					entries.chopID = :chopID AND
					pools.teamID = :teamID
			) as fromAmount
	""", {
		"chopID": chopID,
		"teamID": teamID
	})
	for row in rows:
		# SQL sum() returns NULL without any rows
		intoAmount = intOrNone(row[0])
		if intoAmount is None:
			intoAmount = 0
		# SQL sum() returns NULL without any rows
		fromAmount = intOrNone(row[1])
		if fromAmount is None:
			fromAmount = 0
	return {
		"chopParticipantID": chopParticipantID,
		"teamID": teamID,
		"shares": shares,
		"amount": intoAmount - fromAmount
	}

@bottle.route("/chops/<chopID>/participants/<chopParticipantID>", method = "DELETE")
def chopsParticipantsDelete(chopID, chopParticipantID):
	cursor = connection.cursor()
	cursor.execute("""
		DELETE FROM chopParticipants
		WHERE chopParticipantID = ?
	""", (chopParticipantID, ))
	if 1 != cursor.rowcount:
		raise bottle.HTTPResponse(status = 400, body = "Must specify the chopParticipantID of an existing chop participant")
	connection.commit()
	return {}

@bottle.route("/css/<filename:path>")
def css(filename):
	return bottle.static_file(filename, root = "css/")

@bottle.route("/entries", method = "GET")
def entries():
	rows = connection.execute("""
		SELECT
			entryID,
			chopID,
			fromPoolID,
			intoPoolID,
			amount,
			description,
			entered,
			played
		FROM entries
		ORDER BY entryID ASC
	""")
	ret = {}
	for row in rows:
		entryID = int(row[0])
		ret[entryID] = {
			"entryID": entryID,
			"chopID": int(row[1]),
			"fromPoolID": intOrNone(row[2]),
			"intoPoolID": intOrNone(row[3]),
			"amount": float(row[4]),
			"description": str(row[5]),
			"entered": str(row[6]),
			"played": str(row[7]),
		}
	return ret

@bottle.route("/entries", method = "POST")
def entriesAdd():
	chopID = int(jsonParameter("chopID"))
	try:
		fromPoolID = int(bottle.request.json["fromPoolID"])
	except KeyError:
		fromPoolID = None
	try:
		intoPoolID = int(bottle.request.json["intoPoolID"])
	except KeyError:
		intoPoolID = None
	amount = float(jsonParameter("amount"))
	description = str(jsonParameter("description"))
	entered = str(jsonParameter("entered"))
	played = str(jsonParameter("played"))
	cursor = connection.cursor()
	cursor.execute("""
		INSERT INTO entries(chopID, fromPoolID, intoPoolID, amount, description, entered, played)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	""", (chopID, fromPoolID, intoPoolID, amount, description, entered, played))
	entryID = cursor.lastrowid
	connection.commit()
	return {
		"entryID": entryID,
		"chopID": chopID,
		"fromPoolID": fromPoolID,
		"intoPoolID": intoPoolID,
		"amount": amount,
		"description": description,
		"entered": entered,
		"played": played,
	}

@bottle.route("/entries/<entryID>", method = "DELETE")
def entriesDelete(entryID):
	cursor = connection.cursor()
	cursor.execute("""
		DELETE FROM entries
		WHERE entryID = ?
	""", (entryID, ))
	if 1 != cursor.rowcount:
		raise bottle.HTTPResponse(status = 400, body = "Must specify the entryID of an existing entry")
	connection.commit()
	return {}

# Anytime we have an error caused by us, not by the client
@bottle.error(500)
def error(exception):
	connection.rollback()
	return exception.body

@bottle.route("/execute", method = "POST")
def execute():
	statement = str(jsonParameter("statement"))
	rows = connection.execute(statement)
	rowCount = 0
	ret = {}
	for row in rows:
		ret[rowCount] = row
		rowCount += 1
	return ret

@bottle.route("/fonts/<filename:path>")
def fonts(filename):
	return bottle.static_file(filename, root = "fonts/")

@bottle.route("/")
def index():
	return bottle.static_file("index.html", root = ".")

def initializeDatabase(connection):
	with open(SQLITE3_SCHEMA, "r") as schema_file:
		connection.executescript(schema_file.read())
	connection.commit()
	# If the tables weren't created just now, vaccum to keep them optimized
	connection.execute("VACUUM")

def intOrNone(var):
	if var is None:
		return var
	return int(var)

@bottle.route("/js/<filename:path>")
def js(filename):
	return bottle.static_file(filename, root = "js/")

def jsonParameter(name):
	try:
		return bottle.request.json[name]
	except KeyError:
		raise bottle.HTTPResponse(status = 400, body = "Expected json parameter " + name)

@bottle.route("/pools", method = "GET")
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
	ret = {}
	for row in rows:
		poolID = int(row[0])
		ret[poolID] = {
			"poolID": poolID,
			"teamID": int(row[1]),
			"description": str(row[2]),
			"balance": float(row[3]),
		}
	return ret

@bottle.route("/pools", method = "POST")
def poolsAdd():
	teamID = int(jsonParameter("teamID"))
	description = str(jsonParameter("description"))
	cursor = connection.cursor()
	cursor.execute("""
		INSERT INTO pools(teamID, description)
		VALUES (?, ?)
	""", (teamID, description))
	poolID = cursor.lastrowid
	connection.commit()
	return {
		"poolID": poolID,
		"teamID": teamID,
		"description": description,
		"balance": 0,
	}

@bottle.route("/pools/<poolID>", method = "PUT")
def poolsEdit(poolID):
	description = str(jsonParameter("description"))
	cursor = connection.cursor()
	cursor.execute("""
		UPDATE pools
		SET description = ?
		WHERE poolID = ?
	""", (description, poolID))
	connection.commit()
	rows = cursor.execute("""
		SELECT
			teamID,
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
		WHERE poolID = ?
	""", (poolID, ))
	for row in rows:
		teamID = int(row[0])
		balance = float(row[1])
	return {
		"poolID": poolID,
		"teamID": teamID,
		"description": description,
		"balance": balance,
	}

def strOrNone(var):
	if var is None:
		return var
	return str(var)

@bottle.route("/teams", method = "GET")
def teams():
	rows = connection.execute("""
		SELECT
			teamID,
			name,
			defaultChopID,
			triprollPoolID
		FROM teams
		ORDER BY teamID ASC
	""")
	ret = {}
	for row in rows:
		teamID = int(row[0])
		ret[teamID] = {
			"teamID": int(row[0]),
			"name": str(row[1]),
			"defaultChopID": int(row[2]),
			"triprollPoolID": int(row[3]),
		}
	return ret

@bottle.route("/teams", method = "POST")
def teamsAdd():
	name = str(jsonParameter("name"))

	defaultChop = {
		"description": name + " default chop",
		"ended": None,
		"participants": {},
	}
	triprollPool = {
		"description": name + " triproll",
		"balance": 0.0,
	}

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
		"defaultChopID": defaultChop["chopID"],
		"triprollPool": triprollPool,
		"triprollPoolID": triprollPool["poolID"],
	}

@bottle.route("/teams/<teamID>", method = "PUT")
def teamsEdit(teamID):
	name = str(jsonParameter("name"))
	connection.execute("""
		UPDATE teams
		SET name = ?
		WHERE teamID = ?
	""", (name, teamID))
	connection.commit()
	rows = connection.execute("""
		SELECT
			defaultChopID,
			triprollPoolID
		FROM teams
		WHERE teamID = ?
	""", (teamID, ))
	for row in rows:
		defaultChopID = int(row[0])
		triprollPoolID = int(row[1])
	return {
		"teamID": teamID,
		"name": name,
		"defaultChopID": defaultChopID,
		"triprollPoolID": triprollPoolID,
	}

if __name__ == "__main__":
	print("Initializing database")
	initializeDatabase(connection)
	bottle.run(host = "localhost", port = 8080)
	print("Closing database")
	connection.close()
