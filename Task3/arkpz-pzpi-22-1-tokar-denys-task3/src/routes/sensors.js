const express = require('express');
const router = express.Router();
const Sensor = require('../models/Sensor');

// GET all sensors
router.get('/', async (req, res) => {
  try {
    const sensors = await Sensor.find().populate('greenhouseId', 'name');
    res.json(sensors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all sensors of a specific greenhouse
router.get('/greenhouse/:greenhouseId', async (req, res) => {
  try {
      const sensors = await Sensor.find({ greenhouseId: req.params.greenhouseId }).populate('greenhouseId', 'name');
      res.json(sensors);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET one sensor
router.get('/:id', getSensor, (req, res) => {
  res.json(res.sensor);
});

// POST a new sensor
router.post('/', async (req, res) => {
    const sensor = new Sensor({
        type: req.body.type, // ['temperature', 'humidity', 'light']
        greenhouseId: req.body.greenhouseId,
        model: req.body.model,
        status: req.body.status, // ['active', 'inactive']
        unit: req.body.unit,
        lastValue: req.body.lastValue,
        lastUpdated: req.body.lastUpdated
    });
  try {
    const newSensor = await sensor.save();
    res.status(201).json(newSensor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH an existing sensor
router.patch('/:id', getSensor, async (req, res) => {
    if (req.body.type != null) {
        res.sensor.type = req.body.type;
    }
    if (req.body.greenhouseId != null) {
        res.sensor.greenhouseId = req.body.greenhouseId;
    }
    if (req.body.model != null) {
        res.sensor.model = req.body.model;
    }
    if (req.body.status != null) {
        res.sensor.status = req.body.status;
    }
    if (req.body.unit != null) {
        res.sensor.unit = req.body.unit;
    }
    if (req.body.lastValue != null) {
        res.sensor.lastValue = req.body.lastValue;
    }
    if (req.body.lastUpdated != null) {
        res.sensor.lastUpdated = req.body.lastUpdated;
    }
  try {
    const updatedSensor = await res.sensor.save();
    res.json(updatedSensor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a sensor
router.delete('/:id', getSensor, async (req, res) => {
  try {
    await res.sensor.deleteOne();
    res.json({ message: 'Deleted Sensor' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
async function getSensor(req, res, next) {
  let sensor;
  try {
      sensor = await Sensor.findById(req.params.id).populate('greenhouseId', 'name');
    if (sensor == null) {
      return res.status(404).json({ message: 'Cannot find sensor' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.sensor = sensor;
  next();
}


module.exports = router;