const express = require('express');
const router = express.Router();
const ragService = require('../services/ragService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Conversation = require('../models/Conversation');

// API Status
router.get('/status', (req, res) => {
    res.json({ status: 'API is running' });
});

// Chat Endpoint
router.post('/chat', async (req, res) => {
    try {
        const { query, sessionId } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        // Input Validation: Prevent huge payloads
        if (query.length > 2000) {
            return res.status(400).json({ error: 'Query too long. Max 2000 characters.' });
        }

        // 1. Retrieve or Create Conversation
        let conversation;
        if (sessionId) {
            conversation = await Conversation.findOne({ sessionId });
        }

        if (!conversation) {
            conversation = new Conversation({
                sessionId: sessionId || 'anonymous-' + Date.now(),
                messages: []
            });
        }

        // 2. Get history (last 10 messages) for context
        const history = conversation.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 3. Call RAG Service
        const result = await ragService.generateAnswer(query, history);

        // 4. Save to Database
        conversation.messages.push({ role: 'user', content: query });
        conversation.messages.push({
            role: 'assistant',
            content: result.answer,
            sources: result.sources || []
        });
        conversation.lastUpdated = new Date();
        await conversation.save();

        res.json(result);
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- File Upload Setup ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    console.log(`[Upload] Processing file: ${filePath}`);

    // Spawn Python ingestion script
    // Note: Assuming we are in server/ directory when running node, 
    // code_files is in ../code_files relative to server/
    const pythonScriptPath = path.join(__dirname, '../../code_Files/ingest.py');

    // Use python3 (standard for Render/Linux) or custom path
    const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const pythonProcess = spawn(pythonCommand, [pythonScriptPath, filePath]);

    // Add a timeout for uploads (60 seconds)
    const timeout = setTimeout(() => {
        pythonProcess.kill();
        console.error(`[Upload] Python script timed out for file: ${filePath}`);
    }, 60000);

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[Ingest Spawn Error]: ${err.message}`);
        errorOutput += `\nSpawn Error: ${err.message}`;
    });

    pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        const exitMessage = code === 0 ? "success" : `failed with code ${code}`;
        console.log(`[Upload] Python process finished with: ${exitMessage}`);

        // Clean up file after processing
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[Upload] Cleaned up file: ${filePath}`);
            }
        } catch (cleanupErr) {
            console.error(`[Upload] Failed to delete file: ${filePath}`, cleanupErr);
        }

        if (code === 0) {
            res.json({ message: "File processed successfully", details: output });
        } else {
            console.error(`[Upload Failed] Code: ${code}, Error: ${errorOutput}`);
            res.status(500).json({
                error: "Ingestion failed",
                details: errorOutput || "Unknown python script error",
                exitCode: code
            });
        }
    });
});

module.exports = router;
