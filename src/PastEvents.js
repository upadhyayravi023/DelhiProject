const express = require('express');
const multer = require('multer');
const cloudinary = require('../database/cloudinary');
const mongoose = require('mongoose');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the Event schema with Google Drive link
const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  cloudinaryLinks: { type: [String], default: [] }, // Store up to 8 image URLs
  googleDriveLink: { type: String }, // Store the Google Drive link
});

const Event = mongoose.model('Event', eventSchema);

// POST route to upload images to Cloudinary and add Google Drive link
router.post('/uploadCloudinary', upload.array('images', 8), async (req, res) => {
  try {
    const { eventName, googleDriveLink } = req.body;

    // Validate input
    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    // Find existing event
    let event = await Event.findOne({ eventName });

    // Check if event already has 8 images
    if (event && event.cloudinaryLinks.length >= 8) {
      return res.status(400).json({ error: 'Maximum of 8 images already uploaded for this event' });
    }

    // Upload images to Cloudinary
    let uploadedUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const base64Image = `data:image/png;base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64Image, { folder: 'events' });
        uploadedUrls.push(result.secure_url);
      }
    }

    // If event exists, update it; otherwise, create a new one
    if (event) {
      if (event.cloudinaryLinks.length + uploadedUrls.length > 8) {
        return res.status(400).json({ error: 'Uploading these images would exceed the 8-image limit' });
      }
      event.cloudinaryLinks.push(...uploadedUrls);
      if (googleDriveLink) {
        event.googleDriveLink = googleDriveLink;
      }
    } else {
      event = new Event({
        eventName,
        cloudinaryLinks: uploadedUrls,
        googleDriveLink,
      });
    }

    await event.save();

    res.json({
      eventId: event._id,
      eventName: event.eventName,
      uploadedImages: uploadedUrls,
      totalImages: event.cloudinaryLinks.length,
      googleDriveLink: event.googleDriveLink,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route to retrieve all events and their images
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE route to remove an event and its associated images
router.delete('/deleteEvent/:id', async (req, res) => {
  try {
    const eventId = req.params.id;

    // Find the event by ID
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete each image from Cloudinary
    for (const imageUrl of event.cloudinaryLinks) {
      const publicId = imageUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`events/${publicId}`);
    }

    // Delete the event from the database
    await Event.findByIdAndDelete(eventId);

    res.json({ message: 'Event and associated images deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
