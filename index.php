<!DOCTYPE html>
<title>Gambling Tracker</title>
<h1>Teams</h1>
<table border="1">
	<thead><tr>
		<th>Team ID</th>
		<th>Name</th>
		<th>Operations</th>
	</tr></thead>
	<tfoot><tr id="addTeamRow">
		<td colspan="3"><button id="addTeamButton">Add Team</button></td>
	</tr></tfoot>
	<tbody id="teamRows">
	</tbody>
</table>
<script src="jquery-1.9.0.min.js" type="text/javascript"></script>
<script type="text/javascript">
function addTeam() {
	"use strict";

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
						url: "teams.php",
						type: "POST",
						data: {
							action: "addTeam",
							name: $input.val()
						},
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
	"use strict";
}

$(function () {
	"use strict";

	$.ajax({
		url: "teams.php",
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
</script>

