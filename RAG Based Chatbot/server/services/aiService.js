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
            // 1. Try direct parse first (cleanest case)
            return JSON.parse(output);
        } catch (e) {
            console.warn("Direct JSON parse failed, attempting extraction from:", output);

            // 2. Scan from the end of the string to find the last valid JSON object
            // This is useful because Python scripts often print logs before the final JSON result
            const lines = output.trim().split('\n');
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                // Optimization: Only try to parse if it looks like an object
                if (line.startsWith('{') && line.endsWith('}')) {
                    try {
                        return JSON.parse(line);
                    } catch (lineError) {
                        // Continue searching
                    }
                }
            }

            // 3. Last Desperate Resort: Regex extraction of the last {...} block
            // This handles cases where JSON is embedded in a line or spans multiple lines
            try {
                const lastOpen = output.lastIndexOf('{');
                const lastClose = output.lastIndexOf('}');
                if (lastOpen !== -1 && lastClose !== -1 && lastClose > lastOpen) {
                    const candidate = output.substring(lastOpen, lastClose + 1);
                    return JSON.parse(candidate);
                }
            } catch (regexError) {
                console.error("Regex extraction failed:", regexError);
            }

            throw new Error(`Failed to parse Python output. No valid JSON found in: ${output.substring(0, 100)}...`);
        }
    }

    /**
     * Helper to run a python script and capture stdout
     */
    async runPythonScript(scriptPath, args = [], inputJson = null) {
        return new Promise((resolve, reject) => {
            // Use python3 on Render/Linux or custom path
            const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
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

