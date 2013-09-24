/*jslint white: true */
(function (angular) {
	"use strict";

	var app = angular.module("gamblingApp", ['ngResource']);

	app.factory("AJAXError", ["$window", function ($window) {
		return function (error) {
			$window.console.error("AJAX error " + error.status + ": " + error.data);
			$window.alert("AJAX error; see console for more details; if you were changing data, you should reload the page");
		};
	}]);

	app.factory("ExecuteSQL", ["$http", "AJAXError", function ($http, AJAXError) {
		var ret = {
			execute: function (statement) {
				$http.post("execute", {
					statement: statement
				}).then(function (response) {
					ret.output.rows = response.data;
				}, AJAXError);
			},
			output: {
				rows: {}
			}
		};
		return ret;
	}]);

	app.factory("GamblingData", ["$resource", "AJAXError", function ($resource, AJAXError) {
		var Chop, ChopParticipant, Entry, Pool, ret, Team;

		Chop = $resource("chops/:chopID");
		ChopParticipant = $resource("chops/:chopID/participants/:chopParticipantID");
		Entry = $resource("entries/:entryID");
		Pool = $resource("pools/:poolID");
		Team = $resource("teams/:teamID");

		ret = {
			addChop: function (chop) {
				Chop.save({}, chop, function (data) {
					ret.chops[data.chopID] = data;
					// A new chop has no participants and we don't need to
					// check that against the server, so just set it here
					data.participants = {};
				}, AJAXError);
			},
			addChopParticipant: function (chop, participant) {
				ChopParticipant.save({
					chopID: chop.chopID
				}, participant, function (data) {
					chop.participants[data.chopParticipantID] = data;
				}, AJAXError);
			},
			addEntry: function (entry) {
				if (entry.fromPoolID === "") {
					delete entry.fromPoolID;
				}
				if (entry.intoPoolID === "") {
					delete entry.intoPoolID;
				}
				entry.entered = (new Date()).toISOString();
				entry.played = entry.entered;
				Entry.save({}, entry, function (data) {
					ret.entries[data.entryID] = data;
				}, AJAXError);
			},
			addPool: function (pool) {
				Pool.save({}, pool, function (data) {
					ret.pools[data.poolID] = data;
				}, AJAXError);
			},
			addTeam: function (team) {
				Team.save({}, team, function (data) {
					ret.teams[data.teamID] = data;
					ret.pools[data.triprollPool.poolID] = data.triprollPool;
				}, AJAXError);
			},
			closeChop: function (chop) {
				chop.ended = (new Date()).toISOString();
				Chop.save({
					chopID: chop.chopID
				}, chop, function () {
					delete ret.chops[chop.chopID];
				}, AJAXError);
			},
			deleteChopParticipant: function (chop, participant) {
				ChopParticipant.remove({
					chopID: chop.chopID,
					chopParticipantID: participant.chopParticipantID
				}, function () {
					delete chop.participants[participant.chopParticipantID];
				}, AJAXError);
			},
			deleteEntry: function (entry) {
				Entry.remove({
					entryID: entry.entryID
				}, function () {
					delete ret.entries[entry.entryID];
				}, AJAXError);
			},
			saveChop: function (chop) {
				Chop.save({
					chopID: chop.chopID
				}, chop, angular.noop, AJAXError);
			},
			savePool: function (pool) {
				Pool.save({
					poolID: pool.poolID
				}, pool, angular.noop, AJAXError);
			},
			saveTeam: function (team) {
				Team.save({
					teamID: team.teamID
				}, team, angular.noop, AJAXError);
			},
			chops: Chop.get(function (chops) {
				angular.forEach(chops, function (chop) {
					chop.participants = ChopParticipant.get({
						chopID: chop.chopID
					}, angular.noop, AJAXError);
				});
			}, AJAXError),
			entries: Entry.get(angular.noop, AJAXError),
			pools: Pool.get(angular.noop, AJAXError),
			teams: Team.get(angular.noop, AJAXError)
		};
		return ret;
	}]);

	app.controller("ChopsCtrl", ["$scope", "GamblingData", function ($scope, GamblingData) {
		$scope.model = {
			addChop: GamblingData.addChop,
			addChopParticipant: GamblingData.addChopParticipant,
			chops: GamblingData.chops,
			closeChop: GamblingData.closeChop,
			deleteChopParticipant: GamblingData.deleteChopParticipant,
			saveChop: GamblingData.saveChop,
			teams: GamblingData.teams,
			totalAmount: function(chop) {
				var ret = 0;
				angular.forEach(chop.participants, function (participant) {
					ret += participant.amount;
				});
				return ret;
			},
			totalShares: function(chop) {
				var ret = 0;
				angular.forEach(chop.participants, function (participant) {
					ret += participant.shares;
				});
				return ret;
			}
		};
	}]);

	app.controller("EntriesCtrl", ["$scope", "GamblingData", function ($scope, GamblingData) {
		$scope.model = {
			addEntry: GamblingData.addEntry,
			chops: GamblingData.chops,
			deleteEntry: GamblingData.deleteEntry,
			entries: GamblingData.entries,
			pools: GamblingData.pools
		};
	}]);

	app.controller("PoolsCtrl", ["$scope", "GamblingData", function ($scope, GamblingData) {
		$scope.model = {
			addPool: GamblingData.addPool,
			pools: GamblingData.pools,
			savePool: GamblingData.savePool,
			teams: GamblingData.teams
		};
	}]);

	app.controller("SQLCtrl", ["$scope", "ExecuteSQL", function ($scope, ExecuteSQL) {
		$scope.model = {
			executeSQL: ExecuteSQL.execute,
			output: ExecuteSQL.output
		};
	}]);

	app.controller("TeamsCtrl", ["$scope", "GamblingData", function ($scope, GamblingData) {
		$scope.model = {
			addTeam: GamblingData.addTeam,
			saveTeam: GamblingData.saveTeam,
			teams: GamblingData.teams
		};
	}]);

	app.filter("makeRows", [function () {
		// We cache the reults so that Angular doesn't think we keep returning
		// different objects
		var makeRows = function (input, num) {
			var cacheKey, count, inner, ret;

			cacheKey = angular.toJson({
				input: input,
				num: num
			});

			if (makeRows.cache.hasOwnProperty(cacheKey)) {
				return makeRows.cache[cacheKey];
			}

			count = 0;
			inner = {};
			ret = [inner];
			angular.forEach(input, function (value, key) {
				inner[key] = value;
				count += 1;
				if (count === num) {
					count = 0;
					inner = {};
					ret.push(inner);
				}
			});

			makeRows.cache[cacheKey] = ret;
			return ret;
		};
		makeRows.cache = {};
		return makeRows;
	}]);

	app.filter("noDefaultChops", [function () {
		var noDefaultChops = function (chops, teams) {
			var cacheKey, ret;

			cacheKey = angular.toJson({
				chops: chops,
				teams: teams
			});

			if (noDefaultChops.cache.hasOwnProperty(cacheKey)) {
				return noDefaultChops.cache[cacheKey];
			}

			ret = {};
			angular.forEach(chops, function (chop, chopID) {
				var found = false;
				angular.forEach(teams, function (team) {
					if (team.defaultChopID == chopID) {
						found = true;
					}
				});
				if (!found) {
					ret[chopID] = chop;
				}
			});
			return ret;
		};
		noDefaultChops.cache = {};
		return noDefaultChops;
	}]);
/*global angular: false */
}(angular));
