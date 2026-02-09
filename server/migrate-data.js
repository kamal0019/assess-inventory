const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/assessinventory';
const CLOUD_URI = process.env.MONGO_URI;

const migrate = async () => {
    try {
        console.log('🔗 Connecting to LOCAL database...');
        const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('✅ Connected to LOCAL.');

        console.log('🔗 Connecting to CLOUD database...');
        // Added 10s timeout to fail fast
        const cloudConn = await mongoose.createConnection(CLOUD_URI, {
            serverSelectionTimeoutMS: 10000
        }).asPromise();
        console.log('✅ Connected to CLOUD.');

        const collections = await localConn.db.listCollections().toArray();

        for (const collection of collections) {
            const collageName = collection.name;
            if (collageName.startsWith('system.')) continue;

            console.log(`\n📦 Migrating: ${collageName}`);
            const localColl = localConn.collection(collageName);
            const cloudColl = cloudConn.collection(collageName);

            const data = await localColl.find().toArray();
            if (data.length === 0) {
                console.log(`   - Skipping (Empty)`);
                continue;
            }

            console.log(`   - Found ${data.length} docs.`);
            try {
                await cloudColl.insertMany(data, { ordered: false });
                console.log(`   - ✅ Inserted.`);
            } catch (err) {
                if (err.code === 11000) console.log(`   - ⚠️  Duplicates skipped.`);
                else console.error(`   - ❌ Error: ${err.message}`);
            }
        }

        console.log('\n✨ Done!');
        await localConn.close();
        await cloudConn.close();
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Failed:', error.message);
        process.exit(1);
    }
};

migrate();
