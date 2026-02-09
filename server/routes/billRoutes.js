const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const logActivity = require('../utils/activityLogger');
const { protect, admin } = require('../middleware/authMiddleware');

const { createBillSchema } = require('../schemas/bill.schema');
const validateResource = require('../middleware/validateResource');

// @desc    Create a new bill
// @route   POST /api/bills
router.post('/', protect, validateResource(createBillSchema), async (req, res) => {
    try {
        const bill = await Bill.create(req.body);

        await logActivity(
            'BILL',
            'CREATE',
            `Generated Bill ${bill.billNo} for ${req.body.recipient.name} (Amount: ₹${bill.totalAmount})`,
            req.body.verifiedBy?.name || req.user.name
        );

        res.status(201).json({ success: true, data: bill });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all bills
// @route   GET /api/bills
router.get('/', protect, async (req, res) => {
    try {
        const features = new APIFeatures(Bill.find({}), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const bills = await features.query;
        res.json({ success: true, count: bills.length, data: bills });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Get single bill by ID
// @route   GET /api/bills/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) {
            return res.status(404).json({ success: false, error: 'Bill not found' });
        }
        res.json({ success: true, data: bill });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Delete a bill
// @route   DELETE /api/bills/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const bill = await Bill.findByIdAndDelete(req.params.id);
        if (!bill) {
            return res.status(404).json({ success: false, error: 'Bill not found' });
        }
        await logActivity('BILL', 'DELETE', `Deleted Bill ${bill.billNo}`, req.user.name);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;
