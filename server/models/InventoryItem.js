const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    make: { type: String },
    serialNumber: { type: String, required: true, unique: true },
    quantity: { type: Number, required: true, default: 1 },
    location: { type: String },
    primaryRemarks: { type: String },
    secondaryRemarks: { type: String },
    status: {
        type: String,
        enum: ['Available', 'Issued', 'Damaged'],
        default: 'Available'
    },
    assignedTo: { type: String }, // Deprecated
    assignments: [{
        employeeName: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        date: { type: Date, default: Date.now }
    }],
    purchaseDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
