const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
        dbName: 'AutoGreenhouse',
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.error('Full error details:', error);
    process.exit(1);
  }
}

module.exports = { connectDB, mongoose };