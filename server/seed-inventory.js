require('dotenv').config();
const mongoose = require('mongoose');
const InventoryItem = require('./models/InventoryItem');
const Employee = require('./models/Employee');
const ActivityLog = require('./models/ActivityLog');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Clear existing data (except Admins)
        await InventoryItem.deleteMany({});
        await Employee.deleteMany({ role: { $ne: 'Admin' } });
        await ActivityLog.deleteMany({});
        console.log('🗑️ Cleared existing Inventory, Employees, and Logs');

        // 1. Create Employees
        const employees = await Employee.create([
            {
                name: "John Doe",
                email: "john@assessinfra.com",
                employeeId: "EMP001",
                department: "IT",
                designation: "System Admin",
                role: "User",
                status: "Active"
            },
            {
                name: "Jane Smith",
                email: "jane@assessinfra.com",
                employeeId: "EMP002",
                department: "HR",
                designation: "HR Manager",
                role: "User",
                status: "Active"
            },
            {
                name: "Mike Ross",
                email: "mike@assessinfra.com",
                employeeId: "EMP003",
                department: "Operations",
                designation: "Manager",
                role: "User",
                status: "Active"
            }
        ]);
        console.log(`👤 Created ${employees.length} Employees`);

        // 2. Create Inventory Items
        const items = await InventoryItem.create([
            {
                name: "Dell XPS 15",
                category: "Laptop",
                make: "Dell",
                serialNumber: "DEL-XPS-001",
                quantity: 5,
                location: "Server Room",
                status: "Available",
                purchaseDate: new Date('2024-01-15')
            },
            {
                name: "Dell XPS 15",
                category: "Laptop",
                make: "Dell",
                serialNumber: "DEL-XPS-002",
                quantity: 1,
                location: "Floor 2",
                status: "Issued",
                assignments: [{
                    employeeName: "John Doe",
                    quantity: 1,
                    date: new Date()
                }],
                purchaseDate: new Date('2024-01-15')
            },
            {
                name: "Logitech MX Master 3",
                category: "Peripheral",
                make: "Logitech",
                serialNumber: "LOG-MX-001",
                quantity: 10,
                location: "Store",
                status: "Available"
            },
            {
                name: "HP LaserJet Pro",
                category: "Printer",
                make: "HP",
                serialNumber: "HP-PRT-001",
                quantity: 2,
                location: "Reception",
                status: "Available",
                primaryRemarks: "Needs toner refilling"
            },
            {
                name: "Cisco Switch 2960",
                category: "Networking",
                make: "Cisco",
                serialNumber: "CS-SW-001",
                quantity: 1,
                location: "Rack 1",
                status: "Damaged",
                secondaryRemarks: "Port 4 not working"
            }
        ]);
        console.log(`📦 Created ${items.length} Inventory Items`);

        // 3. Create Activity Logs
        await ActivityLog.create([
            {
                module: "SYSTEM",
                action: "CREATE",
                description: "System initialized with seed data",
                performedBy: "Admin"
            },
            {
                module: "INVENTORY",
                action: "IMPORT",
                description: "Bulk imported initial inventory",
                performedBy: "Admin"
            },
            {
                module: "INVENTORY",
                action: "ASSIGN",
                description: "Assigned Dell XPS 15 to John Doe",
                performedBy: "Admin"
            }
        ]);
        console.log('📜 Created Sample Activity Logs');

        console.log('\n✅ Database Seeded Successfully!');
        console.log('👉 You can now refresh your dashboard to see the data.');

        mongoose.connection.close();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

seedData();
