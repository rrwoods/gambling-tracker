/*jslint white: true */
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

				$(document).on("gambling:addTeam", function (event, team) {
					$teamInput.append($("<option></option>")
						.addClass("team" + team.teamID)
						.text(team.name)
						.val(team.teamID)
					);
				});

				$participant = $("<tr></tr>")
					.append($("<td></td>")
						.append($teamInput)
					).append($("<td></td>")
						.append($sharesInput)
					).append($("<td></td>")
					).append($("<td></td>")
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

	function setPool(pool, $teamCell, $descriptionCell, $operationsCell) {
		$teamCell.empty();
		$teamCell.text(teams[pool.teamID]);
		$descriptionCell.empty();
		$descriptionCell.text(pool.description);
		$operationsCell.empty();
		$operationsCell.append($("<button class='btn'>Edit</button>")
			.click(function () {
				var $input = $("<input placeholder='Description' type='text'>").val(pool.description);

				$descriptionCell.empty();
				$descriptionCell.append($input);
				$operationsCell.empty();
				$operationsCell.append($("<button class='btn'>Save</button>")
					.click(function () {
						$.post("pools/edit", {poolID: pool.poolID, description: $input.val()}, function (data, textStatus, jqXHR) {
							setPool(data, $teamCell, $descriptionCell, $operationsCell);
						}, "json");
					})
				);
			})
		);
	}

	function setTeam(team, $nameCell, $operationsCell) {
		teams[team.teamID] = team.name;
		$(".team" + team.teamID).text(team.name);

		$nameCell.empty();
		$nameCell.text(team.name);
		$operationsCell.empty();
		$operationsCell.append($("<button class='btn'>Edit</button>")
			.click(function () {
				var $input = $("<input placeholder='Name' type='text'>").val(team.name);

				$nameCell.empty();
				$nameCell.append($input);
				$operationsCell.empty();
				$operationsCell.append($("<button class='btn'>Save</button>")
					.click(function () {
						$.post("teams/edit", {teamID: team.teamID, name: $input.val()}, function (data, textStatus, jqXHR) {
							setTeam(data, $nameCell, $operationsCell);
						}, "json");
					})
				);
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

			$.getJSON("pools", {}, function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					$(document).trigger("gambling:addPool", value);
				});
			});

			$.getJSON("teams", {}, function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					$(document).trigger("gambling:addTeam", value);
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
				).append($("<td></td>")
				).append($("<td></td>")
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

		$(document).on("gambling:addPool", function (event, pool) {
			var $descriptionCell, $operationsCell, $teamCell;

			$teamCell = $("<td></td>").addClass("team" + pool.teamID);
			$descriptionCell = $("<td></td>");
			$operationsCell = $("<td></td>");

			setPool(pool, $teamCell, $descriptionCell, $operationsCell);

			$("#pools").append($("<tr></tr>")
				.append($teamCell)
				.append($descriptionCell)
				.append($("<td></td>").text(pool.balance))
				.append($operationsCell)
			);
		});

		$(document).on("gambling:addTeam", function (event, team) {
			var $nameCell, $operationsCell;

			$nameCell = $("<td></td>");
			$operationsCell = $("<td></td>");

			setTeam(team, $nameCell, $operationsCell);

			$("#teams").append($("<tr></tr>")
				.append($nameCell)
				.append($operationsCell)
			);

			if (team.hasOwnProperty("triprollPool")) {
				$(document).trigger("gambling:addPool", team.triprollPool);
			}
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

		$("#addPoolButton").click(function () {
			var $descriptionInput, $poolRow, $teamInput;

			$descriptionInput = $("<input placeholder='Description' type='text'>");
			$teamInput = $("<select></select>");
			$.each(teams, function (index, value) {
				$teamInput.append($("<option></option>")
					.addClass("team" + index)
					.text(value)
					.val(index)
				);
			});

			$(document).on("gambling:addTeam", function (event, team) {
				$teamInput.append($("<option></option>")
					.addClass("team" + team.teamID)
					.text(team.name)
					.val(team.teamID)
				);
			});

			$poolRow = $("<tr></tr>")
				.append($("<td></td>")
					.append($teamInput)
				).append($("<td></td>")
					.append($descriptionInput)
				).append($("<td>0</td>"))
				.append($("<td></td>")
					.append($("<button class='btn'>Save</button>")
						.click(function () {
							$.post("pools/add", {teamID: $teamInput.val(), description: $descriptionInput.val()}, function (data, textStatus, jqXHR) {
								$poolRow.remove();
								$(document).trigger("gambling:addPool", data);
							}, "json");
						})
					)
				)
			;

			$("#pools").append($poolRow);
		});

		$("#addTeamButton").click(function () {
			var $input, $teamRow;

			$input = $("<input placeholder='Name' type='text'>");
			$teamRow = $("<tr></tr>")
				.append($("<td></td>")
					.append($input)
				).append($("<td></td>")
					.append($("<button class='btn'>Save</button>")
						.click(function () {
							$.post("teams/add", {name: $input.val()}, function (data, textStatus, jqXHR) {
								$teamRow.remove();
								$(document).trigger("gambling:addTeam", data);
							}, "json");
						})
					)
				)
			;

			$("#teams").append($teamRow);
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