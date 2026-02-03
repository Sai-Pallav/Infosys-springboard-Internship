const fs = require('fs');
const pdf = require('pdf-parse');
const { pipeline } = require('@xenova/transformers');
const Groq = require('groq-sdk');
const vectorStore = require('./vectorStore');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../../.env' });

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || process.env.GROK_API_KEY
});

const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2';
const LLM_MODEL = 'llama-3.3-70b-versatile';

class AIService {
    constructor() {
        this.embedder = null;
        this.initEmbedder();
    }

    async initEmbedder() {
        if (!this.embedder) {
            console.log("Loading embedding model...");
            this.embedder = await pipeline('feature-extraction', EMBEDDING_MODEL);
            console.log("Embedding model loaded.");
        }
    }

    async getEmbedding(text) {
        await this.initEmbedder();
        const output = await this.embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    async ingestFile(filePath, originalFilename) {
        console.log(`Ingesting file: ${originalFilename}`);

        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
        if (fileSizeInMegabytes > 10) {
            throw new Error("File too large. Maximum size is 10MB.");
        }

        let text = "";

        if (filePath.endsWith('.pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            text = data.text;
        } else if (filePath.endsWith('.txt')) {
            text = fs.readFileSync(filePath, 'utf8');
        } else {
            throw new Error("Unsupported file format");
        }

        const chunks = this.splitText(text, 500, 50);

        console.log(`Embedding ${chunks.length} chunks...`);
        const docs = [];
        for (const chunk of chunks) {
            const embedding = await this.getEmbedding(chunk);
            docs.push({
                id: uuidv4(),
                text: chunk,
                source: originalFilename,
                embedding: embedding,
                timestamp: new Date().toISOString()
            });
        }

        await vectorStore.addDocuments(docs);
        return { chunks: chunks.length };
    }

    splitText(text, chunkSize, chunkOverlap) {
        const chunks = [];
        let start = 0;

        while (start < text.length) {
            let end = start + chunkSize;

            if (end < text.length) {
                const nextSpace = text.indexOf(' ', end);
                if (nextSpace !== -1 && nextSpace - end < 50) {
                    end = nextSpace;
                }
            }

            chunks.push(text.slice(start, end).trim());
            start += chunkSize - chunkOverlap;
        }
        return chunks.filter(c => c.length > 10);
    }

    async generateAnswer(query, history = []) {
        const queryEmbedding = await this.getEmbedding(query);
        const relevantDocs = vectorStore.similaritySearch(queryEmbedding, 5);

        const contextText = relevantDocs.map(d => `Source: ${d.source}\n${d.text}`).join("\n\n");

        const formattedHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
        }));

        const systemPrompt = `You are a helpful and factual assistant. Answer the question based strictly on the provided Context.
If the answer is not in the context, say "I don't know based on the documents provided."
Include citations if possible.

Context:
${contextText}`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...formattedHistory,
            { role: "user", content: query }
        ];

        try {
            const completion = await groq.chat.completions.create({
                messages: messages,
                model: LLM_MODEL,
                temperature: 0.5,
                max_tokens: 1024,
            });

            return {
                answer: completion.choices[0]?.message?.content || "No response generated.",
                sources: [...new Set(relevantDocs.map(d => d.source))]
            };
        } catch (error) {
            console.error("Groq API Error:", error);
            throw new Error("Failed to generate answer from AI");
        }
    }
}

module.exports = new AIService();
