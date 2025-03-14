const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Upcoming Events Schema
const upEventsSchema = new mongoose.Schema(
  {
    subject: String,
    body: String,
  },
  { timestamps: true }
);

const UpcomingEvents = mongoose.model("UpcomingEvents", upEventsSchema);

// Create Upcoming Event
router.post("/create", async (req, res) => {
  try {
    const { subject, body } = req.body;
    const newEvent = new UpcomingEvents({ subject, body });
    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Upcoming Event
router.put("/update/:id", async (req, res) => {
  try {
    const { subject, body } = req.body;
    const updatedEvent = await UpcomingEvents.findByIdAndUpdate(req.params.id, { subject, body }, { new: true });
    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event updated successfully", event: updatedEvent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Upcoming Event
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedEvent = await UpcomingEvents.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Last 10 Upcoming Events
router.get("/all", async (req, res) => {
  try {
    const events = await UpcomingEvents.find().sort({ createdAt: -1 });
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
