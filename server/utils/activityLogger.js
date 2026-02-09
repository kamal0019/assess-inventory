const ActivityLog = require('../models/ActivityLog');

/**
 * Logs an activity to the database.
 * @param {string} module - The module where action occurred (INVENTORY, EMPLOYEE, etc.)
 * @param {string} action - The action type (CREATE, UPDATE, DELETE, etc.)
 * @param {string} description - Human readable description
 * @param {string} performedBy - User who performed the action (optional)
 * @param {object} metadata - Extra data (optional)
 */
const logActivity = async (module, action, description, performedBy = 'System', metadata = null) => {
    try {
        await ActivityLog.create({
            module,
            action,
            description,
            performedBy,
            metadata
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't crash the request if logging fails
    }
};

module.exports = logActivity;
