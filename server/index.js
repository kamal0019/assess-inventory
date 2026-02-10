require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// Trust Vercel Proxy (Required for Rate Limiting)
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    validate: { xForwardedForHeader: false } // Disable strict header validation for local dev
});
app.use(limiter);

// Prevent Parameter Pollution
app.use(hpp());

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL from env
    credentials: true // Allow cookies
}));
app.use(express.json());

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// Data Sanitization against XSS
// Data Sanitization against XSS
app.use(xss());

// Root Route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Routes (Placeholders for now)
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/outliners', require('./routes/outlinerRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/bills', require('./routes/billRoutes')); // Added Bill Routes
app.use('/api/auth', require('./routes/authRoutes'));

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
