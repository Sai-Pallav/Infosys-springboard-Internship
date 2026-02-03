const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../../data');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

router.post('/chat', async (req, res) => {
    const { query, sessionId } = req.body;

    if (!query || !sessionId) {
        return res.status(400).json({ error: "Query and Session ID are required" });
    }

    try {
        let conversation = await Conversation.findOne({ sessionId });
        if (!conversation) {
            conversation = new Conversation({ sessionId, messages: [] });
        }

        const history = conversation.messages.slice(-10);

        const { answer, sources } = await aiService.generateAnswer(query, history);

        conversation.messages.push({ role: 'user', content: query });
        conversation.messages.push({ role: 'assistant', content: answer, sources: sources });
        conversation.lastUpdated = new Date();
        await conversation.save();

        res.json({
            answer,
            sources,
            history: conversation.messages
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`File uploaded to ${req.file.path}`);

    try {
        const result = await aiService.ingestFile(req.file.path, req.file.originalname);

        res.json({
            message: "File uploaded and processed successfully",
            filename: req.file.originalname,
            ingestion: result
        });
    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "File saved but ingestion failed: " + error.message });
    }
});

module.exports = router;
