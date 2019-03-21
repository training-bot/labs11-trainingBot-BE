//Sample user-model

const db = require("../dbConfig.js");

module.exports = {
  add,
  find,
  findBy,
  findById
};

function find() {
  return db("User");
}

function findBy(filter) {
  return db("User").where(filter);
}

async function add(user) {
  const [id] = await db("User").insert(user);

  return findById(id);
}

function findById(id) {
  return db("User")
    .where({ id })
    .first();
}