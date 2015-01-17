/*jslint white: true */
(function (angular) {
	"use strict";

	var app = angular.module("gamblingApp", ['ngResource']);

	app.factory("AJAXError", ["$window", function ($window) {
		return function (error) {
			$window.console.error("AJAX error: " + error.data);
			$window.alert("AJAX error: " + error.data + ". If you were changing data, you should reload the page.");
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

		// REST defines POST as adding a new item to a collection and PUT as
		// replacing an item. $resource.save() uses POST even when the object
		// already exists, so define custom "update" methods to use instead.
		Chop = $resource("chops/:chopID", {}, {
			update: {method: "PUT"},
		});
		ChopParticipant = $resource("chops/:chopID/participants/:chopParticipantID");
		Entry = $resource("entries/:entryID");
		Pool = $resource("pools/:poolID", {}, {
			update: {method: "PUT"},
		});
		Team = $resource("teams/:teamID", {}, {
			update: {method: "PUT"},
		});

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
				return Pool.save({}, pool, function (data) {
					ret.pools[data.poolID] = data;
				}, AJAXError);
			},
			addTeam: function (team) {
				return Team.save({}, team, function (data) {
					ret.teams[data.teamID] = data;
					ret.chops[data.defaultChop.chopID] = data.defaultChop;
					ret.pools[data.triprollPool.poolID] = data.triprollPool;
				}, AJAXError);
			},
			closeChop: function (chop) {
				chop.ended = (new Date()).toISOString();
				Chop.update({
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
				Chop.update({
					chopID: chop.chopID
				}, chop, angular.noop, AJAXError);
			},
			savePool: function (pool) {
				return Pool.update({
					poolID: pool.poolID
				}, pool, function (data) {
					ret.pools[data.poolID] = data;
				}, AJAXError);
			},
			saveTeam: function (team) {
				return Team.update({
					teamID: team.teamID
				}, team, function (data) {
					ret.teams[data.teamID] = data;
				}, AJAXError);
			},
			chops: Chop.get(angular.noop, AJAXError),
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
			pools: GamblingData.pools,
			teams: GamblingData.teams
		};
	}]);

	app.controller("PoolsCtrl", ["$scope", "GamblingData", function ($scope, GamblingData) {
		$scope.model = {
			// This keeps track of which pool is currently being added or edited
			detail: null,
			pools: GamblingData.pools,
			saveDetail: function () {
				if ($scope.model.detail.poolID) {
					GamblingData.savePool($scope.model.detail).$promise.then(function () {
						$scope.model.detail = null;
					});
				} else {
					GamblingData.addPool($scope.model.detail).$promise.then(function () {
						$scope.model.detail = null;
					});
				}
			},
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
			// This keeps track of which team is currently being added or edited
			detail: null,
			saveDetail: function () {
				if ($scope.model.detail.teamID) {
					GamblingData.saveTeam($scope.model.detail).$promise.then(function () {
						$scope.model.detail = null;
					});
				} else {
					GamblingData.addTeam($scope.model.detail).$promise.then(function () {
						$scope.model.detail = null;
					});
				}
			},
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
