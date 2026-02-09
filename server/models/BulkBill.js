const mongoose = require('mongoose');

const BulkBillSchema = new mongoose.Schema({
    batchId: { type: String, required: true, unique: true },
    totalItems: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    bills: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill'
    }],
    createdBy: {
        type: String, // Admin name
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('BulkBill', BulkBillSchema);
