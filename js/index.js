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
		var Chop, ChopParticipant, Pool, ret, Team;

		Chop = $resource("chops/:chopID");
		ChopParticipant = $resource("chops/:chopID/participants/:chopParticipantID");
		Pool = $resource("pools/:poolID");
		Team = $resource("teams/:teamID");

		ret = {
			addChop: function (description) {
				Chop.save({
					description: description
				}, function (data) {
					ret.chops[data.chopID] = data;
				}, AJAXError);
			},
			addChopParticipant: function (chop, teamID, shares) {
				ChopParticipant.save({
					chopID: chop.chopID
				}, {
					teamID: teamID,
					shares: shares
				}, function (data) {
					chop.participants[data.chopParticipantID] = data;
				}, AJAXError);
			},
			addPool: function (teamID, poolDescription) {
				Pool.save({
					teamID: teamID,
					description: poolDescription
				}, function (data) {
					ret.pools[data.poolID] = data;
				}, AJAXError);
			},
			addTeam: function (teamName) {
				Team.save({
					name: teamName
				}, function (data) {
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
				ChopParticipant.delete({
					chopID: chop.chopID,
					chopParticipantID: participant.chopParticipantID
				}, function () {
					delete chop.participants[participant.chopParticipantID];
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
			chops: Chop.get(function () {
				angular.forEach(ret.chops, function (value) {
					value.participants = ChopParticipant.get({
						chopID: value.chopID
					}, angular.noop, AJAXError);
				});
			}, AJAXError),
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
			teams: GamblingData.teams
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
/*global angular: false */
}(angular));
