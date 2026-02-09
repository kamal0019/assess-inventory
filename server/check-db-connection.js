const mongoose = require('mongoose');

const checkConnection = async () => {
    try {
        // Testing full standard connection string with multiple hosts

        const uri = "mongodb://kamal:kamal123@ac-4nlskhv-shard-00-00.awzi1yw.mongodb.net:27017,ac-4nlskhv-shard-00-01.awzi1yw.mongodb.net:27017,ac-4nlskhv-shard-00-02.awzi1yw.mongodb.net:27017/assessinventory?ssl=true&authSource=admin&retryWrites=true&w=majority";
        console.log('Attempting to connect to MongoDB with Standard URI (Multiple Hosts)...');
        console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);

        const conn = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nExisting Collections:');
        if (collections.length === 0) {
            console.log('   (No collections found)');
        } else {
            collections.forEach(collection => {
                console.log(`   - ${collection.name}`);
            });
        }

        mongoose.connection.close();
        console.log('\nConnection closed.');
    } catch (error) {
        console.error(`❌ Connection Error: ${error.message}`);
        process.exit(1);
    }
};

checkConnection();
