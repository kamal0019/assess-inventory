const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const Employee = require('../models/Employee');
const Outliner = require('../models/Outliner');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
    try {
        const [
            totalItems,
            lowStockItems,
            issuedItems,
            totalEmployees,
            totalOutliners
        ] = await Promise.all([
            InventoryItem.find({}),
            InventoryItem.find({ quantity: { $lt: 5 } }),
            InventoryItem.find({ status: 'Issued' }),
            Employee.countDocuments({ role: { $ne: 'Admin' } }),
            Outliner.countDocuments({})
        ]);

        const totalQuantity = totalItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
        // Calculate issued quantity from assignments array
        const totalIssued = totalItems.reduce((acc, item) => {
            const assigned = (item.assignments || []).reduce((sum, a) => sum + (a.quantity || 0), 0);
            return acc + assigned;
        }, 0);

        const availableStock = totalQuantity - totalIssued;

        res.json({
            success: true,
            data: {
                totalQuantity,
                availableStock,
                totalIssued,
                lowStockCount: lowStockItems.length,
                employeeCount: totalEmployees,
                outlinerCount: totalOutliners
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
router.get('/activity', protect, async (req, res) => {
    try {
        const logs = await ActivityLog.find({})
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
