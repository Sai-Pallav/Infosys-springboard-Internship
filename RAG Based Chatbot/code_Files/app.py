from flask import Flask, render_template, request, jsonify
import numpy as np
from embeddings import embed_texts
from vector_store import load_faiss_index
from generation import generate_answer
from ingest import ingest
import os

app = Flask(__name__)

# Configure Upload Folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "data")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

print("Loading FAISS index...")
try:
    index, stored_chunks, metadata = load_faiss_index()
    print("FAISS index loaded successfully.")
except Exception as e:
    print(f"Error loading FAISS index: {e}")
    index = None
    stored_chunks = []
    metadata = []

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)
        
        try:
            # Trigger Ingestion
            print(f"File saved to {filepath}. Triggering ingestion...")
            status = ingest()
            
            # Reload Index in Memory (Important!)
            global index, stored_chunks, metadata
            index, stored_chunks, metadata = load_faiss_index()
            
            return jsonify({
                "message": "File uploaded and processed successfully", 
                "ingestion_status": status
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Ingestion failed: {str(e)}"}), 500

# In-memory session history (for demonstration purposes)
# Structure: { "session_id": [ {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."} ] }
SESSION_HISTORY = {}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/get_response', methods=['POST'])
def get_response():
    if not index:
        return jsonify({"error": "System not initialized"}), 500
    
    data = request.json
    query = data.get('query')
    session_id = data.get('session_id')

    if not query:
        return jsonify({"error": "No query provided"}), 400
    
    # Initialize history for new session
    if session_id and session_id not in SESSION_HISTORY:
        SESSION_HISTORY[session_id] = []
    
    # Get history for this session (default to empty list if no session_id)
    history = SESSION_HISTORY.get(session_id, [])

    try:
        # Pass history to generation logic
        result = generate_answer(query, history)
        
        # update history if session_id provided
        if session_id:
            SESSION_HISTORY[session_id].append({"role": "user", "content": query})
            SESSION_HISTORY[session_id].append({"role": "assistant", "content": result["answer"]})
            
            # Keep history manageable (last 10 turns)
            if len(SESSION_HISTORY[session_id]) > 20:
                SESSION_HISTORY[session_id] = SESSION_HISTORY[session_id][-20:]

        return jsonify(result)
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
