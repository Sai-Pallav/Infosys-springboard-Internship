const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // Load from root .env if running locally

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// 2. CORS Configuration
const allowedOrigins = [
    'https://rag-based-chatbot-eacf7.web.app',
    'https://rag-backend-hybrid.onrender.com',
    'http://localhost:5000',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200 // For older browsers (IE11, various SmartTVs)
}));

// 3. Rate Limiting (Limit to 100 requests per 15 minutes)
app.use(express.json({ limit: '10mb' })); // Limit JSON body size

// MongoDB Connection
if (!MONGODB_URI) {
    console.warn("⚠️  WARNING: MONGODB_URI is not set!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
        })
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// Routes
app.use('/api', apiRoutes);

// Health Check Endpoint (Vital for Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Catch-all route to serve index.html for any non-API request
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server successfully started!`);
    console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
    console.log(`🏠 Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server Error:', error);
});

// Watch for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🌩️ Unhandled Rejection at:', promise, 'reason:', reason);
});
