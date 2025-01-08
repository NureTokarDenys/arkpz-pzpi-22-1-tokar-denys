const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
    greenhouseId: { type: Schema.Types.ObjectId, ref: 'Greenhouse', required: true },
    type: { type: String, enum: ['error', 'info'], default: 'info' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Log', logSchema);