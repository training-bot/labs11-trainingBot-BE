//Dependencies
const router = require("express").Router();

//Models
const TrainingSeries = require('../database/Helpers/trainingSeries-model');

//Routes

// GET all training series (not a production endpoint)
router.get("/", async (req, res) => {
    try {
        const trainingSeries = await TrainingSeries.find();
        res.status(200).json({ trainingSeries });
      } catch(err) {
        res.status(500).json({ message: "A network error occurred" });
      }
})

//GET all posts (not a production endpoint)
router.get("/posts", async (req, res) => {
    try {
        const posts = await TrainingSeries.getAllPosts();
        res.status(200).json({ posts });
    } catch(err) {
       res.status(500).json({ message: "A network error occurred" }); 
    }
})

//GET all posts in a training series by training series ID
router.get("/:id/posts", async (req, res) => {
    try {
        const { id } = req.params;

        //get training series by id
        const trainingSeries = await TrainingSeries.findById(id);

        //get all posts of training series
        // posts needs to be returned as an array, currently being returned as an object
        const posts = await TrainingSeries.getTrainingSeriesPosts(id);

        res.status(200).json({ trainingSeries, posts })
    } catch(err) {
        res.status(500).json({ message: "A network error occurred" })
    }
})
module.exports = router;