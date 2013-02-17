/*jslint white: true */
(function ($, document, window) {
	"use strict";

	var $chopsRow, chopsCount, chopWidth, teams;

	chopsCount = 0;
	chopWidth = 4;
	teams = {};

	function setPool(pool, $teamCell, $descriptionCell, $operationsCell) {
		$teamCell.empty();
		$teamCell.text(teams[pool.teamID]);
		$descriptionCell.empty();
		$descriptionCell.text(pool.description);
		$operationsCell.empty();
		$operationsCell.append($("<button class='btn'>Edit</button>")
			.click(function () {
				var $input = $("<input>").val(pool.description);

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
				var $input = $("<input>").val(team.name);

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
			var $participants = $("<table border='1' class='table table-bordered table-condensed table-hover'><thead><th>Team</th><th>Shares</th><th>Operations</th></thead></table>");

			$.getJSON("chops/participants", {chopID: chop.chopID}, function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					$participants.append($("<tr></tr>")
						.append($("<td></td>")
							.addClass("team" + value.teamID)
							.text(teams[value.teamID])
						).append($("<td></td>").text(value.shares))
						.append($("<td></td>")
							.append($("<button class='btn'>Edit</button>"))
							.append($("<button class='btn'>Delete</button>"))
						)
					);
				});
			});

			// Each row can hold only 12 columns
			if (0 === chopsCount % (12 / chopWidth)) {
				$chopsRow = $("<div class='chops-row row-fluid'></div>");
				$("#chops").append($chopsRow);
			}

			$chopsRow.append($("<div></div>")
				.addClass("well")
				.addClass("span" + chopWidth)
				.append($("<p class='lead'></p>").text(chop.description))
				.append($("<p></p>").text("Started " + chop.started))
				.append($participants)
				.append($("<button class='btn'>Add Participant</button>"))
				.append($("<button class='btn'>Close Chop</button>"))
			);

			chopsCount += 1;
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

			if (team.hasOwnProperty("defaultChop")) {
				$(document).trigger("gambling:addChop", team.defaultChop);
			}
			if (team.hasOwnProperty("triprollPool")) {
				$(document).trigger("gambling:addPool", team.triprollPool);
			}
		});

		$("#addChopButton").click(function () {
			var $chop, $input;

			$input = $("<input></input>");
			$chop = $("<div></div>")
				.addClass("well")
				.addClass("span" + chopWidth)
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

			// Each row can hold only 12 columns
			if (0 === chopsCount % (12 / chopWidth)) {
				$chopsRow = $("<div class='chops-row row-fluid'></div>");
				$("#chops").append($chopsRow);
			}

			$chopsRow.append($chop);
			chopsCount += 1;
		});

		$("#addPoolButton").click(function () {
			var $descriptionInput, $poolRow, $teamInput;

			$descriptionInput = $("<input>");
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

			$input = $("<input>");
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