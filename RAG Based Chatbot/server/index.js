const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


app.use(helmet({
    contentSecurityPolicy: false,
}));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);


const allowedOrigins = [
    'https://rag-based-chatbot-eacf7.web.app',
    'https://rag-based-chatbot-8huy.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://great-phones-invite.loca.lt'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.onrender.com') ||
            origin.endsWith('.web.app') ||
            origin.endsWith('.firebaseapp.com');

        if (!isAllowed) {
            console.warn(`CORS blocked for origin: ${origin}`);
            return callback(new Error('CORS Policy violation'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));


if (!MONGODB_URI) {
    console.warn("⚠️  WARNING: MONGODB_URI is not set!");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB');
        })
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}


// Diagnostic Middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
        console.log(`[Diagnostic] ${req.method} ${req.path}`);
    }
    next();
});

app.use('/api', apiRoutes);


app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP',
        mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});


app.use(express.static(path.join(__dirname, '../client/dist')));


app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});


const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server successfully started!`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🏠 Mode: ${process.env.NODE_ENV || 'development'}`);
});


server.on('error', (error) => {
    console.error('❌ Server Error:', error);
});


process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🌩️ Unhandled Rejection at:', promise, 'reason:', reason);
});
