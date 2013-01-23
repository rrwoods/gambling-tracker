(function ($, document) {
	"use strict";

	function addTeam() {
		var $ID, $input, $name;

		$ID = $(document.createElement("TD")).text("Auto");
		$input = $(document.createElement("INPUT"));
		$name = $(document.createElement("TD")).append($input);

		$("#addTeamRow").before($(document.createElement("TR"))
			.append($ID)
			.append($name)
			.append($(document.createElement("TD"))
				.append($(document.createElement("BUTTON"))
					.click(function () {
						$.ajax({
							url: "teams/add/" + $input.val(),
							type: "POST",
							dataType: "json",
							error: function (jqXHR, textStatus, errorThrown) {
								alert(textStatus + errorThrown);
							},
							success: function (data, textStatus, jqXHR) {
								if(data.hasOwnProperty("error")) {
									$name.text(data.error);
								} else {
									$ID.text(data.teamID);
									$name.text(data.name);
								}
							}
						});
					})
					.text("Save")
				)
			)
		);
	}

	function editTeam(teamID) {
	}

	$(function () {
		$.ajax({
			url: "teams",
			type: "GET",
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				$.each(data.teams, function (index, value) {
					$("#teamRows").append($(document.createElement("TR"))
						.append($(document.createElement("TD"))
							.text(value.teamID)
						).append($(document.createElement("TD"))
							.text(value.name)
						).append($(document.createElement("TD"))
							.append($(document.createElement("BUTTON"))
								.click(function () {
									
								})
								.text("Edit")
							)
						)
					);
				});
			}
		});

		$("#addTeamButton").click(addTeam);
	});
}(jQuery, document));