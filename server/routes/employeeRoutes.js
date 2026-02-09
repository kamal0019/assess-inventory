const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const logActivity = require('../utils/activityLogger');
const { protect, admin } = require('../middleware/authMiddleware');

const APIFeatures = require('../utils/apiFeatures');

// @desc    Get all employees
// @route   GET /api/employees
router.get('/', protect, async (req, res) => {
    try {
        const { type } = req.query;
        // Construct filter object first
        let filter = {
            role: { $ne: 'Admin' },
            email: { $ne: 'admin@assessinfra.com' }
        };

        if (type) {
            filter.type = type;
        }

        const features = new APIFeatures(Employee.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const employees = await features.query;
        res.json({ success: true, count: employees.length, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
const InventoryItem = require('../models/InventoryItem');

// @desc    Get single employee by ID
// @route   GET /api/employees/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        // Find items assigned to this employee
        const items = await InventoryItem.find({
            assignedTo: employee.name,
            status: 'Issued'
        });

        res.json({ success: true, data: { ...employee.toObject(), issuedItems: items } });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

const { createEmployeeSchema, updateEmployeeSchema } = require('../schemas/employee.schema');
const validateResource = require('../middleware/validateResource');

// @desc    Create an employee
// @route   POST /api/employees
router.post('/', protect, admin, validateResource(createEmployeeSchema), async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        await logActivity('EMPLOYEE', 'CREATE', `Added new employee: ${employee.name}`, req.user.name);
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Update employee
// @route   PUT /api/employees/:id
router.put('/:id', protect, admin, validateResource(updateEmployeeSchema), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        await logActivity('EMPLOYEE', 'UPDATE', `Updated employee: ${employee.name}`, req.user.name);
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// @desc    Delete employee
// @route   DELETE /api/employees/:id
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        await logActivity('EMPLOYEE', 'DELETE', `Deleted employee: ${employee.name}`, req.user.name);
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = router;

