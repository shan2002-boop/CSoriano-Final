const express = require('express');
const router = express.Router();
const Preproject = require('../models/PreprojectModel');

// Get all preprojects
router.get('/', async (req, res) => {
  try {
    const preprojects = await Preproject.find();
    res.json(preprojects);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch preprojects" });
  }
});

// Get a single preproject by ID
router.get('/:id', async (req, res) => {
    try {
      const preproject = await Preproject.findById(req.params.id);
      if (!preproject) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(preproject);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch project details" });
    }
  });

module.exports = router;