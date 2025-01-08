const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const greenhouseSchema = new Schema({
    name: { type: String },
    location: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Greenhouse', greenhouseSchema);