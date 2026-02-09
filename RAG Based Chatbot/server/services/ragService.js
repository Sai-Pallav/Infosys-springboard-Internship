const { spawn } = require('child_process');
const path = require('path');

class RagService {
    async generateAnswer(query, history = []) {
        console.log("[RAG] Calling Python Generation Script...");

        return new Promise((resolve, reject) => {
            // Path to python script
            const pythonScriptPath = path.join(__dirname, '../../code_files/generation.py');

            // Spawn Python process
            const pythonProcess = spawn('python', [pythonScriptPath]);

            let outputData = "";
            let errorData = "";

            // Send data to Python via functions stdin
            const inputPayload = JSON.stringify({ query, context: "" }); // Context retrieval handled in Python if extended
            pythonProcess.stdin.write(inputPayload);
            pythonProcess.stdin.end();

            // Collect output
            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python script exited with code ${code}: ${errorData}`);
                    // Fallback if Python fails
                    resolve({
                        answer: "I'm having trouble connecting to my Python brain right now. Please try again.",
                        sources: []
                    });
                } else {
                    try {
                        const result = JSON.parse(outputData);
                        resolve({
                            answer: result.answer || "No answer generated.",
                            sources: result.sources || []
                        });
                    } catch (e) {
                        console.error("Failed to parse Python output:", e);
                        resolve({ answer: "Error processing response.", sources: [] });
                    }
                }
            });
        });
    }
}

module.exports = new RagService();
