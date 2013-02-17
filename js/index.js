(function ($, document) {
	"use strict";

	var $chopsRow, chopsCount, chopWidth, teams;

	chopsCount = 0;
	chopWidth = 4;
	teams = {};

	function loadData() {
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
				var $nameCell, $operationsCell;

				$nameCell = $("<td></td>");
				$operationsCell = $("<td></td>");

				setTeam(value, $nameCell, $operationsCell);

				$("#teams").append($("<tr></tr>")
					.append($nameCell)
					.append($operationsCell)
				);
			});
		});

		$("body").append($("<div id='dataLoaded'></div>"));
	}

	function setPool(pool, $teamCell, $descriptionCell, $operationsCell) {
		$teamCell.empty();
		$teamCell.text(teams[pool.teamID]);
		$descriptionCell.empty();
		$descriptionCell.text(pool.description);
		$operationsCell.empty();
		$operationsCell.append($("<button>Edit</button>")
			.click(function () {
				var $input = $("<input>").val(pool.description);

				$descriptionCell.empty();
				$descriptionCell.append($input);
				$operationsCell.empty();
				$operationsCell.append($("<button>Save</button>")
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
		$operationsCell.append($("<button>Edit</button>")
			.click(function () {
				var $input = $("<input>").val(team.name);

				$nameCell.empty();
				$nameCell.append($input);
				$operationsCell.empty();
				$operationsCell.append($("<button>Save</button>")
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
		console.error("AJAX error with status " + jqXHR.status + ": \"" + jqXHR.statusText + "\"");
		if(jqXHR.hasOwnProperty("responseText")) {
			console.error("Response text is \"" + jqXHR.responseText + "\"");
		}
		alert("AJAX error; see console for more details");
	});

	$(document).ready(function () {
		if (0 === $("#dataLoaded").length) {
			loadData();
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
			if (0 == chopsCount % (12 / chopWidth)) {
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

			chopsCount++;
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
			$(document).trigger("gambling:addChop", team.defaultChop);
			$(document).trigger("gambling:addPool", team.triprollPool);
		});

		$("#addPoolButton").click(function () {
			var $descriptionCell, $descriptionInput, $operationsCell, $teamCell, $teamInput;

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

			$teamCell = $("<td></td>").append($teamInput);
			$descriptionCell = $("<td></td>").append($descriptionInput);
			$operationsCell = $("<td></td>")
				.append($("<button>Save</button>")
					.click(function () {
						$.post("pools/add", {teamID: $teamInput.val(), description: $descriptionInput.val()}, function (data, textStatus, jqXHR) {
							setPool(data, $teamCell, $descriptionCell, $operationsCell);
						}, "json");
					})
				)
			;

			$("#pools").append($("<tr></tr>")
				.append($teamCell)
				.append($descriptionCell)
				.append($("<td>0</td>"))
				.append($operationsCell)
			);
		});

		$("#addTeamButton").click(function () {
			var $input, $nameCell, $operationsCell;

			$input = $("<input>");

			$nameCell = $("<td></td>").append($input);
			$operationsCell = $("<td></td>")
				.append($("<button>Save</button>")
					.click(function () {
						$.post("teams/add", {name: $input.val()}, function (data, textStatus, jqXHR) {
							setTeam(data, $nameCell, $operationsCell);
							$(document).trigger("gambling:addTeam", data);
						}, "json");
					})
				)
			;

			$("#teams").append($("<tr></tr>")
				.append($nameCell)
				.append($operationsCell)
			);
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
}(jQuery, document));