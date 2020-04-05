const db = require("../dbConfig.js");

module.exports = {
	add,
	find,
	findBy,
	findById,
	addTrainingSeriesSeeds,
	getAllPosts,
	getTrainingSeriesPosts,
	update,
	remove,
	getMembersAssigned,
};

function find() {
	return db("TrainingSeries");
}

function findBy(filter) {
	return db("TrainingSeries").where(filter);
}

async function add(trainingSeries) {
	const [id] = await db("TrainingSeries").returning("trainingSeriesID").insert(trainingSeries);
	let result = await findById(id);
	return result;
}

async function findById(id) {
	let result = await db("TrainingSeries").where({ trainingSeriesID: id });
	return result[0];
}

function addTrainingSeriesSeeds(seeds) {
	return db("TrainingSeries").insert(seeds);
}

// not a production function
function getAllPosts() {
	return db("Post");
}

function getTrainingSeriesPosts(id) {
	return db("Post").where({ trainingSeriesID: id });
}

async function update(id, series) {
	await db("TrainingSeries").where({ trainingSeriesID: id }).update(series);

	return await findById(id);
}

function remove(id) {
	return db("TrainingSeries").where({ trainingSeriesID: id }).del();
}

function getMembersAssigned(id) {
	return db("RelationalTable as r")
		.join("TeamMember as t", "t.teamMemberID", "r.teamMember_ID")
		.select("r.teamMember_ID", "r.startDate", "t.firstName", "t.lastName")
		.where("r.trainingSeries_ID", id);
}
