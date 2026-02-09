const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');
require('dotenv').config();

const checkLaptops = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const allItems = await InventoryItem.find({});
        console.log(`Total Inventory Items: ${allItems.length}`);

        const categoryCounts = {};
        allItems.forEach(item => {
            const cat = item.category || 'Uncategorized';
            if (!categoryCounts[cat]) {
                categoryCounts[cat] = { total: 0, available: 0 };
            }
            categoryCounts[cat].total++;
            if (item.status === 'Available') {
                categoryCounts[cat].available++;
            }
        });

        console.log('\n--- Category Counts ---');
        console.table(categoryCounts);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLaptops();
