const { spawn } = require('child_process');
const path = require('path');

// Determine paths to python scripts
const PYTHON_SCRIPT_DIR = path.join(__dirname, '../../code_Files');
const INGEST_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'ingest.py');
const RETRIEVAL_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'retrieval.py');
const GENERATION_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'generation.py');

class AIService {
    constructor() {
        console.log("AIService initialized in Hybrid Mode (Python backend).");
    }

    /**
     * Helper to robustly parse JSON from Python stdout.
     * It attempts to find the last valid JSON object in the string.
     */
    parsePythonOutput(output) {
        try {
            // Try direct parse first
            return JSON.parse(output);
        } catch (e) {
            console.warn("Direct JSON parse failed, attempting extraction from:", output);
            // Try to find the last JSON object-like structure
            // This regex matches a structure starting with { and ending with }
            // It's basic but handles simple cases where logs precede JSON
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    // Try to parse the last match (often the result)
                    // If multiple matches, we might want the last one, but match() returns the first usually.
                    // Let's iterate if needed, but for now take the found block.
                    // Actually, let's find the last occurrence of '}' and the matching '{'
                    const lastClose = output.lastIndexOf('}');
                    if (lastClose !== -1) {
                        const candidate = output.substring(output.indexOf('{'), lastClose + 1);
                        return JSON.parse(candidate);
                    }
                } catch (e2) {
                    console.error("Extraction parse failed:", e2);
                }
            }
            throw new Error(`Failed to parse Python output: ${output}`);
        }
    }

    /**
     * Helper to run a python script and capture stdout
     */
    async runPythonScript(scriptPath, args = [], inputJson = null) {
        return new Promise((resolve, reject) => {
            // Use python3 on Render/Linux
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
            const process = spawn(pythonCommand, [scriptPath, ...args]);

            // Timeout to prevent hanging (45 seconds)
            const timeout = setTimeout(() => {
                process.kill();
                reject(new Error(`Python script timed out after 45 seconds: ${scriptPath}`));
            }, 45000);

            let stdoutData = "";
            let stderrData = "";

            process.stdout.on('data', (data) => {
                stdoutData += data.toString();
            });

            process.stderr.on('data', (data) => {
                const msg = data.toString();
                stderrData += msg;
                console.error(`[Python Log]: ${msg}`);
            });

            process.on('error', (err) => {
                clearTimeout(timeout);
                console.error(`[Python Spawn Error]: ${err.message}`);
                reject(err);
            });

            process.on('close', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    console.error(`Python script error (${scriptPath}):`, stderrData);
                    reject(new Error(`Script exited with code ${code}: ${stderrData}`));
                } else {
                    resolve(stdoutData.trim());
                }
            });

            if (inputJson) {
                process.stdin.write(JSON.stringify(inputJson));
                process.stdin.end();
            }
        });
    }

    async ingestFile(filePath, originalFilename) {
        console.log(`Ingesting file via Python: ${filePath}`);
        try {
            // Call ingest.py
            const output = await this.runPythonScript(INGEST_SCRIPT, [filePath]);
            console.log("Ingest output:", output);
            return { message: "Ingestion complete" };
        } catch (error) {
            console.error("Ingestion failed:", error);
            throw error;
        }
    }

    async generateAnswer(query, history = []) {
        console.log(`Generating answer for: "${query}"`);
        try {
            // 1. Retrieve relevant docs using retrieval.py
            // Pass the query string directly as an argument, NOT as a JSON array
            const retrievalOutput = await this.runPythonScript(RETRIEVAL_SCRIPT, [query]);
            let retrievedDocs = [];
            try {
                // Ensure we parse only the JSON part if there's extra logging
                // For now assuming script only prints JSON to stdout
                retrievedDocs = this.parsePythonOutput(retrievalOutput);
                if (retrievedDocs.error) {
                    throw new Error(retrievedDocs.error);
                }
            } catch (e) {
                console.error("Failed to parse retrieval output:", retrievalOutput);
                throw e;
            }

            // 2. Generate answer using generation.py
            const inputPayload = {
                query: query,
                retrieved_docs: retrievedDocs,
                history: history
            };

            const generationOutput = await this.runPythonScript(GENERATION_SCRIPT, [], inputPayload);

            let result = {};
            try {
                result = this.parsePythonOutput(generationOutput);
                if (result.error) throw new Error(result.error);
            } catch (e) {
                console.error("Failed to parse generation output:", generationOutput);
                throw e;
            }

            return {
                answer: result.answer,
                sources: result.sources || []
            };

        } catch (error) {
            console.error("Generate Answer failed:", error);
            throw new Error("Failed to generate answer via Python backend.");
        }
    }
}

module.exports = new AIService();

