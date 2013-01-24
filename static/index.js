(function ($, document) {
	"use strict";

	var teams;

	teams = {};

	function addChop(chopID, description) {
		$("#chopRows").append($("<tr></tr>")
			.append($("<td></td>").text(chopID))
			.append($("<td></td>").text(description))
			.append($("<td></td>")
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
		var $input = $(document.createElement("INPUT"))
			.val(name);

		$nameCell.empty();
		$nameCell.append($input);

		$operationsCell.empty();
		$operationsCell.append($(document.createElement("BUTTON"))
			.click(function () {
				$.ajax({
					url: "teams/edit",
					type: "POST",
					data: {
						name: $input.val(),
						teamID: teamID
					},
					dataType: "json",
					error: function (jqXHR, textStatus, errorThrown) {
						alert(textStatus + errorThrown);
					},
					success: function (data, textStatus, jqXHR) {
						if(data.hasOwnProperty("error")) {
							alert(data.error);
						} else {
							$nameCell.text(data.name);
							$operationsCell.empty();
							$operationsCell.append($(document.createElement("BUTTON"))
								.click(function () {
									editTeam(data.teamID, data.name, $nameCell, $operationsCell)
								})
								.text("Edit")
							);
						}
					}
				});
			})
			.text("Save")
		);
	}

	$(function () {
		$.ajax({
			url: "teams",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data.teams, function (index, value) {
					var $nameCell, $operationsCell;

					teams[value.teamID] = value.name;

					$nameCell = $(document.createElement("TD"));
					$operationsCell = $(document.createElement("TD"));

					$("#teamRows").append($(document.createElement("TR"))
						.append($(document.createElement("TD"))
							.text(value.teamID)
						).append($nameCell
							.text(value.name)
						).append($operationsCell
							.append($(document.createElement("BUTTON"))
								.click(function () {
									editTeam(value.teamID, value.name, $nameCell, $operationsCell)
								})
								.text("Edit")
							)
						)
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

			$input = $(document.createElement("INPUT"));

			$IDCell = $(document.createElement("TD")).text("Auto");
			$nameCell = $(document.createElement("TD")).append($input);
			$operationsCell = $(document.createElement("TD"));

			$("#teamRows").append($(document.createElement("TR"))
				.append($IDCell)
				.append($nameCell)
				.append($operationsCell
					.append($(document.createElement("BUTTON"))
						.click(function () {
							$.ajax({
								url: "teams/add",
								type: "POST",
								data: {
									name: $input.val()
								},
								dataType: "json",
								error: function (jqXHR, textStatus, errorThrown) {
									alert(textStatus + errorThrown);
								},
								success: function (data, textStatus, jqXHR) {
									if(data.hasOwnProperty("error")) {
										alert(data.error);
									} else {
										$IDCell.text(data.teamID);
										$nameCell.text(data.teamName);
										$operationsCell.empty();
										$operationsCell.append($(document.createElement("BUTTON"))
											.click(function () {
												editTeam(data.teamID, data.name, $nameCell, $operationsCell)
											})
											.text("Edit")
										);

										addChop(data.defaultChopID, data.defaultChopDescription);
										addPool(data.triprollPoolID, data.teamName, data.triprollPoolName);
									}
								}
							});
						})
						.text("Save")
					)
				)
			);
		});
	});
}(jQuery, document));