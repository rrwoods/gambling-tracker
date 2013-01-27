(function ($, document) {
	"use strict";

	var teams;

	teams = {};

	function addChop(chop) {
		$("#chopRows").append($("<tr></tr>")
			.append($("<td></td>").text(chop.chopID))
			.append($("<td></td>").text(chop.description))
			.append($("<td></td>").text(chop.started))
			.append($("<td></td>")
				.append($("<button>Close</button>")
					.click(function () {
						$.ajax({
							url: "chops/close",
							type: "POST",
							data: {
								chopID: chop.chopID
							},
							dataType: "json",
							success: function (data, textStatus, jqXHR) {
								
							}
						});
					})
				)
			)
		);
	}

	function addPool(pool) {
		$("#poolRows").append($("<tr></tr>")
			.append($("<td></td>").text(pool.poolID))
			.append($("<td></td>").text(teams[pool.teamID]))
			.append($("<td></td>").text(pool.description))
			.append($("<td></td>").text(pool.balance))
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
			var $IDCell, $input, $nameCell, $operationsCell;

			$input = $("<input>");

			$IDCell = $("<td></td>").text("Auto");
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

								$IDCell.text(data.teamID);
								$nameCell.text(data.name);
								$operationsCell.empty();

								addChop(data.defaultChop);
								addPool(data.triprollPool);
							}
						});
					})
				);

			$("#teamRows").append($("<tr></tr>")
				.append($IDCell)
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