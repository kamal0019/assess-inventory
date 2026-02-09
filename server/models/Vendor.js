const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    contact: { type: String },
    address: { type: String },
    gstIn: { type: String },
    products: [{ type: String }], // List of products they supply
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', VendorSchema);
