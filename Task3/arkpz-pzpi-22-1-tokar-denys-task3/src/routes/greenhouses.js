const express = require('express');
const router = express.Router();
const Greenhouse = require('../models/Autogreenhouse');
const Rule = require('../models/Rule');
const Log = require('../models/Log');

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
    ownerId: req.body.ownerId,
  });

  try {
    const newGreenhouse = await greenhouse.save();
    await createDefaultRules(newGreenhouse._id);
    await logEvent(newGreenhouse._id, 'info', `Greenhouse created: ${newGreenhouse.name}`);
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

async function createDefaultRules(greenhouseId) {
  const defaultActions = [
    'start_fertilizing',
    'stop_fertilizing',
    'turn_on_light',
    'turn_off_light',
    'start_cooling',
    'stop_cooling',
    'start_heating',
    'stop_heating',
  ];

  const rules = defaultActions.map(action => {
    let ruleData = {
      greenhouseId: greenhouseId,
      action: action,
      status: 'active',
    };

    switch (action) {
      case 'start_fertilizing':
        ruleData.condition = 'time_based';
        ruleData.schedule = { time: '06:00' };
        break;
      case 'stop_fertilizing':
        ruleData.condition = 'time_based';
        ruleData.schedule = { time: '12:00' };
        break;
      case 'turn_on_light':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { light: 300 };
        break;
      case 'turn_off_light':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { light: 600 };
        break;
      case 'start_cooling':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { temperature: 30 };
        break;
      case 'stop_cooling':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { temperature: 25 };
        break;
      case 'start_heating':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { temperature: 20 };
        break;
      case 'stop_heating':
        ruleData.condition = 'sensor_based';
        ruleData.threshold = { temperature: 23 };
        break;
      default:
        break;
    }
    return new Rule(ruleData);
  });

  try {
    await Promise.all(rules.map(rule => rule.save()));
  } catch (error) {
    console.error(`Failed to create default rules for greenhouse: ${greenhouseId}`, error);
  }
}

async function logEvent(greenhouseId, type, message){
    const newLog = new Log({
        greenhouseId: greenhouseId,
        type: type,
        message: message,
        timestamp: new Date(),
    });
    try{
        await newLog.save()
    }catch(e){
        console.error(`Failed to log event: ${message}, error: ${e.message}`)
    }
}


module.exports = router;