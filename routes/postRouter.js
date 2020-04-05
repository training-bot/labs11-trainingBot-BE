// Dependencies
const router = require("express").Router();
const moment = require("moment");

// Models
const Posts = require("../database/Helpers/post-model");
const Notifications = require("../database/Helpers/notifications-model");
const TeamMember = require("../database/Helpers/teamMember-model");

// Routes
// POST a new post
router.post("/", async (req, res) => {
	try {
		const { postName, postDetails, daysFromStart, trainingSeriesID } = req.body;

		if (!postName || !postDetails || !daysFromStart || !trainingSeriesID) {
			res.status(400).json({ error: "Client must provide all fields." });
		} else {
			// add new post to database
			const newPost = await Posts.add(req.body);
			console.log("hit", newPost);

			// see if the training series the new post belongs to exists in Notifications table
			const rows = await Notifications.getTrainingSeriesOfNewPost(trainingSeriesID);
			console.log("New Post: ", newPost);
			console.log("Rows: ", rows);
			// if it does, for each assignment per team member id, assemble a new object to be inserted to the notifications table with the new post information
			// generate new object to update the notification table based on updated conditional
			if (rows.length > 0) {
				const entriesToInsert = rows.map((row) => {
					if (row.emailOn && !row.textOn) {
						return {
							postID: newPost.postID,
							postName: newPost.postName,
							postDetails: newPost.postDetails,
							link: newPost.link,
							daysFromStart: newPost.daysFromStart,
							sendDate: moment(row.startDate).add(newPost.daysFromStart, "days").format(),
							firstName: row.firstName,
							lastName: row.lastName,
							teamMemberID: row.teamMemberID,
							jobDescription: row.jobDescription,
							phoneNumber: "",
							email: row.email,
							emailOn: row.emailOn,
							textOn: row.textOn,
							trainingSeriesID: newPost.trainingSeriesID,
							userID: row.userID,
						};
					} else if (row.textOn && !row.emailOn) {
						return {
							postID: newPost.postID,
							postName: newPost.postName,
							postDetails: newPost.postDetails,
							link: newPost.link,
							daysFromStart: newPost.daysFromStart,
							sendDate: moment(row.startDate).add(newPost.daysFromStart, "days").format(),
							firstName: row.firstName,
							lastName: row.lastName,
							teamMemberID: row.teamMemberID,
							jobDescription: row.jobDescription,
							phoneNumber: row.phoneNumber,
							email: "",
							emailOn: row.emailOn,
							textOn: row.textOn,
							trainingSeriesID: newPost.trainingSeriesID,
							userID: row.userID,
						};
					} else {
						return {
							postID: newPost.postID,
							postName: newPost.postName,
							postDetails: newPost.postDetails,
							link: newPost.link,
							daysFromStart: newPost.daysFromStart,
							sendDate: moment(row.startDate).add(newPost.daysFromStart, "days").format(),
							firstName: row.firstName,
							lastName: row.lastName,
							teamMemberID: row.teamMemberID,
							jobDescription: row.jobDescription,
							phoneNumber: row.phoneNumber,
							email: row.email,
							emailOn: row.emailOn,
							textOn: row.textOn,
							trainingSeriesID: newPost.trainingSeriesID,
							userID: row.userID,
						};
					}
				});

				// for each new object, insert it into the notifications table
				entriesToInsert.forEach(async (entry) => await TeamMember.addToNotificationsTable(entry));
			}

			res.status(201).json({ newPost });
		}
	} catch (err) {
		res.status(500).json(err);
	}
});

// PUT post information
router.put("/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const incomingPostUpdate = req.body;
		const updatedPost = await Posts.update(id, incomingPostUpdate);

		// get notification to update by post id
		const notificationsToUpdate = await Notifications.getNotificationByPostId(id);

		// callback function to calculate new send date for notifications
		const dateRecalculation = async (notification) => {
			// pull in start date from relational table based on team member id and training series id
			const member = await TeamMember.getTrainingSeriesAssignment(
				notification.teamMemberID,
				notification.trainingSeriesID
			);

			const newSendDate = await moment(member.startDate)
				.add(updatedPost.daysFromStart, "days")
				.format("YYYY-MM-D");

			// create updated notification, including new send date if daysFromStart changed
			const updatedNotification = {
				...incomingPostUpdate,
				sendDate: newSendDate,
			};

			// update notifications
			await Notifications.updateNotificationContent(
				notification.notificationID,
				updatedNotification
			);
		};

		// async await for each to PUT notifications with new send date
		await Notifications.asyncForEach(notificationsToUpdate, dateRecalculation);

		res.status(200).json({ updatedPost });
	} catch (err) {
		res.status(500).json(err);
	}
});

// GET post by id
router.get("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const post = await Posts.findById(id);
		res.status(200).json({ post });
	} catch (err) {
		res.status(500).json({ message: "A network error occurred" });
	}
});

// DELETE post by id
router.delete("/:id", async (req, res) => {
	const { id } = req.params;

	try {
		const deleted = await Posts.remove(id);
		if (deleted > 0) {
			res.status(200).json({ message: "The resource has been deleted." });
		} else {
			res.status(404).json({ error: "The resource could not be found." });
		}
	} catch (err) {
		res.status(500).json({ message: "A network error occurred" });
	}
});

// GET all posts for notification system - for server use only
router.get("/notification-system", async (req, res) => {
	try {
		const posts = await Posts.find();
		res.status(200).json({ posts });
	} catch (err) {
		res.status(500).json({ message: "A network error occurred" });
	}
});

module.exports = router;
