const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const corsOptions = require('./src/options/corsOptions');
const { connectDB } = require('./src/config/db');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5000; 

dotenv.config();

// CORS
app.use(cors(corsOptions));

// Json middleware
app.use(express.json());

// Routes
app.use('/api', routes);

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  }).catch((err) => console.error(err));