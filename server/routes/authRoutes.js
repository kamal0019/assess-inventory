const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const { loginSchema } = require('../schemas/auth.schema');
const validateResource = require('../middleware/validateResource');

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateResource(loginSchema), async (req, res) => {
    try {
        const { email, password, token } = req.body;
        console.log(`Login attempt for: ${email}`);

        // Check for admin email
        const admin = await Admin.findOne({ email });

        if (!admin) {
            console.log('Admin not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await admin.matchPassword(password);
        console.log(`Password match result: ${isMatch}`);

        if (admin && isMatch) {
            // Check if 2FA is enabled
            if (admin.isTwoFactorEnabled) {
                // If token is provided, verify it
                if (token) {
                    const verified = speakeasy.totp.verify({
                        secret: admin.twoFactorSecret,
                        encoding: 'base32',
                        token: token
                    });

                    if (!verified) {
                        return res.status(401).json({ message: 'Invalid 2FA token' });
                    }
                    // Continue to generate token below
                } else {
                    // 2FA required but not provided
                    return res.json({
                        success: true,
                        requires2FA: true,
                        userId: admin._id
                    });
                }
            }

            res.json({
                _id: admin.id,
                name: admin.name,
                email: admin.email,
                role: 'Admin',
                is2FAEnabled: admin.isTwoFactorEnabled,
                token: generateToken(admin._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.status(200).json(req.user);
});

const crypto = require('crypto');

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Admin.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get reset token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        // Create reset url
        // In production, this would be the frontend URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

        try {
            // Simulate sending email
            console.log('============================================');
            console.log('PASSWORD RESET LINK:');
            console.log(resetUrl);
            console.log('============================================');

            res.status(200).json({ success: true, data: 'Email sent' });
        } catch (err) {
            console.log(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save({ validateBeforeSave: false });

            return res.status(500).json({ success: false, error: 'Email could not be sent' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Reset Password
// @route   PUT /api/auth/reset-password/:resetToken
router.put('/reset-password/:resetToken', async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    try {
        const user = await Admin.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid token' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Password updated' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});


const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { verify2faSchema } = require('../schemas/auth.schema');

// @desc    Generate 2FA Secret
// @route   POST /api/auth/2fa/generate
router.post('/2fa/generate', protect, async (req, res) => {
    try {
        const secret = speakeasy.generateSecret({ name: `AssessInventory (${req.user.email})` });

        // Identify user and save temporary secret (or just return it to be verified first)
        // Ideally we save it temporarily, but for simplicity we can return it and save only on verification
        // Better approach: Save it to user but don't enable it yet
        req.user.twoFactorSecret = secret.base32;
        await req.user.save();

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) return res.status(500).json({ success: false, error: 'Error generating QR code' });
            res.json({
                success: true,
                secret: secret.base32,
                qrCode: data_url
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Verify and Enable 2FA
// @route   POST /api/auth/2fa/verify
router.post('/2fa/verify', protect, validateResource(verify2faSchema), async (req, res) => {
    try {
        const { token } = req.body;
        const secret = req.user.twoFactorSecret;

        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            req.user.isTwoFactorEnabled = true;
            await req.user.save();
            res.json({ success: true, message: '2FA enabled successfully' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid token' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
router.post('/2fa/disable', protect, async (req, res) => {
    try {
        req.user.isTwoFactorEnabled = false;
        req.user.twoFactorSecret = undefined;
        await req.user.save();
        res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// @desc    Validate 2FA Token (during login)
// @route   POST /api/auth/2fa/validate
router.post('/2fa/validate', async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await Admin.findById(userId);

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: 'Admin',
                is2FAEnabled: user.isTwoFactorEnabled,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ success: false, error: 'Invalid 2FA token' });
        }

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

module.exports = router;

