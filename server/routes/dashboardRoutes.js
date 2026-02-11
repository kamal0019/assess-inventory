const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const Employee = require('../models/Employee');
const Outliner = require('../models/Outliner');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
    try {
        const [
            totalItems,
            lowStockCount,
            totalIssued,
            employeeCount,
            outlinerCount,
            categoryDistribution
        ] = await Promise.all([
            InventoryItem.countDocuments({}),
            InventoryItem.countDocuments({ quantity: { $lt: 5 } }),
            // Calculate total issued quantity using aggregation
            InventoryItem.aggregate([
                { $unwind: "$assignments" },
                { $group: { _id: null, totalIssued: { $sum: "$assignments.quantity" } } }
            ]),
            Employee.countDocuments({ role: { $ne: 'Admin' } }),
            Outliner.countDocuments({}),
            // Aggregate category distribution for the chart
            InventoryItem.aggregate([
                { $group: { _id: "$category", quantity: { $sum: "$quantity" } } },
                { $project: { name: "$_id", quantity: 1, _id: 0 } }
            ])
        ]);

        // Calculate total stock quantity (sum of all item quantities)
        const TotalStockAggregation = await InventoryItem.aggregate([
            { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } }
        ]);

        const totalQuantity = TotalStockAggregation.length > 0 ? TotalStockAggregation[0].totalQuantity : 0;
        const issuedQuantity = totalIssued.length > 0 ? totalIssued[0].totalIssued : 0;
        const availableStock = totalQuantity - issuedQuantity;

        res.json({
            success: true,
            data: {
                totalQuantity,
                availableStock,
                totalIssued: issuedQuantity,
                lowStockCount,
                employeeCount,
                outlinerCount,
                chartData: categoryDistribution // Send chart data directly from backend
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
