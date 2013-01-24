(function ($, document) {
	"use strict";

	function editTeam(teamID, name, $nameCell, $operationsCell) {
		var $input = $(document.createElement("INPUT"))
			.val(name);

		$nameCell.empty();
		$nameCell.append($input);

		$operationsCell
			.empty()
			.append($(document.createElement("BUTTON"))
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
					)
				)
			);
		});
	});
}(jQuery, document));