const express = require('express');
const router = express.Router();
const Log = require('../models/Log');

// GET all logs
router.get('/', async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET logs by greenhouse ID
router.get('/greenhouse/:greenhouseId', async (req, res) => {
  try {
    const logs = await Log.find({ greenhouseId: req.params.greenhouseId });
    res.json(logs);
  } catch (err) {
      res.status(500).json({ message: err.message });
    }
});

// GET one log
router.get('/:id', getLog, (req, res) => {
  res.json(res.log);
});

// POST a new log
router.post('/', async (req, res) => {
    const newLog = new Log({
        greenhouseId: req.body.greenhouseId,
        type: req.body.type, // ['error', 'info']
        message: req.body.message,
      timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date()
  });
    try {
      const savedLog = await newLog.save();
        res.status(201).json(savedLog);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH an existing log
router.patch('/:id', getLog, async (req, res) => {
  if (req.body.greenhouseId != null) {
    res.log.greenhouseId = req.body.greenhouseId;
  }
  if (req.body.type != null) {
    res.log.type = req.body.type;
  }
  if (req.body.message != null) {
    res.log.message = req.body.message;
  }
  if (req.body.timestamp != null) {
     res.log.timestamp = new Date(req.body.timestamp);
  }
  try {
    const updatedLog = await res.log.save();
      res.json(updatedLog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a log
router.delete('/:id', getLog, async (req, res) => {
  try {
    await res.log.deleteOne();
    res.json({ message: 'Deleted Log' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getLog(req, res, next) {
  let log;
  try {
      log = await Log.findById(req.params.id);
      if (!log) {
        return res.status(404).json({ message: 'Cannot find log' });
      }
    } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.log = log;
  next();
}

module.exports = router;