const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// Define the Magazine schema
const magazineSchema = new mongoose.Schema({
  magazineName: { type: String,required: true},
  magazineLink: { type: String, required: true },
});

// Create the Magazine model
const Magazine = mongoose.model('Magazine', magazineSchema);

// POST route to upload a magazine link
router.post('/uploadMagazine', async (req, res) => {
  try {
    const { magazineName, magazineLink } = req.body;
    if ( !magazineLink) {
      return res.status(400).json({ error: 'Magazine link are required' });
    }

    // Check if the magazine already exists
    let magazine = await Magazine.findOne({ magazineName, magazineLink });
    if (magazine) {
      return res.status(400).json({ error: 'Magazine already exists' });
    }

    // Create a new magazine entry
    magazine = new Magazine({
      magazineName,
      magazineLink,
    });

    // Save to database
    await magazine.save();
    res.json({ message: 'Magazine uploaded successfully', magazine });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET route to retrieve all magazine links
router.get('/magazines', async (req, res) => {
  try {
    const magazines = await Magazine.find({});
    res.json(magazines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE route to remove a magazine entry
router.delete('/deleteMagazine', async (req, res) => {
  try {
    const { magazineName } = req.body;
    if (!magazineName) return res.status(400).json({ error: 'Magazine name is required' });

    // Find and delete the magazine by name
    const result = await Magazine.findOneAndDelete({ magazineName });

    if (!result) return res.status(404).json({ error: 'Magazine not found' });

    res.json({ message: 'Magazine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
