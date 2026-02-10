require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');

const verifySeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const count = await InventoryItem.countDocuments();
        console.log(`Inventory Items: ${count}`);
        if (count > 0) {
            const items = await InventoryItem.find({}).select('name category quantity status');
            console.table(items.map(i => ({ name: i.name, category: i.category, qty: i.quantity, status: i.status })));
        }
        await mongoose.connection.close();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
verifySeed();
