const db = require("../dbConfig.js");

module.exports = {
	add,
	find,
	findBy,
	findById,
	addPostSeeds,
	update,
	remove,
};

function find() {
	return db("Post");
}

function findBy(filter) {
	return db("Post").where(filter);
}

async function add(post) {
	const [id] = await db("Post").returning("postID").insert(post);
	let result = await findById(id);
	return result;
}

async function findById(id) {
	let result = await db("Post").where({ postID: id });
	return result[0];
}

function addPostSeeds(posts) {
	return db("Post").insert(posts);
}

async function update(id, post) {
	await db("Post").where({ postID: id }).update(post);

	return await findById(id);
}

function remove(id) {
	return db("Post").where({ postID: id }).del();
}
