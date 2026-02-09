require('dotenv').config();
const net = require('net');

const uri = process.env.MONGO_URI;

console.log('--- NETWORK DIAGNOSTIC ---');

if (!uri) {
    console.error('❌ MONGO_URI is missing');
    process.exit(1);
}

// Extract hostname and port from URI
// Format: mongodb://user:pass@host1:27017,host2:27017/...
let hostToTest;
let portToTest = 27017;

try {
    // Remove protocol
    const cleanUri = uri.replace('mongodb://', '').replace('mongodb+srv://', '');
    // Remove user:pass@
    const afterAuth = cleanUri.includes('@') ? cleanUri.split('@')[1] : cleanUri;
    // Get first host in list
    const firstHost = afterAuth.split(',')[0].split('/')[0];

    // Split host:port
    if (firstHost.includes(':')) {
        const parts = firstHost.split(':');
        hostToTest = parts[0];
        portToTest = parseInt(parts[1]);
    } else {
        hostToTest = firstHost;
    }
} catch (e) {
    console.error('❌ Could not parse hostname from URI');
    process.exit(1);
}

console.log(`Testing TCP connection to: ${hostToTest}:${portToTest}`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('✅ TCP Connection SUCCESSFUL!');
    console.log('   - Your network ALLOWS traffic to port 27017.');
    console.log('   - If DB connection fails, check Username/Password.');
    socket.destroy();
    process.exit(0);
});

socket.on('timeout', () => {
    console.error('❌ TCP Connection TIMED OUT.');
    console.error('   - Your network likely BLOCKS port 27017.');
    socket.destroy();
    process.exit(1);
});

socket.on('error', (err) => {
    console.error(`❌ TCP Connection ERROR: ${err.message}`);
    console.error('   - Check hostname or network connection.');
    process.exit(1);
});

socket.connect(portToTest, hostToTest);
