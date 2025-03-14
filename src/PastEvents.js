const express = require('express');
const multer = require('multer');
const cloudinary = require('../database/cloudinary');
const mongoose = require('mongoose');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the Event schema (without Google Drive link)
const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  cloudinaryLinks: { type: [String], default: [] }, // Store up to 8 image URLs
});

const Event = mongoose.model('Event', eventSchema);

router.post('/uploadCloudinary', upload.array('images', 8), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const { eventName } = req.body; // Only event name

    // Find existing event
    let event = await Event.findOne({ eventName });

    // Check if event already has 8 images
    if (event && event.cloudinaryLinks.length >= 8) {
      return res.status(400).json({ error: 'Maximum of 8 images already uploaded for this event' });
    }

    // Upload images to Cloudinary
    let uploadedUrls = [];
    for (const file of req.files) {
      const base64Image = `data:image/png;base64,${file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(base64Image, { folder: 'events' });
      uploadedUrls.push(result.secure_url);
    }

    // If event exists, update it; otherwise, create a new one
    if (event) {
      if (event.cloudinaryLinks.length + uploadedUrls.length > 8) {
        return res.status(400).json({ error: 'Uploading these images would exceed the 8-image limit' });
      }
      event.cloudinaryLinks.push(...uploadedUrls);
    } else {
      event = new Event({
        eventName,
        cloudinaryLinks: uploadedUrls,
      });
    }

    await event.save();

    res.json({
      eventId: event._id,
      eventName: event.eventName,
      uploadedImages: uploadedUrls,
      totalImages: event.cloudinaryLinks.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 GET route to retrieve all events and their images
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({});
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📌 DELETE route to remove an image from Cloudinary and MongoDB
router.delete('/deleteCloudinary', async (req, res) => {
  try {
    const { eventName, imageUrl } = req.body;

    if (!eventName || !imageUrl) {
      return res.status(400).json({ error: 'Event name and image URL are required' });
    }

    const event = await Event.findOne({ eventName });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.cloudinaryLinks.includes(imageUrl)) {
      return res.status(404).json({ error: 'Image not found in this event' });
    }

    // Extract public_id from image URL for Cloudinary deletion
    const publicId = imageUrl.split('/').pop().split('.')[0];

    await cloudinary.uploader.destroy(`events/${publicId}`);

    // Remove image from MongoDB
    event.cloudinaryLinks = event.cloudinaryLinks.filter(url => url !== imageUrl);
    await event.save();

    res.json({ message: 'Image deleted successfully', remainingImages: event.cloudinaryLinks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
