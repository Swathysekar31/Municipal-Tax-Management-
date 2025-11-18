const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const app = express();
connectDB();

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Test SMS route
app.get('/api/test-sms', async (req, res) => {
    try {
        const { sendSMS } = require('./utils/twilioService');
        const result = await sendSMS('6369966512', 'Test SMS from Municipal Tax System - Your system is working!');
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test Twilio SMS
app.get('/api/test-twilio', async (req, res) => {
    try {
        const { sendSMS } = require('./utils/twilioService');
        const result = await sendSMS('6369966512', 'Test SMS from Municipal Tax System via Twilio - Working!');
        res.json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message,
            note: 'Make sure your number is verified in Twilio console'
        });
    }
});

// Debug routes endpoint
app.get('/api/debug-routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json({ routes });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Test endpoint: http://localhost:${PORT}/api/test`);
    console.log(`🔍 Debug routes: http://localhost:${PORT}/api/debug-routes`);
    console.log(`📱 SMS test: http://localhost:${PORT}/api/test-sms`);
});