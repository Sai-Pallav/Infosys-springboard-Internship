const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: '../.env' }); // Load from root .env if running locally

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for initial setup/testing. Ideally restrict to Firebase domain later.
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

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

app.get('/', (req, res) => {
    res.send('RAG Chatbot Backend is Running. Use POST /api/chat to interact.');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
