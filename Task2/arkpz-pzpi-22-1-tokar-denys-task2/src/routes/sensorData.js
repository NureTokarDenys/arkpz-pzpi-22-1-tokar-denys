const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');

// GET all sensor data
router.get('/', async (req, res) => {
    try {
        const sensorData = await SensorData.find();
        res.json(sensorData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET sensor data for a specific sensor
router.get('/sensor/:sensorId', async (req, res) => {
    try {
        const sensorData = await SensorData.find({ sensorId: req.params.sensorId });
        res.json(sensorData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one sensor data entry
router.get('/:id', getSensorData, (req, res) => {
    res.json(res.sensorData);
});


// POST new sensor data
router.post('/', async (req, res) => {
    const newSensorData = new SensorData({
        sensorId: req.body.sensorId,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        value: req.body.value
    });
    try {
        const savedSensorData = await newSensorData.save();
        res.status(201).json(savedSensorData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH an existing sensor data entry
router.patch('/:id', getSensorData, async (req, res) => {
    if (req.body.sensorId != null) {
        res.sensorData.sensorId = req.body.sensorId;
    }
    if (req.body.timestamp != null) {
        res.sensorData.timestamp = new Date(req.body.timestamp);
    }
    if(req.body.value != null){
        res.sensorData.value = req.body.value;
    }
    try {
      const updatedSensorData = await res.sensorData.save();
        res.json(updatedSensorData);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// DELETE a sensor data entry
router.delete('/:id', getSensorData, async (req, res) => {
    try {
        await res.sensorData.deleteOne();
        res.json({ message: 'Deleted Sensor Data' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getSensorData(req, res, next) {
    let sensorData;
    try {
        sensorData = await SensorData.findById(req.params.id);
        if (!sensorData) {
            return res.status(404).json({ message: 'Cannot find sensor data entry' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.sensorData = sensorData;
    next();
}

module.exports = router;