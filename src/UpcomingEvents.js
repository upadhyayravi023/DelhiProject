const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Upcoming Events Schema
const upEventsSchema = new mongoose.Schema(
  {
    subject: String,
    body: String,
    links: [String], // Optional: Include if you want to add links to the event
  },
  { timestamps: true }
);

const UpcomingEvent = mongoose.model("UpcomingEvent", upEventsSchema);

// Create Upcoming Event
router.post("/create", async (req, res) => {
  try {
    const { subject, body, links } = req.body;
    const newEvent = new UpcomingEvent({ subject, body, links });
    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put("/update/:id", async (req, res) => {
  try {
    const { subject, body, links } = req.body;
    const updatedNotice = await Notice.findByIdAndUpdate(req.params.id, { subject, body, links }, { new: true });
    if (!updatedNotice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice updated successfully", notice: updatedNotice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Update Upcoming Event
// router.put("/update/:id", async (req, res) => {
//   try {
//     const { subject, body, links } = req.body;
//     const updatedEvent = await UpcomingEvent.findByIdAndUpdate(
//       req.params.id,
//       { subject, body, links },
//       { new: true }
//     );
//     if (!updatedEvent) return res.status(404).json({ message: "Event not found" });
//     res.json({ message: "Event updated successfully", event: updatedEvent });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Delete Upcoming Event
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedEvent = await UpcomingEvent.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Upcoming Events
router.get("/all", async (req, res) => {
  try {
    const events = await UpcomingEvent.find().sort({ createdAt: -1 });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
