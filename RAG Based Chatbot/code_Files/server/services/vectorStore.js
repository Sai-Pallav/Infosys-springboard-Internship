const fs = require('fs');
const path = require('path');

class VectorStore {
    constructor(persistPath) {
        this.documents = [];

        // Ensure data directory exists!
        const AUTO_DATA_DIR = path.join(__dirname, '../../data');
        if (!fs.existsSync(AUTO_DATA_DIR)) {
            try {
                fs.mkdirSync(AUTO_DATA_DIR, { recursive: true });
                console.log("✅ Created missing data directory:", AUTO_DATA_DIR);
            } catch (err) {
                console.error("❌ Failed to create data directory:", err);
            }
        }

        this.persistPath = persistPath || path.join(AUTO_DATA_DIR, 'vector_store.json');
        this.load();
    }

    async addDocuments(docs) {
        this.documents.push(...docs);
        await this.save();
    }

    similaritySearch(queryEmbedding, k = 5) {
        if (this.documents.length === 0) return [];

        const scores = this.documents.map(doc => {
            return {
                doc: doc,
                score: this.cosineSimilarity(queryEmbedding, doc.embedding)
            };
        });

        scores.sort((a, b) => b.score - a.score);

        return scores.slice(0, k).map(item => item.doc);
    }

    cosineSimilarity(vecA, vecB) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async save() {
        try {
            const data = JSON.stringify(this.documents);
            await fs.promises.writeFile(this.persistPath, data);
        } catch (error) {
            console.error("Error saving vector store:", error);
        }
    }

    load() {
        if (fs.existsSync(this.persistPath)) {
            try {
                const data = fs.readFileSync(this.persistPath, 'utf8');
                this.documents = JSON.parse(data);
                console.log(`Loaded ${this.documents.length} documents into vector store.`);
            } catch (error) {
                console.error("Error loading vector store:", error);
                this.documents = [];
            }
        }
    }
}

module.exports = new VectorStore();
