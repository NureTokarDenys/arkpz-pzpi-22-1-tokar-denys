const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: String,
}, { timestamps: true });

UserSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const greenhouses = await mongoose.model('Greenhouse').find({ ownerId: this._id });
         for(const greenhouse of greenhouses){
             await mongoose.model('Sensor').deleteMany({ greenhouseId: greenhouse._id });
             await mongoose.model('SensorData').deleteMany({ greenhouseId: greenhouse._id });
             await mongoose.model('Rule').deleteMany({ greenhouseId: greenhouse._id });
             await mongoose.model('Log').deleteMany({ greenhouseId: greenhouse._id });
         }
        await mongoose.model('Greenhouse').deleteMany({ ownerId: this._id });
        next();
    } catch (error) {
        next(error)
    }
});

module.exports = mongoose.model('User', UserSchema);