const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ruleSchema = new Schema({
    greenhouseId: { type: Schema.Types.ObjectId, ref: 'Greenhouse', required: true },
    condition: { type: String, required: true, enum: ['time_based', 'sensor_based'] },
    action: { 
      type: String, 
      required: true, 
      enum: ['start_fertilizing', 'stop_fertilizing', 'turn_on_light', 'turn_off_light', 'start_cooling', 'stop_cooling'] 
    },
    schedule: { type: Object, default: null }, 
    threshold: { type: Object, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
});

module.exports = mongoose.model('Rule', ruleSchema);