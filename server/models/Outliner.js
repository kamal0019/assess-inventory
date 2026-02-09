const mongoose = require('mongoose');

const OutlinerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employeeId: { type: String, unique: true, sparse: true }, // Optional ID
    email: { type: String, required: true },
    contact: { type: String },
    department: { type: String },
    designation: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Outliner', OutlinerSchema);
