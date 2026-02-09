const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const logActivity = require('../utils/activityLogger');
const { protect, admin } = require('../middleware/authMiddleware');

const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all items
// @route   GET /api/inventory
router.get('/', protect, async (req, res) => {
    try {
        const features = new APIFeatures(InventoryItem.find({}), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const items = await features.query;

        // Optional: Get total count for pagination frontend logic (if enabled later)
        // const total = await InventoryItem.countDocuments(); 

        res.json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

const { createItemSchema, updateItemSchema } = require('../schemas/inventory.schema');
const validateResource = require('../middleware/validateResource');

// @desc    Create an item
// @route   POST /api/inventory
router.post('/', protect, admin, validateResource(createItemSchema), async (req, res) => {
    try {
        const item = await InventoryItem.create(req.body);
        await logActivity('INVENTORY', 'CREATE', `Created item: ${item.name}`, req.user.name);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Bulk create items
// @route   POST /api/inventory/bulk
router.post('/bulk', protect, admin, async (req, res) => {
    try {
        const body = req.body;
        if (!Array.isArray(body) || body.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid data format' });
        }
        const items = await InventoryItem.insertMany(body);
        await logActivity('INVENTORY', 'IMPORT', `Imported ${items.length} items from Excel`, req.user.name);
        res.status(201).json({ success: true, count: items.length, data: items });
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(400).json({ success: false, error: 'Failed to import items' });
    }
});

// @desc    Update an item
// @route   PUT /api/inventory/:id
router.put('/:id', protect, admin, validateResource(updateItemSchema), async (req, res) => {
    try {
        const { assignments, quantity } = req.body;

        // Validation: Ensure total assigned quantity does not exceed total quantity
        if (assignments && Array.isArray(assignments)) {
            const totalAssigned = assignments.reduce((sum, a) => sum + (a.quantity || 0), 0);
            if (totalAssigned > quantity) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot assign ${totalAssigned} items. Only ${quantity} available.`
                });
            }
        }

        const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }

        await logActivity('INVENTORY', 'UPDATE', `Updated item: ${item.name}`, req.user.name);
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Bulk Issue Items by Category
// @route   POST /api/inventory/bulk-issue
router.post('/bulk-issue', protect, admin, async (req, res) => {
    try {
        const { category, quantity, recipientName, recipientType, recipientId } = req.body;

        if (!category || !quantity || !recipientName) {
            return res.status(400).json({ success: false, error: 'Please provide category, quantity, and recipient name' });
        }

        const count = parseInt(quantity);
        if (isNaN(count) || count <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid quantity' });
        }

        // Find available items of this category
        const availableItems = await InventoryItem.find({
            category: category,
            status: 'Available'
        }).limit(count);

        if (availableItems.length < count) {
            return res.status(400).json({
                success: false,
                error: `Only ${availableItems.length} available items found for category '${category}'`
            });
        }

        const updatedItems = [];

        // Update each item
        for (const item of availableItems) {
            item.status = 'Issued';
            // Deprecated assignedTo field, but keeping for backward compat if needed
            item.assignedTo = recipientName;

            item.assignments.push({
                employeeName: recipientName,
                quantity: 1, // Assuming serialized items are qty 1
                date: new Date()
            });

            await item.save();
            updatedItems.push(item);
        }

        await logActivity('INVENTORY', 'BULK_ISSUE', `Issued ${count} ${category}s to ${recipientName}`, req.user.name);

        res.json({ success: true, data: updatedItems });

    } catch (error) {
        console.error('Bulk issue error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Bulk Return Items (Unissue)
// @route   POST /api/inventory/bulk-return
router.post('/bulk-return', protect, admin, async (req, res) => {
    try {
        const { itemIds, returnedBy, returnDate } = req.body;

        if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Please provide item IDs to return' });
        }

        const updatedItems = [];

        for (const id of itemIds) {
            const item = await InventoryItem.findById(id);
            if (item) {
                const previousAssignee = item.assignedTo || 'Unknown';

                item.status = 'Available';
                item.assignedTo = null; // Clear assignment

                await item.save();
                updatedItems.push(item);
            }
        }

        await logActivity('INVENTORY', 'RETURN', `Returned ${updatedItems.length} items from ${returnedBy || 'Employee/Outliner'}`, req.user.name);

        res.json({ success: true, data: updatedItems });

    } catch (error) {
        console.error('Bulk return error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Delete an item
// @route   DELETE /api/inventory/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, error: 'Item not found' });
        }
        await logActivity('INVENTORY', 'DELETE', `Deleted item: ${item.name}`, req.user.name);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: 'Failed to delete item' });
    }
});

module.exports = router;

