const { z } = require('zod');

const createEmployeeSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        employeeId: z.string({ required_error: 'Employee ID is required' }),
        email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        contact: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        role: z.enum(['Admin', 'User']).optional(),
        type: z.enum(['Employee', 'Outliner']).optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional()
    })
});

const updateEmployeeSchema = z.object({
    params: z.object({
        id: z.string({ required_error: 'ID is required' })
    }),
    body: z.object({
        name: z.string().optional(),
        employeeId: z.string().optional(),
        email: z.string().email().optional(),
        contact: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        role: z.enum(['Admin', 'User']).optional(),
        status: z.enum(['Active', 'Inactive']).optional()
    })
});

const createOutlinerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        contact: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional()
    })
});

const updateOutlinerSchema = z.object({
    params: z.object({
        id: z.string({ required_error: 'ID is required' })
    }),
    body: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        contact: z.string().optional(),
        department: z.string().optional(),
        designation: z.string().optional(),
        status: z.enum(['Active', 'Inactive']).optional()
    })
});

module.exports = {
    createEmployeeSchema,
    updateEmployeeSchema,
    createOutlinerSchema,
    updateOutlinerSchema
};
