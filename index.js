require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connect");
const noticeRoutes = require("./src/Notice");
const eventRoutes = require("./src/UpcomingEvents");
const cloudinaryRoutes = require("./src/PastEvents");
const professorRoutes = require("./src/Professor");
const magazineRoutes = require("./src/magzine");
const pastEventsRoutes = require("./src/PastEvents");
const authRoutes = require("./src/authRoutes"); // Import the authentication routes

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("Database connected successfully");

    // Middleware
    app.use(express.json());
    app.use(cors());

    // Routes
    app.use("/notice", noticeRoutes);
    app.use("/upcomingEvents", eventRoutes);
    app.use("/cloudinary", cloudinaryRoutes);
    app.use("/faculties", professorRoutes);
    app.use("/pastEvents", pastEventsRoutes);
    app.use("/magazine", magazineRoutes);
    app.use("/auth", authRoutes); // Add the authentication routes

    // Error Handling Middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        message: "An internal server error occurred",
        error: err.message,
      });
    });

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });
