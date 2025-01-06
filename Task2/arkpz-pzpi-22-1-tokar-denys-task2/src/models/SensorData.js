const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorDataSchema = new Schema({
    sensorId: { type: Schema.Types.ObjectId, ref: 'Sensor', required: true },
    timestamp: { type: Date, default: Date.now },
    value: { type: Schema.Types.Mixed, required: true },
});

module.exports = mongoose.model('SensorData', sensorDataSchema);