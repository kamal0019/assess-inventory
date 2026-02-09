const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    employeeId: { type: String, unique: true, sparse: true },
    email: { type: String, required: true },
    contact: { type: String },
    department: { type: String },
    designation: { type: String },
    password: { type: String, required: false },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    type: {
        type: String,
        enum: ['Employee', 'Outliner'],
        default: 'Employee'
    },
    role: {
        type: String,
        enum: ['Admin', 'User'],
        default: 'User'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, { timestamps: true });

// Encrypt password using bcrypt
EmployeeSchema.pre('save', async function (next) {
    if (!this.password || !this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
EmployeeSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
const crypto = require('crypto');

EmployeeSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

module.exports = mongoose.model('Employee', EmployeeSchema);
