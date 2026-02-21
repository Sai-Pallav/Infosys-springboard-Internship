const { spawn } = require('child_process');
const path = require('path');


const PYTHON_SCRIPT_DIR = path.join(__dirname, '../python_engine');
const INGEST_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'ingest.py');
const RETRIEVAL_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'retrieval.py');
const GENERATION_SCRIPT = path.join(PYTHON_SCRIPT_DIR, 'generation.py');

class AIService {
    constructor() {
        console.log("AIService initialized in Hybrid Mode (Python backend).");
    }


    parsePythonOutput(output) {
        try {
            return JSON.parse(output);
        } catch (e) {
            console.error("Direct JSON parse failed:", output);
            throw new Error(`Failed to parse Python output. No valid JSON found in: ${output.substring(0, 100)}...`);
        }
    }


    async runPythonScript(scriptPath, args = [], inputJson = null) {
        return new Promise((resolve, reject) => {

            const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
            const process = spawn(pythonCommand, [scriptPath, ...args]);


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

            const output = await this.runPythonScript(INGEST_SCRIPT, [filePath]);
            console.log("Ingest output:", output);
            return { message: "Ingestion complete" };
        } catch (error) {
            console.error("Ingestion failed:", error);
            throw error;
        }
    }

    // generateAnswer is no longer used (replaced by generateAnswerStream)

    generateAnswerStream(query, history = [], settings = {}, onChunk, onMetadata, onError) {
        console.log(`Generating streaming answer for: "${query}"`);

        const inputPayload = {
            query: query,
            history: history,
            model: settings.model,
            system_prompt: settings.systemPrompt,
            active_documents: settings.activeDocuments || []
        };

        const pythonCommand = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
        const child = spawn(pythonCommand, [GENERATION_SCRIPT]);

        const readline = require('readline');
        const rl = readline.createInterface({ input: child.stdout });

        rl.on('line', (line) => {
            if (!line.trim()) return;
            try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'chunk') {
                    onChunk(parsed.text);
                } else if (parsed.type === 'metadata') {
                    onMetadata(parsed);
                } else if (parsed.type === 'error') {
                    onError(new Error(parsed.error));
                }
            } catch (e) {
                console.log("[Python Stream Non-JSON]:", line);
            }
        });

        child.stderr.on('data', (data) => {
            console.error(`[Python Log (Stream)]: ${data.toString()}`);
        });

        child.on('error', (err) => {
            onError(err);
        });

        child.stdin.write(JSON.stringify(inputPayload));
        child.stdin.end();
    }
}

module.exports = new AIService();

