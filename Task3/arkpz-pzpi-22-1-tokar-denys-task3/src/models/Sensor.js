const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
    type: { type: String, required: true, enum: ['temperature', 'humidity', 'light'] },
    greenhouseId: { type: Schema.Types.ObjectId, ref: 'Greenhouse', required: true },
    model: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    unit: { type: String, required: true },
    lastValue: { type: Schema.Types.Mixed },
    lastUpdated: { type: Date },
});


sensorSchema.pre('deleteOne', { document: true, query: false }, async function(next){
   try {
        await mongoose.model('SensorData').deleteMany({ sensorId: this._id });
        next()
   }catch (error) {
        next(error)
    }
})

module.exports = mongoose.model('Sensor', sensorSchema);