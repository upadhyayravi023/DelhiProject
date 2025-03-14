const mongoose = require('mongoose');
const cloudinary = require('../database/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Define the Position schema and model
const positionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: {
    type: String,
    required: true,
    enum: ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Union Advisor'],
  },
  imageUrl: { type: String, required: true },
});

const Position = mongoose.model('Position', positionSchema);

// Add a new position holder
exports.addPositionHolder = async (req, res) => {
  const { name, position } = req.body;

  try {
    // Check if the position already exists
    const existingPositions = await Position.find({ position });

    // Validate the number of positions
    if (
      (position === 'President' && existingPositions.length >= 1) ||
      (position === 'Vice President' && existingPositions.length >= 1) ||
      (position === 'Secretary' && existingPositions.length >= 1) ||
      (position === 'Joint Secretary' && existingPositions.length >= 1) ||
      (position === 'Treasurer' && existingPositions.length >= 1) ||
      (position === 'Union Advisor' && existingPositions.length >= 2)
    ) {
      return res.status(400).json({ message: `Only a limited number of ${position} positions are allowed.` });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'position-holders',
    });

    // Create a new position holder
    const newPosition = new Position({
      name,
      position,
      imageUrl: result.secure_url,
    });

    await newPosition.save();
    res.status(201).json(newPosition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all position holders
exports.getAllPositionHolders = async (req, res) => {
  try {
    const positions = await Position.find();
    res.status(200).json(positions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a position holder by ID
exports.deletePositionHolder = async (req, res) => {
  try {
    const { id } = req.params;
    const position = await Position.findByIdAndDelete(id);

    if (!position) {
      return res.status(404).json({ message: 'Position holder not found' });
    }

    // Delete the image from Cloudinary
    const publicId = position.imageUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`position-holders/${publicId}`);

    res.status(200).json({ message: 'Position holder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};