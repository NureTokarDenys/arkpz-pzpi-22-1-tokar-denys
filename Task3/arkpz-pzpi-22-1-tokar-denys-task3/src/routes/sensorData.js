const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Sensor = require('../models/Sensor');
const Rule = require('../models/Rule');
const Log = require('../models/Log');

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

// POST new sensor data from ESP32
router.post('/', async (req, res) => {
  const { sensorId, value } = req.body;
  try {
    if (!sensorId || value === undefined) {
      return res.status(400).json({ message: 'Missing sensorId or value in request body' });
    }
    const sensor = await Sensor.findById(sensorId).populate('greenhouseId');
    if (!sensor) {
      return res.status(400).json({ message: 'Invalid sensorId' });
    }

    const newSensorData = new SensorData({
      sensorId: sensorId,
      value: value,
      timestamp: new Date(),
    });
    const savedSensorData = await newSensorData.save();

    await logEvent(sensor.greenhouseId, 'info', `Data received from sensor ${sensorId}: ${value}`);
    
    const commands = [];
    const sensorBasedCommand = await analyzeAndGenerateCommands(sensorId, savedSensorData);
     if(sensorBasedCommand){
        commands.push(sensorBasedCommand)
      }
    const timeBasedCommands = await checkTimeBasedRules(sensor.greenhouseId);
     if(timeBasedCommands && timeBasedCommands.length > 0){
          commands.push(...timeBasedCommands)
       }

    const response = { message: 'Sensor data saved' };
    if (commands.length > 0) {
      response.commands = commands;
    }
    return res.status(201).json(response);
  } catch (err) {
    console.error('Error while processing sensor data:', err);
    res.status(500).json({ message: 'Failed to save sensor data' });
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
  if (req.body.value != null) {
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

async function analyzeAndGenerateCommands(sensorId, sensorData) {
  const sensor = await getSensor(sensorId);
  if (!sensor) return null;
  
  const rules = await getRules(sensor.greenhouseId._id);
  if (!rules?.length) return null;
  
  const matchingActions = [];
  
  for (const rule of rules) {
      const result = await processRule(rule, sensor, sensorData);
      if (result) matchingActions.push(result);
  }
  
  return matchingActions.length > 0 ? matchingActions : null;
}

async function getSensor(sensorId) {
  const sensor = await Sensor.findById(sensorId).populate('greenhouseId');
  if (!sensor) {
      console.error('Invalid sensorId. No analysis or command generation');
      return null;
  }
  return sensor;
}

async function getRules(greenhouseId) {
  const rules = await Rule.find({ greenhouseId });
  if (!rules?.length) {
      console.error('No rules. No analysis or command generation');
      return null;
  }
  return rules;
}

function processRule(rule, sensor, sensorData) {
  if (rule.condition === 'time_based') return null;
  
  if (!isValidThreshold(rule)) return null;
  
  const conditionMet = checkRuleCondition(rule, sensor, sensorData);
  
  return conditionMet ? rule.action : null;
}

function isValidThreshold(rule) {
  if (!rule.threshold || typeof rule.threshold !== 'object') {
      console.log(`Threshold must be an object. Skip rule: ${rule._id}`);
      return false;
  }
  return true;
}

function checkRuleCondition(rule, sensor, sensorData) {
  const actionThresholds = {
      'start_cooling': (value, threshold) => value > threshold,
      'stop_cooling': (value, threshold) => value < threshold,
      'start_heating': (value, threshold) => value < threshold,
      'stop_heating': (value, threshold) => value > threshold,
      'turn_on_light': (value, threshold) => value < threshold,
      'turn_off_light': (value, threshold) => value > threshold,
      'start_fertilizing': (value, threshold) => value > threshold,
      'stop_fertilizing': (value, threshold) => value < threshold
  };

  for (const sensorType in rule.threshold) {
      if (sensor.type !== sensorType) continue;
      
      const thresholdCheck = actionThresholds[rule.action];
      if (!thresholdCheck) continue;
      
      return thresholdCheck(sensorData.value, rule.threshold[sensorType]);
  }
  return false;
}

async function checkTimeBasedRules(greenhouseId) {
    try {
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
       const rules = await Rule.find({
         condition: 'time_based',
         greenhouseId: greenhouseId,
         status: 'active',
       }).populate('greenhouseId');
        const commands = [];
        for (const rule of rules) {
          if (!rule.schedule || !rule.schedule.time) {
             console.error(`checkTimeBasedRules: Schedule time is not configured for time based rule. Skip rule: ${rule._id}`);
             continue;
            }
           const [ruleHour, ruleMinute] = rule.schedule.time.split(':').map(Number);
            if (currentHour === ruleHour && currentMinute === ruleMinute) {
              commands.push(rule.action);
            }
      }
      return (commands.length > 0) ?  commands : null;
    } catch (err) {
        console.error("Error while processing time based rules", err);
        return null;
    }
}

async function logEvent(greenhouseId, type, message) {
  const newLog = new Log({
    greenhouseId: greenhouseId,
    type: type,
    message: message,
    timestamp: new Date(),
  });
  try {
    await newLog.save();
  } catch (e) {
    console.error(`Failed to log event: ${message}, error: ${e.message}`);
  }
}
module.exports = router;