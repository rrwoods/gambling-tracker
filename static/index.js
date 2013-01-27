(function ($, document) {
	"use strict";

	var teams;

	teams = {};

	function addChop(chopID, description, started) {
		$("#chopRows").append($("<tr></tr>")
			.append($("<td></td>").text(chopID))
			.append($("<td></td>").text(description))
			.append($("<td></td>").text(started))
			.append($("<td></td>")
				.append($("<button>Close</button>")
					.click(function () {
						$.ajax({
							url: "chops/close",
							type: "POST",
							data: {
								chopID: chopID
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

	function addPool(poolID, teamName, poolName) {
		$("#poolRows").append($("<tr></tr>")
			.append($("<td></td>").text(poolID))
			.append($("<td></td>").text(teamName))
			.append($("<td></td>").text(poolName))
			.append($("<td></td>")
			)
		);
	}

	function editTeam(teamID, name, $nameCell, $operationsCell) {
		var $input = $("<input>").val(name);

		$nameCell.empty();
		$nameCell.append($input);

		$operationsCell.empty();
		$operationsCell.append($("<button>Save</button>")
			.click(function () {
				$.ajax({
					url: "teams/edit",
					type: "POST",
					data: {
						name: $input.val(),
						teamID: teamID
					},
					dataType: "json",
					success: function (data, textStatus, jqXHR) {
						$nameCell.text(data.name);
						$operationsCell.empty();
						$operationsCell.append($("<button>Edit</button>")
							.click(function () {
								editTeam(data.teamID, data.name, $nameCell, $operationsCell)
							})
						);
					}
				});
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
		$.ajax({
			url: "chops",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data.chops, function (index, value) {
					addChop(value.chopID, value.description, value.started);
				});
			}
		});

		$.ajax({
			url: "teams",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data.teams, function (index, value) {
					var $nameCell, $operationsCell;

					teams[value.teamID] = value.name;

					$nameCell = $("<td></td>").text(value.name);
					$operationsCell = $("<td></td>")
						.append($("<button>Edit</button>")
							.click(function () {
								editTeam(value.teamID, value.name, $nameCell, $operationsCell)
							})
						);

					$("#teamRows").append($("<tr></tr>")
						.append($("<td></td>").text(value.teamID))
						.append($nameCell)
						.append($operationsCell)
					);
				});
			}
		});

		$.ajax({
			url: "pools",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data.pools, function (index, value) {
					addPool(value.poolID, teams[value.teamID], value.description);
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
								$IDCell.text(data.teamID);
								$nameCell.text(data.teamName);
								$operationsCell.empty();
								$operationsCell.append($("<button>Edit</button>")
									.click(function () {
										editTeam(data.teamID, data.name, $nameCell, $operationsCell)
									})
								);

								addChop(data.defaultChopID, data.defaultChopDescription);
								addPool(data.triprollPoolID, data.teamName, data.triprollPoolName);
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