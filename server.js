//Dependencies
const express = require("express"),
	helmet = require("helmet"),
	cors = require("cors"),
	morgan = require("morgan");

//Server to point to
const server = express();

//Library Middleware
server.use(helmet(), express.json(), cors(), morgan("dev"));

// twilio notification system import
const notificationSystem = require("./notificationSystem/startSystem");

const { authenticate } = require("./auth/authenticate");

//Routes
const usersRouter = require("./routes/userRouter");
const teamsRouter = require("./routes/teamMemberRouter");
const seedRouter = require("./routes/seedRouter");
const authRouter = require("./routes/authRoutes");
const trainingsRouter = require("./routes/trainingSeriesRouter");
const postsRouter = require("./routes/postRouter");
const stripeRouter = require("./routes/stripeRouter");

//API Endpoints
server.use("/api/seed", seedRouter);
server.use("/api/auth", authRouter);
server.use("/api/users", authenticate, usersRouter);
server.use("/api/team-members", authenticate, teamsRouter);
server.use("/api/training-series", authenticate, trainingsRouter);
server.use("/api/posts", authenticate, postsRouter);
server.use("/api/stripe", stripeRouter);

//Default Endpoints
server.get("/", (req, res) => {
	res.send("It works!");
});

// turn on notification interval system
// notificationSystem.clearOldNotifications();
notificationSystem.resetCountOnFirstOfMonth();
notificationSystem.start();

module.exports = server;
