(function ($, document) {
	"use strict";

	var teams;

	teams = {};

	function addChop(chop) {
		var $participants = $("<table border='1'><thead><th>Team</th><th>Shares</th><th>Operations</th></thead></table>");

		$.getJSON("chops/participants", {chopID: chop.chopID}, function (data, textStatus, jqXHR) {
			$.each(data, function (index, value) {
				$participants.append($("<tr></tr>")
					.append($("<td></td>").text(teams[value.teamID]))
					.append($("<td></td>").text(value.shares))
					.append($("<td></td>")
						.append($("<button>Edit</button>"))
						.append($("<button>Delete</button>"))
					)
				);
			});
		});

		$("#chops").append($("<div></div>")
			.addClass("chop")
			.text(chop.description + " started " + chop.started)
			.append($participants)
			.append($("<button>Add Participant</button>"))
			.append($("<button>Close Chop</button>"))
		);
	}

	function addPool(pool) {
		$("#poolRows").append($("<tr></tr>")
			.append($("<td></td>").text(teams[pool.teamID]))
			.append($("<td></td>").text(pool.description))
			.append($("<td></td>").text(pool.balance))
			.append($("<td></td>"))
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
		$.ajax({
			url: "chops",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					addChop(value);
				});
			}
		});

		$.ajax({
			url: "teams",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					teams[value.teamID] = value.name;

					$("#teamRows").append($("<tr></tr>")
						.append($("<td></td>").text(value.teamID))
						.append($("<td></td>").text(value.name))
						.append($("<td></td>"))
					);
				});
			}
		});

		$.ajax({
			url: "pools",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data, function (index, value) {
					addPool(value);
				});
			}
		});

		$("#addTeamButton").click(function () {
			var $input, $nameCell, $operationsCell;

			$input = $("<input>");

			$nameCell = $("<td></td>").append($input);
			$operationsCell = $("<td></td>")
				.append($("<button>Save</button>")
					.click(function () {
						$.ajax({
							url: "teams/add",
							type: "POST",
							data: {
								name: $input.val()
							},
							dataType: "json",
							success: function (data, textStatus, jqXHR) {
								teams[data.teamID] = data.name;

								$nameCell.text(data.name);
								$operationsCell.empty();

								addChop(data.defaultChop);
								addPool(data.triprollPool);
							}
						});
					})
				);
			;

			$("#teamRows").append($("<tr></tr>")
				.append($nameCell)
				.append($operationsCell)
			);
		});

		$("#executeSQLButton").click(function () {
			$.ajax({
				url: "execute",
				type: "POST",
				data: {
					statement: $("#executeSQLInput").val()
				},
				dataType: "json",
				success: function (data, textStatus, jqXHR) {
					$("#executeSQLTable").empty().append($.map(data, function (value, index) {
						return $("<tr></tr>")
							.append($.map(value, function (innerValue, innerIndex) {
								return $("<td></td>").text(innerValue);
							}))
						;
					}));
				}
			});
		});
	});
}(jQuery, document));