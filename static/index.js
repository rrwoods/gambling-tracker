(function ($) {
	"use strict";

	var teams;

	teams = {};

	function addChop(chopID, description, started) {
		$("#chopRows").append($("<tr></tr>")
			.append($("<td></td>").text(chopID))
			.append($("<td></td>").text(description))
			.append($("<td></td>").text(started))
			.append($("<td></td>"))
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
					error: function (jqXHR, textStatus, errorThrown) {
						alert(textStatus + errorThrown);
					},
					success: function (data, textStatus, jqXHR) {
						if(data.hasOwnProperty("error")) {
							alert(data.error);
						} else {
							$nameCell.text(data.name);
							$operationsCell.empty();
							$operationsCell.append($("<button>Edit</button>")
								.click(function () {
									editTeam(data.teamID, data.name, $nameCell, $operationsCell)
								})
							);
						}
					}
				});
			})
		);
	}

	$(function () {
		$.ajax({
			url: "chops",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				console.log(data)
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
									$operationsCell.append($("<button>Edit</button>")
										.click(function () {
											editTeam(data.teamID, data.name, $nameCell, $operationsCell)
										})
									);

									addChop(data.defaultChopID, data.defaultChopDescription);
									addPool(data.triprollPoolID, data.teamName, data.triprollPoolName);
								}
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
	});
}(jQuery));