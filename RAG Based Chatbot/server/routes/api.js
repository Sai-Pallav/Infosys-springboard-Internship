const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ragService = require('../services/aiService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const Conversation = require('../models/Conversation');

// API Status
router.get('/status', (req, res) => {
    res.json({ status: 'API is running', timestamp: new Date() });
});

// Diagnostic Route
router.get('/test', (req, res) => {
    res.json({ message: 'Router is matching correctly' });
});

// Get recent sessions
router.get('/sessions', async (req, res) => {
    try {
        console.log("[API] Fetching sessions...");
        const conversations = await Conversation.find({}, 'sessionId title lastUpdated')
            .sort({ lastUpdated: -1 })
            .limit(20);
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// Get specific session
router.get('/sessions/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ sessionId: req.params.id });
        if (!conversation) return res.status(404).json({ error: "Session not found" });
        res.json(conversation);
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ error: "Failed to fetch session" });
    }
});

// Get specific session publicly (read-only for shared links)
router.get('/public/sessions/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ sessionId: req.params.id });
        if (!conversation) return res.status(404).json({ error: "Session not found" });
        res.json(conversation);
    } catch (error) {
        console.error("Error fetching public session:", error);
        res.status(500).json({ error: "Failed to fetch public session" });
    }
});

// Clone session (Forking feature)
router.post('/clone', async (req, res) => {
    try {
        const { sessionId, messages, title } = req.body;
        if (!sessionId || !messages) return res.status(400).json({ error: "Missing required clone fields" });

        const newConversation = new Conversation({
            sessionId: sessionId,
            title: title || 'Forked Conversation',
            messages: messages,
            lastUpdated: new Date()
        });

        await newConversation.save();
        res.json({ success: true, sessionId });
    } catch (error) {
        console.error("Error cloning session:", error);
        res.status(500).json({ error: "Failed to clone session" });
    }
});

// Delete specific session
router.delete('/sessions/:id', async (req, res) => {
    try {
        const result = await Conversation.deleteOne({ sessionId: req.params.id });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Session not found" });
        res.json({ message: "Session deleted successfully" });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ error: "Failed to delete session" });
    }
});

// Get unique documents
router.get('/documents', async (req, res) => {
    try {
        // We query MongoDB vector database for unique 'source' metadata
        const collection = mongoose.connection.collection('vectorStore');
        const uniqueDocs = await collection.distinct('source');
        res.json(uniqueDocs);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

// Delete document chunks
router.delete('/documents/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const collection = mongoose.connection.collection('vectorStore');
        const result = await collection.deleteMany({ source: filename });
        res.json({ message: `Deleted ${result.deletedCount} chunks for ${filename}` });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Failed to delete document" });
    }
});

// Streaming Chat Endpoint
router.post('/chat', async (req, res) => {
    try {
        const { query, sessionId, model, systemPrompt, activeDocuments } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        if (query.length > 2000) {
            return res.status(400).json({ error: 'Query too long. Max 2000 characters.' });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let conversation;
        if (sessionId) {
            conversation = await Conversation.findOne({ sessionId });
        }

        if (!conversation) {
            // Generate title from first 50 chars of query
            const title = query.length > 50 ? query.substring(0, 47) + '...' : query;
            conversation = new Conversation({
                sessionId: sessionId || 'anonymous-' + Date.now(),
                title: title,
                messages: []
            });
        }

        // If it was a default title but we have 0 messages (maybe forced sessionId), update title
        if (conversation.messages.length === 0 && (!conversation.title || conversation.title === 'New Conversation')) {
            conversation.title = query.length > 50 ? query.substring(0, 47) + '...' : query;
        }

        const history = conversation.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        ragService.generateAnswerStream(query, history, { model, systemPrompt, activeDocuments },
            (text) => {
                res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
            },
            async (metadata) => {
                // Save to Database
                conversation.messages.push({ role: 'user', content: query });
                conversation.messages.push({
                    role: 'assistant',
                    content: metadata.answer,
                    sources: metadata.sources || [],
                    followups: metadata.followups || []
                });
                conversation.lastUpdated = new Date();
                await conversation.save();

                res.write(`data: ${JSON.stringify({ type: 'metadata', sources: metadata.sources || [], followups: metadata.followups || [] })}\n\n`);
                res.end();
            },
            (error) => {
                console.error("Stream Error:", error);
                res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
                res.end();
            }
        );

    } catch (error) {
        console.error("Chat Request Error:", error);
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
    // Note: Assuming we are in server/ directory when running node
    const pythonScriptPath = path.join(__dirname, '../python_engine/ingest.py');

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

        if (code !== 0) {
            console.error(`[Upload Details] Stderr: ${errorOutput}`);
        }

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

// Ingest Web URL Endpoint
router.post('/ingest-url', async (req, res) => {
    const { url, isDeep } = req.body;
    if (!url) {
        return res.status(400).json({ error: "No URL provided" });
    }

    console.log(`[URL Ingest] Processing URL: ${url} (Deep: ${isDeep})`);

    const pythonScriptPath = path.join(__dirname, '../python_engine/scrape.py');
    const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

    const args = [pythonScriptPath, url];
    if (isDeep) args.push('--deep');

    const pythonProcess = spawn(pythonCommand, args);

    const timeout = setTimeout(() => {
        pythonProcess.kill();
        console.error(`[URL Ingest] Python script timed out for URL: ${url}`);
    }, 300000); // 5 minute timeout for large embeddings

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
        console.error(`[URL Ingest Spawn Error]: ${err.message}`);
        errorOutput += `\nSpawn Error: ${err.message}`;
    });

    pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        const exitMessage = code === 0 ? "success" : `failed with code ${code}`;
        console.log(`[URL Ingest] Python process finished with: ${exitMessage}`);

        if (code !== 0) {
            console.error(`[URL Ingest Details] Stderr: ${errorOutput}`);
        }

        if (code === 0) {
            try {
                const parsedOutput = JSON.parse(output.trim());
                res.json({ message: parsedOutput.message || "URL processed successfully", details: parsedOutput });
            } catch (e) {
                res.json({ message: "URL processed successfully, but output parsing failed", details: output });
            }
        } else {
            console.error(`[URL Ingest Failed] Code: ${code}, Error: ${errorOutput}`);
            res.status(500).json({
                error: "URL Ingestion failed",
                details: errorOutput || "Unknown python script error",
                exitCode: code
            });
        }
    });
});

module.exports = router;
