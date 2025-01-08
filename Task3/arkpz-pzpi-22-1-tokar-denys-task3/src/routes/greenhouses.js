const express = require('express');
const router = express.Router();
const Greenhouse = require('../models/AutoGreenhouse');

// GET all greenhouses
router.get('/', async (req, res) => {
  try {
    const greenhouses = await Greenhouse.find().populate('ownerId', 'username');
    res.json(greenhouses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all greenhouses of a specific user
router.get('/user/:userId', async (req, res) => {
  try {
      const greenhouses = await Greenhouse.find({ ownerId: req.params.userId }).populate('ownerId', 'username');
      res.json(greenhouses);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET one greenhouse
router.get('/:id', getGreenhouse, (req, res) => {
  res.json(res.greenhouse);
});

// POST a new greenhouse
router.post('/', async (req, res) => {
    const greenhouse = new Greenhouse({
        name: req.body.name,
        location: req.body.location,
        ownerId: req.body.ownerId
    });

  try {
    const newGreenhouse = await greenhouse.save();
    res.status(201).json(newGreenhouse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH an existing greenhouse
router.patch('/:id', getGreenhouse, async (req, res) => {
  if (req.body.name != null) {
    res.greenhouse.name = req.body.name;
  }
  if (req.body.location != null) {
    res.greenhouse.location = req.body.location;
  }
  if (req.body.ownerId != null) {
    res.greenhouse.ownerId = req.body.ownerId;
  }
  try {
    const updatedGreenhouse = await res.greenhouse.save();
    res.json(updatedGreenhouse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a greenhouse
router.delete('/:id', getGreenhouse, async (req, res) => {
  try {
    await res.greenhouse.deleteOne();
    res.json({ message: 'Deleted Greenhouse' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


async function getGreenhouse(req, res, next) {
  let greenhouse;
  try {
    greenhouse = await Greenhouse.findById(req.params.id).populate('ownerId', 'username');
    if (greenhouse == null) {
      return res.status(404).json({ message: 'Cannot find greenhouse' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.greenhouse = greenhouse;
  next();
}

module.exports = router;