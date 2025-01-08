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

    const command = await analyzeAndGenerateCommands(sensorId, savedSensorData);
    const timeBasedCommand = await checkTimeBasedRules(sensor.greenhouseId)
    const response = { message: 'Sensor data saved'}
    if (command) {
       response.command = command;
    }else if(timeBasedCommand){
        response.command = timeBasedCommand;
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
  const sensor = await Sensor.findById(sensorId).populate('greenhouseId');
    if (!sensor) {
      console.error('Invalid sensorId. No analysis or command generation');
        return null;
    }
    const greenhouseId = sensor.greenhouseId._id;
  const rules = await Rule.find({ greenhouseId });
  if (!rules || rules.length === 0) {
       console.error('No rules. No analysis or command generation');
        return null;
    }
    for (const rule of rules) {
        let conditionMet = false;
        if (rule.condition === 'sensor_based') {
           if (!rule.threshold || typeof rule.threshold !== 'object') {
              console.error(`Threshold must be an object. Skip rule: ${rule._id}`);
              continue;
             }
            for (const sensorType in rule.threshold) {
                  if (sensor.type === sensorType) {
                      if (rule.threshold[sensorType] && sensorData.value > rule.threshold[sensorType]) {
                         conditionMet = true;
                      }
                  }
           }
        } else if (rule.condition === 'time_based') {
          continue;
        }
        return conditionMet ? rule.action : null;
    }
    return null
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
      for (const rule of rules) {
         if (!rule.schedule || !rule.schedule.time) {
           continue;
         }
        const [ruleHour, ruleMinute] = rule.schedule.time.split(':').map(Number);
        if (currentHour === ruleHour && currentMinute === ruleMinute) {
            return rule.action
         }
      }
      return null
   } catch (err) {
     console.error('Error while processing time based rules', err);
     return null
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