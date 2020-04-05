const db = require("../dbConfig.js");

module.exports = {
	add,
	find,
	findBy,
	findById,
	update,
	remove,
	addToTrainingSeries,
	getTrainingSeriesAssignments,
	getTrainingSeriesAssignment,
	updateTrainingSeriesStartDate,
	findTrainingSeriesBy,
	removeFromTrainingSeries,
	addToNotificationsTable,
};

function find() {
	return db("TeamMember");
}

function findBy(filter) {
	return db("TeamMember").where(filter);
}

async function add(member) {
	member.userID = Number(member.userID);
	member.textOn = member.textOn ? 1 : 0;
	member.emailOn = member.emailOn ? 1 : 0;
	const [id] = await db("TeamMember").returning("teamMemberID").insert(member);
	let result = await findById(id);
	return result;
}

async function findById(id) {
	let result = await db("TeamMember").where({ teamMemberID: id });
	return result[0];
}

async function update(id, member) {
	await db("TeamMember").where({ teamMemberID: id }).update(member);

	return await findById(id);
}

function remove(id) {
	return db("TeamMember").where({ teamMemberID: id }).del();
}

//assign team member to a training series
async function addToTrainingSeries(assignment) {
	const [id] = await db("RelationalTable").insert(assignment);

	return db("RelationalTable").where({ relationalTableID: id }).first();
}

//get a team member's training series assignments
function getTrainingSeriesAssignments(teamMemberId) {
	return db("TeamMember")
		.join("RelationalTable", "TeamMember.teamMemberID", "RelationalTable.teamMember_ID")
		.join("TrainingSeries", "TrainingSeries.trainingSeriesID", "RelationalTable.trainingSeries_ID")
		.select(
			"RelationalTable.trainingSeries_ID",
			"TrainingSeries.title",
			"RelationalTable.startDate"
		)
		.where("RelationalTable.teamMember_ID", teamMemberId);
}

// get member information for updating notification send date
function getTrainingSeriesAssignment(teamMemberId, trainingSeriesId) {
	return db("TeamMember")
		.join("RelationalTable", "TeamMember.teamMemberID", "RelationalTable.teamMember_ID")
		.join("TrainingSeries", "TrainingSeries.trainingSeriesID", "RelationalTable.trainingSeries_ID")
		.select(
			"RelationalTable.trainingSeries_ID",
			"TrainingSeries.title",
			"RelationalTable.startDate"
		)
		.where({
			"RelationalTable.teamMember_ID": teamMemberId,
			"RelationalTable.trainingSeries_ID": trainingSeriesId,
		})
		.first();
}

//update the start date ONLY of a team member's training series start date
async function updateTrainingSeriesStartDate(teamMemberId, trainingSeriesId, updatedStartDate) {
	await db("RelationalTable")
		.where({ teamMember_ID: teamMemberId, trainingSeries_ID: trainingSeriesId })
		.update({ startDate: updatedStartDate });

	return findTrainingSeriesBy({
		teamMember_ID: teamMemberId,
		trainingSeries_ID: trainingSeriesId,
	});
}

/*
find training series using a filter

if you want to find a single training series assigned to the user, you should use two keys:
trainingSeries_ID and teamMember_ID.

if you want to find all of the team member's assigned training series, only one key is needed:
teamMember_ID
*/
function findTrainingSeriesBy(filter) {
	return db("RelationalTable").where(filter);
}

async function removeFromTrainingSeries(teamMemberId, trainingSeriesId) {
	const deleted = await db("RelationalTable")
		.where({ teamMember_ID: teamMemberId, trainingSeries_ID: trainingSeriesId })
		.del();

	await db("Notifications")
		.where({
			teamMemberID: teamMemberId,
			trainingSeriesID: trainingSeriesId,
		})
		.del();

	return deleted;
}

function addToNotificationsTable(data) {
	return db("Notifications").insert(data);
}
