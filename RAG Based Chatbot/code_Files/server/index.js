const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rag_chatbot';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.use('/api', apiRoutes);

app.use(express.static(path.join(__dirname, 'public')));


const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.get('/', (req, res) => {
    res.send('RAG Chatbot Node.js Server Running');
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
