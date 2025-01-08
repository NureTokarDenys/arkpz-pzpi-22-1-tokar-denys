const express = require('express');
const router = express.Router();
const usersRouter = require('./users');
const greenhousesRouter = require('./greenhouses');
const sensorsRouter = require('./sensors');
const sensorDataRouter = require('./sensorData');
const rulesRouter = require('./rules');
const logsRouter = require('./logs');

router.use('/users', usersRouter);
router.use('/greenhouses', greenhousesRouter);
router.use('/sensors', sensorsRouter);
router.use('/sensordata', sensorDataRouter);
router.use('/rules', rulesRouter);
router.use('/logs', logsRouter);

module.exports = router;