const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    subject: String,
    body: String,
    links: [String],
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

router.post("/create", async (req, res) => {
  try {
    const { subject, body, links } = req.body;
    const newNotice = new Notice({ subject, body, links });
    await newNotice.save();
    res.status(201).json({ message: "Notice created successfully", notice: newNotice });
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

router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedNotice = await Notice.findByIdAndDelete(req.params.id);
    if (!deletedNotice) return res.status(404).json({ message: "Notice not found" });
    res.json({ message: "Notice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/all", async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
