const { z } = require('zod');

const createBillSchema = z.object({
    body: z.object({
        recipient: z.object({
            name: z.string({ required_error: 'Recipient name is required' }),
            type: z.enum(['Employee', 'Outliner'], { required_error: 'Recipient type is required' }),
            id: z.string({ required_error: 'Recipient ID is required' })
        }),
        items: z.array(z.object({
            name: z.string({ required_error: 'Item name is required' }),
            serialNumber: z.string().optional(),
            category: z.string().optional(),
            make: z.string().optional(),
            quantity: z.number().min(1).default(1),
            price: z.number().min(0).default(0),
            remark: z.string().optional()
        })).nonempty({ message: 'Bill must contain at least one item' }),
        totalAmount: z.number().min(0),
        verifiedBy: z.object({
            name: z.string().optional(),
            date: z.string().optional().or(z.date().optional())
        }).optional()
    })
});

module.exports = { createBillSchema };
