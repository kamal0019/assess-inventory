const express = require('express');
const router = express.Router();
const Outliner = require('../models/Outliner');
const logActivity = require('../utils/activityLogger');
const { protect, admin } = require('../middleware/authMiddleware');

const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all outliners
// @route   GET /api/outliners
router.get('/', protect, async (req, res) => {
    try {
        const features = new APIFeatures(Outliner.find({}), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const outliners = await features.query;
        res.json({ success: true, count: outliners.length, data: outliners });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

const InventoryItem = require('../models/InventoryItem');

// @desc    Get single outliner by ID
// @route   GET /api/outliners/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const outliner = await Outliner.findById(req.params.id);
        if (!outliner) {
            return res.status(404).json({ success: false, error: 'Outliner not found' });
        }

        // Find items assigned to this outliner
        const items = await InventoryItem.find({
            assignedTo: outliner.name,
            status: 'Issued'
        });

        res.json({ success: true, data: { ...outliner.toObject(), issuedItems: items } });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

const { createOutlinerSchema, updateOutlinerSchema } = require('../schemas/employee.schema');
const validateResource = require('../middleware/validateResource');

// @desc    Create an outliner
// @route   POST /api/outliners
router.post('/', protect, admin, validateResource(createOutlinerSchema), async (req, res) => {
    try {
        const outliner = await Outliner.create(req.body);
        await logActivity('OUTLINER', 'CREATE', `Added new outliner: ${outliner.name}`, req.user.name);
        res.status(201).json({ success: true, data: outliner });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Update outliner
// @route   PUT /api/outliners/:id
router.put('/:id', protect, admin, validateResource(updateOutlinerSchema), async (req, res) => {
    try {
        const outliner = await Outliner.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!outliner) {
            return res.status(404).json({ success: false, error: 'Outliner not found' });
        }
        await logActivity('OUTLINER', 'UPDATE', `Updated outliner: ${outliner.name}`, req.user.name);
        res.json({ success: true, data: outliner });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Delete outliner
// @route   DELETE /api/outliners/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const outliner = await Outliner.findByIdAndDelete(req.params.id);
        if (!outliner) {
            return res.status(404).json({ success: false, error: 'Outliner not found' });
        }
        await logActivity('OUTLINER', 'DELETE', `Deleted outliner: ${outliner.name}`, req.user.name);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;
