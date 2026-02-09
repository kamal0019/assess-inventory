require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const verifyData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const admins = await Admin.find({});
        console.log(`\nAdmin Users Found: ${admins.length}`);
        admins.forEach(admin => {
            console.log(` - Name: ${admin.name}, Email: ${admin.email}`);
        });

        if (admins.length > 0) {
            console.log('\n✅ Data integrity verification passed: Admin user exists.');
        } else {
            console.log('\n❌ Data integrity verification failed: No admin user found.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(`❌ Verification Error: ${error.message}`);
        process.exit(1);
    }
};

verifyData();
