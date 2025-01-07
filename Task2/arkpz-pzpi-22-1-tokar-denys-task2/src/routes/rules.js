const express = require('express');
const router = express.Router();
const Rule = require('../models/Rule');

// GET all rules
router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all rules of a specific greenhouse
router.get('/greenhouse/:greenhouseId', async (req, res) => {
  try {
      const rules = await Rule.find({ greenhouseId: req.params.greenhouseId });
      res.json(rules);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// GET one rule
router.get('/:id', getRule, (req, res) => {
  res.json(res.rule);
});

// POST a new rule
router.post('/', async (req, res) => {
    const newRule = new Rule({
      greenhouseId: req.body.greenhouseId,
      condition: req.body.condition, // ['time_based', 'sensor_based']
      action: req.body.action, // ['start_fertilizing', 'stop_fertilizing', 'turn_on_light', 'turn_off_light', 'start_cooling', 'stop_cooling']
      schedule: req.body.schedule,
      threshold: req.body.threshold,
      status: req.body.status // ['active', 'inactive']
  });
    try {
      const savedRule = await newRule.save();
        res.status(201).json(savedRule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH an existing rule
router.patch('/:id', getRule, async (req, res) => {
  if (req.body.greenhouseId != null) {
    res.rule.greenhouseId = req.body.greenhouseId;
  }
  if (req.body.condition != null) {
    res.rule.condition = req.body.condition;
  }
  if (req.body.action != null) {
    res.rule.action = req.body.action;
  }
  if (req.body.schedule != null) {
    res.rule.schedule = req.body.schedule;
  }
  if (req.body.threshold != null) {
    res.rule.threshold = req.body.threshold;
  }
  if (req.body.status != null) {
    res.rule.status = req.body.status;
  }
  try {
    const updatedRule = await res.rule.save();
    res.json(updatedRule);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a rule
router.delete('/:id', getRule, async (req, res) => {
  try {
    await res.rule.deleteOne();
    res.json({ message: 'Deleted Rule' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getRule(req, res, next) {
  let rule;
  try {
    rule = await Rule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ message: 'Cannot find rule' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.rule = rule;
  next();
}

module.exports = router;