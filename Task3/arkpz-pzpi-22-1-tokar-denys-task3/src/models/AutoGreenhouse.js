const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const greenhouseSchema = new Schema({
    name: { type: String },
    location: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});


greenhouseSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        await mongoose.model('Sensor').deleteMany({ greenhouseId: this._id });
        await mongoose.model('SensorData').deleteMany({ greenhouseId: this._id });
        await mongoose.model('Rule').deleteMany({ greenhouseId: this._id });
        await mongoose.model('Log').deleteMany({ greenhouseId: this._id });
    next();
    } catch (error) {
       next(error)
    }
});

module.exports = mongoose.model('Greenhouse', greenhouseSchema);