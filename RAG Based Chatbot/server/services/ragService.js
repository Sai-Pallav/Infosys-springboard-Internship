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
                        // Robust JSON parsing: Find the last valid JSON line
                        // This handles cases where Python might print warnings/debug info before the JSON
                        const lines = outputData.trim().split('\n');
                        let result = null;

                        // Try to parse lines from end to start until a valid JSON is found
                        for (let i = lines.length - 1; i >= 0; i--) {
                            try {
                                const parsed = JSON.parse(lines[i]);
                                if (parsed && (parsed.answer || parsed.error || parsed.message)) {
                                    result = parsed;
                                    break;
                                }
                            } catch (e) {
                                // Continue if line is not JSON
                            }
                        }

                        if (!result) {
                            // If no valid JSON found line-by-line, try parsing the whole output (stripped of potential headers)
                            // Or fallback to error
                            try {
                                result = JSON.parse(outputData);
                            } catch (e) {
                                throw new Error("No valid JSON found in Python output");
                            }
                        }

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
