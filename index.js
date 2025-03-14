require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./database/connect");
const noticeRoutes = require("./src/Notice"); // Ensure correct import
const eventRoutes = require('./src/UpcomingEvents')
const cloudinary = require('./src/PastEvents')
const professor = require('./src/Professor')
const magzine = require('./src/magzine')
const pastEvents = require('./src/PastEvents')
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
    app.use("/upcomingEvents",eventRoutes);
    app.use("/cloudinary",cloudinary);
    app.use("/faculties",professor);
    app.use("/pastEvents",pastEvents);
    app.use("/magzine",magzine);
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
