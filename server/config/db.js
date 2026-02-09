const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.warn('⚠️  MONGO_URI is missing in environment variables. Defaulting to localhost (Will fail in production).');
        }

        const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/assessinventory');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
