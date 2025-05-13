const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cloudinary = require('../database/cloudinary'); // Import Cloudinary configuration
const multer = require('multer');

// Use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Define the Professor schema
const professorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  imageUrl: { type: String, required: true },
  specialization: { type: String, required: true },
  about: { type: String, required: true },
  
  publicId: { type: String, required: true }, // Store Cloudinary public_id
});

const Professor = mongoose.model('Professor', professorSchema);

// Function to upload image to Cloudinary as Base64
const uploadToCloudinary = async (buffer, folder) => {
  const base64String = `data:image/png;base64,${buffer.toString('base64')}`;
  return cloudinary.uploader.upload(base64String, { folder });
};

// Create a new professor
router.post('/professors', upload.single('image'), async (req, res) => {
  try {
    const { name, department, specialization,about } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'professors');

    const professor = new Professor({
      name,
      department,
      about,
      imageUrl: result.secure_url, // Cloudinary image URL
      publicId: result.public_id, // Save public_id for deletion
      specialization,
    });

    await professor.save();
    res.status(201).json(professor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all professors
router.get('/professors', async (req, res) => {
  try {
    const professors = await Professor.find();
    res.status(200).json(professors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single professor by ID
router.get('/professors/:id', async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }
    res.status(200).json(professor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a professor by ID
router.put('/professors/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, department, specialization ,about} = req.body;
    const professor = await Professor.findById(req.params.id);

    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }

    professor.name = name || professor.name;
    professor.department = department || professor.department;
    professor.specialization = specialization || professor.specialization;
     professor.about = about || professor.about;

    if (req.file) {
      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(professor.publicId);

      // Upload new image to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, 'professors');
      professor.imageUrl = result.secure_url;
      professor.publicId = result.public_id;
    }

    await professor.save();
    res.status(200).json(professor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a professor by ID
router.delete('/professors/:id', async (req, res) => {
  try {
    const professor = await Professor.findByIdAndDelete(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: 'Professor not found' });
    }

    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(professor.publicId);

    res.status(200).json({ message: 'Professor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
