const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
    module: {
        type: String,
        required: true,
        enum: ['INVENTORY', 'EMPLOYEE', 'OUTLINER', 'AUTH', 'SYSTEM']
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'IMPORT', 'ASSIGN', 'RETURN']
    },
    description: {
        type: String,
        required: true
    },
    performedBy: {
        type: String, // Name or Email of user/admin
        default: 'System'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed // Flexible field for extra details (e.g., item ID, old/new values)
    }
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
