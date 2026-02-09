const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get inventory summary by category
// @route   GET /api/reports/inventory-summary
router.get('/inventory-summary', protect, async (req, res) => {
    try {
        const summary = await InventoryItem.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalQuantity: { $sum: "$quantity" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);
        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Get low stock items report
// @route   GET /api/reports/low-stock
router.get('/low-stock', protect, async (req, res) => {
    try {
        const items = await InventoryItem.find({ quantity: { $lt: 5 } })
            .select('name category quantity location status')
            .sort({ quantity: 1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;
