(function ($, document) {
	"use strict";

	var $chopsRow, chopsCount, chopWidth;

	chopsCount = 0;
	chopWidth = 4;

	function addChop(chop) {
		var $participants = $("<table border='1' class='table table-bordered table-condensed table-hover'><thead><th>Team</th><th>Shares</th><th>Operations</th></thead></table>");

		$.getJSON("chops/participants", {chopID: chop.chopID}, function (data, textStatus, jqXHR) {
			$.each(data, function (index, value) {
				$participants.append($("<tr></tr>")
					.append($("<td></td>").addClass("team" + value.teamID))
					.append($("<td></td>").text(value.shares))
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
	}

	function addPool(pool) {
		$("#pools").append($("<tr></tr>")
			.append($("<td></td>").addClass("team" + pool.teamID))
			.append($("<td></td>").text(pool.description))
			.append($("<td></td>").text(pool.balance))
			.append($("<td></td>"))
		);
	}

	function loadData() {
		$.getJSON("chops", {}, function (data, textStatus, jqXHR) {
			$.each(data, function (index, value) {
				addChop(value);
			});
		});

		$.getJSON("pools", {}, function (data, textStatus, jqXHR) {
			$.each(data, function (index, value) {
				addPool(value);
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

	function setTeam(team, $nameCell, $operationsCell) {
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

		$("#addTeamButton").click(function () {
			var $input, $nameCell, $operationsCell;

			$input = $("<input>");

			$nameCell = $("<td></td>").append($input);
			$operationsCell = $("<td></td>")
				.append($("<button>Save</button>")
					.click(function () {
						$.post("teams/add", {name: $input.val()}, function (data, textStatus, jqXHR) {
							setTeam(data, $nameCell, $operationsCell);
							addChop(data.defaultChop);
							addPool(data.triprollPool);
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