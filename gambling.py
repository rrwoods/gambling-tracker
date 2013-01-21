import bottle
import sqlite3

@bottle.route("/")
def hello():
	return "Hello World"

conn = sqlite3.connect("example.sqlite3")
conn.close()
bottle.run(host = "localhost", port = 8080)
