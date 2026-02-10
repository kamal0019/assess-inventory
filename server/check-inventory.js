require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');

const checkInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        const count = await InventoryItem.countDocuments();
        console.log(`\nInventory Items Found: ${count}`);

        if (count > 0) {
            const items = await InventoryItem.find({}).limit(5);
            console.log('Sample Items:', items);
        } else {
            console.log('❌ No inventory items found. Database might be empty.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

checkInventory();
