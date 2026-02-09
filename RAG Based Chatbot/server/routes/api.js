const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const ragService = require('../services/ragService');

// POST /api/chat
// Description: Main endpoint for RAG chatbot
// Input: { query: string, sessionId: string }
// Output: { answer: string, sources: string[], history: object[] }
router.post('/chat', async (req, res) => {
    const { query, sessionId } = req.body;

    if (!query || !sessionId) {
        return res.status(400).json({ error: "Query and Session ID are required" });
    }

    try {
        // 1. Retrieve or Create Conversation
        let conversation = await Conversation.findOne({ sessionId });
        if (!conversation) {
            conversation = new Conversation({ sessionId, messages: [] });
        }

        // 2. Get history (last 10 messages)
        const history = conversation.messages.slice(-10);

        // 3. Generate Answer (RAG Service handles retrieval + AI + Fallback)
        const { answer, sources } = await ragService.generateAnswer(query, history);

        // 4. Save to Database
        conversation.messages.push({ role: 'user', content: query });
        conversation.messages.push({ role: 'assistant', content: answer, sources: sources });
        conversation.lastUpdated = new Date();
        await conversation.save();

        // 5. Send Response
        res.json({
            answer,
            sources,
            history: conversation.messages
        });

    } catch (error) {
        console.error("Error in chat route:", error);
        // Secure error message (don't leak stack trace to client)
        res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }
});

module.exports = router;
