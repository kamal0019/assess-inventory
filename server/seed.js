const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check if user exists and delete to reset
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
            process.exit(1);
        }

        const adminExists = await Admin.findOne({ email: adminEmail });

        if (adminExists) {
            console.log('Admin already exists. Deleting to reset password...');
            await Admin.deleteOne({ email: adminEmail });
        }

        // Create Admin
        await Admin.create({
            name: process.env.ADMIN_NAME || 'Admin User',
            email: adminEmail,
            password: adminPassword, // Pre-save hook will hash this
            contact: process.env.ADMIN_CONTACT || '1234567890'
        });

        console.log(`Admin created successfully: ${adminEmail}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
