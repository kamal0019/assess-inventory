const { z } = require('zod');

const loginSchema = z.object({
    body: z.object({
        email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
        password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
        token: z.string().optional() // For 2FA
    })
});

const verify2faSchema = z.object({
    body: z.object({
        token: z.string({ required_error: 'Token is required' }).length(6, 'Token must be 6 digits')
    })
});

module.exports = { loginSchema, verify2faSchema };
