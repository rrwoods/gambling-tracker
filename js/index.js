(function (angular, undefined) {
	"use strict";

	var app = angular.module("gamblingApp", ['ngResource']);

	app.factory("GamblingData", ["$resource", "$window", function ($resource, $window) {
		var ajaxError, Pool, ret, Team;

		ajaxError = function (error) {
			$window.console.error("AJAX error " + error.status + ": " + error.data);
			$window.alert("AJAX error; see console for more details; if you were changing data, you should reload the page");
		};

		Pool = $resource("pools/:poolID");
		Team = $resource("teams/:teamID");

		ret = {
			addPool: function (teamID, poolDescription) {
				Pool.save({
					teamID: teamID,
					description: poolDescription
				}, function (data) {
					ret.pools[data.poolID] = data;
				}, ajaxError);
			},
			addTeam: function (teamName) {
				Team.save({
					name: teamName
				}, function (data) {
					ret.teams[data.teamID] = data;
					ret.pools[data.triprollPool.poolID] = data.triprollPool;
				}, ajaxError);
			},
			setPool: function (pool) {
				Pool.save({
					poolID: pool.poolID
				}, {
					description: pool.description
				}, angular.noop, ajaxError);
			},
			setTeam: function (team) {
				Team.save({
					teamID: team.teamID
				}, {
					name: team.name
				}, angular.noop, ajaxError);
			},
			pools: Pool.get(angular.noop, ajaxError),
			teams: Team.get(angular.noop, ajaxError)
		};
		return ret;
	}]);

	app.controller("PoolsCtrl", ["$scope", 'GamblingData', function ($scope, GamblingData) {
		$scope.model = {
			addPool: GamblingData.addPool,
			pools: GamblingData.pools,
			setPool: GamblingData.setPool,
			teams: GamblingData.teams
		};
	}]);

	app.controller("TeamsCtrl", ["$scope", 'GamblingData', function ($scope, GamblingData) {
		$scope.model = {
			addTeam: GamblingData.addTeam,
			setTeam: GamblingData.setTeam,
			teams: GamblingData.teams
		};
	}]);
/*global angular: false */
}(angular));


(function ($, document, window) {
	"use strict";

	var chopCount, $chopsRow, chopWidth, teams;

	chopCount = 0;
	chopWidth = 6;
	teams = {};

	function displayChop($chop) {
		$chop.addClass("well");
		$chop.addClass("span" + chopWidth);
		if (0 === chopCount % (12 / chopWidth)) {
			$chopsRow = $("<div class='row-fluid'></div>");
			$("#chops").append($chopsRow);
		}
		$chopsRow.append($chop);
		chopCount += 1;
	}

	function setChop(chop, $chop, $participants, $descriptionCell, $operationsCell) {
		$descriptionCell.empty();
		$descriptionCell.text(chop.description);
		$operationsCell.empty();
		$operationsCell.append($("<button class='btn'>Edit</button>")
			.click(function () {
				var $input = $("<input placeholder='Description' type='text'>").val(chop.description);

				$descriptionCell.empty();
				$descriptionCell.append($input);
				$operationsCell.empty();
				$operationsCell.append($("<button class='btn'>Save</button>")
					.click(function () {
						$.post("chops/edit", {chopID: chop.chopID, description: $input.val()}, function (data, textStatus, jqXHR) {
							setChop(data, $chop, $participants, $descriptionCell, $operationsCell);
						}, "json");
					})
				);
			})
		);
		$operationsCell.append($("<button class='btn'>Add Participant</button>")
			.click(function () {
				var $participant, $sharesInput, $teamInput;

				$sharesInput = $("<input class='input-mini' placeholder='Shares' type='number'></input>");
				$teamInput = $("<select></select>");
				$.each(teams, function (index, value) {
					$teamInput.append($("<option></option>")
						.addClass("team" + index)
						.text(value)
						.val(index)
					);
				});

				$participant = $("<tr></tr>")
					.append($("<td></td>")
						.append($teamInput)
					).append($("<td></td>")
						.append($sharesInput)
					).append($("<td>0</td>")
					).append($("<td>0</td>")
					).append($("<td></td>")
						.append($("<button class='btn'>Save</button>")
							.click(function () {
								$.post("chops/participants/add", {chopID: chop.chopID, teamID: $teamInput.val(), shares: $sharesInput.val()}, function (data, textStatus, jqXHR) {
									$participant.remove();
									$(document).trigger("gambling:addChopParticipant", [chop.chopID, $participants, data]);
								}, "json");
							})
						)
					)
				;
				$participants.append($participant);
			})
		);
		$operationsCell.append($("<button class='btn'>Close Chop</button>")
			.click(function () {
				$.post("chops/close", {chopID: chop.chopID}, function (data, textStatus, jqXHR) {
					$chop.remove();
				}, "json");
			})
		);
	}

	$(document).ajaxError(function (event, jqXHR, ajaxSettings, thrownError) {
		window.console.error("AJAX error with status " + jqXHR.status + ": \"" + jqXHR.statusText + "\"");
		if(jqXHR.hasOwnProperty("responseText")) {
			window.console.error("Response text is \"" + jqXHR.responseText + "\"");
		}
		window.alert("AJAX error; see console for more details");
	});

	$(document).ready(function () {
		if (0 === $("#dataLoaded").length) {
			$.getJSON("chops", {}, function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					$(document).trigger("gambling:addChop", value);
				});
			});

			$("body").append($("<div id='dataLoaded'></div>"));
		}

		$(document).on("gambling:addChop", function (event, chop) {
			var $chop, $description, $operations, $participants;

			$participants = $("<table border='1' class='table table-bordered table-condensed table-hover'><thead><th>Team</th><th>Shares</th><th>Result</th><th>Actual</th><th>Operations</th></thead></table>");
			$description = $("<p class='lead'></p>");
			$operations = $("<p></p>");

			$chop = $("<div></div>")
				.append($description)
				.append($("<p></p>").text("Started " + chop.started))
				.append($participants)
				.append($operations)
			;

			setChop(chop, $chop, $participants, $description, $operations);

			$.getJSON("chops/participants", {chopID: chop.chopID}, function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					$(document).trigger("gambling:addChopParticipant", [chop.chopID, $participants, value]);
				});
			});

			displayChop($chop);
		});

		$(document).on("gambling:addChopParticipant", function (event, chopID, $participants, participant) {
			var $participant = $("<tr></tr>")
				.append($("<td></td>")
					.addClass("team" + participant.teamID)
					.text(teams[participant.teamID])
				).append($("<td></td>")
					.text(participant.shares)
				).append($("<td>0</td>")
				).append($("<td>0</td>")
				).append($("<td></td>")
					.append($("<button class='btn'>Delete</button>")
						.click(function () {
							$.post("chops/participants/delete", {chopID: chopID, teamID: participant.teamID}, function (data, textStatus, jqXHR) {
								$participant.remove();
							}, "json");
						})
					)
				)
			;
			$participants.append($participant);
		});

		$("#addEntryButton").click(function () {
			var $input;

			$input = $("<input placeholder='Description' type='text'></input>");
		});

		$("#addChopButton").click(function () {
			var $chop, $input;

			$input = $("<input placeholder='Description' type='text'></input>");
			$chop = $("<div></div>")
				.append($("<p></p>")
					.append($input)
				).append($("<button class='btn'>Save</button>")
					.click(function () {
						$.post("chops/add", {description: $input.val()}, function (data, textStatus, jqXHR) {
							$chop.remove();
							$(document).trigger("gambling:addChop", data);
						}, "json");
					})
				)
			;

			displayChop($chop);
		});

		$("#executeSQLButton").click(function () {
			$.post("execute", {statement: $("#executeSQLInput").val()}, function (data, textStatus, jqXHR) {
				$("#executeSQLTable").empty().append($.map(data, function (value, index) {
					return $("<tr></tr>")
						.append($.map(value, function (innerValue, innerIndex) {
							return $("<td></td>").text(innerValue);
						}))
					;
				}));
			}, "json");
		});
	});
/*global jQuery: false, document: false, window: false */
}(jQuery, document, window));
