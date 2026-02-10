const { z } = require('zod');

const createItemSchema = z.object({
    body: z.object({
        name: z.string({ required_error: 'Name is required' }),
        category: z.string({ required_error: 'Category is required' }),
        make: z.string().optional(),
        serialNumber: z.string({ required_error: 'Serial number is required' }),
        quantity: z.coerce.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
        location: z.string().optional(),
        primaryRemarks: z.string().optional(),
        secondaryRemarks: z.string().optional(),
        status: z.enum(['Available', 'Issued', 'Damaged']).optional(),
        purchaseDate: z.string().optional().or(z.date().optional()) // Allow string date or date object
    })
});

const updateItemSchema = z.object({
    params: z.object({
        id: z.string({ required_error: 'Item ID is required' })
    }),
    body: z.object({
        name: z.string().optional(),
        category: z.string().optional(),
        make: z.string().optional(),
        serialNumber: z.string().optional(),
        quantity: z.number().min(0).optional(),
        location: z.string().optional(),
        primaryRemarks: z.string().optional(),
        secondaryRemarks: z.string().optional(),
        status: z.enum(['Available', 'Issued', 'Damaged']).optional(),
        assignments: z.array(z.object({
            employeeName: z.string(),
            quantity: z.number(),
            date: z.string().optional().or(z.date().optional())
        })).optional()
    })
});

module.exports = { createItemSchema, updateItemSchema };
