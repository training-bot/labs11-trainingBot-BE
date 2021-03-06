// Dependencies
const router = require("express").Router();

const {
  createFakeTeamMembers,
  createFakeUsers,
  createFakeTrainingSeries,
  createFakePosts
} = require("../database/seeds/fakeData");

// Models
const TeamMember = require("../database/Helpers/teamMember-model"),
  Users = require("../database/Helpers/user-model"),
  TrainingSeries = require("../database/Helpers/trainingSeries-model"),
  Posts = require("../database/Helpers/post-model");

// Endpoint to create 10 fake team members
router.post("/team-members", async (req, res) => {
  // Creates 10 fake team members

  console.log("Working");
  const teamMember = createFakeTeamMembers();
  console.log(teamMember);

  try {
    await TeamMember.add(teamMember);
    res.status(201).json({ message: "Team Members added successfully" });
  } catch (error) {
    res.status(500).json({ message: "There was an error with the network" });
  }
});

// Endpoint to create fake user datate
router.post("/users", (req, res) => {
  // Creates 10 fake users
  const newUsers = createFakeUsers();

  Users.add(newUsers)
    .then(users => {
      res.status(201).json({ message: "Users added successfully", users });
    })
    .catch(
      res.status(500).json({ message: "There was an error with the network" })
    );
});

// Add Training Series Seeds
router.post("/training-series", async (req, res) => {
  // console.log(createFakeTrainingSeries())

  const newSeries = createFakeTrainingSeries();

  try {
    await TrainingSeries.addTrainingSeriesSeeds(newSeries);

    res
      .status(201)
      .json({ message: "Training series seeds added successfully" });
  } catch (error) {
    res.status(500).json({ message: "A network error occurred" });
  }
});

// Add Post Seeds
router.post("/posts", async (req, res) => {
  try {
    const newPost = createFakePosts();
    await Posts.addPostSeeds(newPost);
    console.log(newPost);
    return res.status(201).json({ message: "Post seeds added successfully" });
  } catch (error) {
    res.status(500).json({ message: "A network error occurred" });
  }
});

module.exports = router;
