const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    billNo: {
        type: String,
        unique: true
    },
    recipient: {
        name: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['Employee', 'Outliner'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'recipient.type' // Dynamic reference to Employee or Outliner
        }
    },
    items: [{
        name: { type: String, required: true },
        serialNumber: { type: String },
        category: { type: String },
        make: { type: String },
        quantity: { type: Number, default: 1 }, // Added quantity
        price: { type: Number, default: 0 }, // This represents Rate (Unit Price)
        remark: { type: String }
    }],
    totalAmount: {
        type: Number,
        required: true,
        default: 0
    },
    verifiedBy: {
        name: { type: String, default: 'Jaspreet Singh' },
        date: { type: Date, default: Date.now }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to generate a simple bill number if not present
// In a real app, you might want a more robust sequence generator
BillSchema.pre('save', async function (next) {
    if (!this.billNo) {
        const count = await this.constructor.countDocuments();
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        // Format: BILL-YYYYMMDD-001
        this.billNo = `BILL-${datePart}-${(count + 1).toString().padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Bill', BillSchema);
