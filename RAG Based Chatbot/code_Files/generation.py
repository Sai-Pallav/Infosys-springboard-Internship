import sys
import json
import os
from groq import Groq
from pymongo import MongoClient
from config import GROQ_API_KEY, LLM_MODEL, MONGODB_URI
from retrieval import retrieve_chunks

# Initialize Groq Client
client = Groq(api_key=GROQ_API_KEY)

# Initialize MongoDB Client
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client['rag_chatbot']
collection = db['documents']

def get_all_chunks():
    """Fetches all documents from MongoDB to perform semantic search."""
    # Note: In a production scale, you would use MongoDB Atlas Vector Search 
    # instead of fetching all chunks to memory. For this MVP, in-memory search is fine.
    return list(collection.find({}))

def generate_answer(query, history=[]):
    """
    Generates an answer using Groq API based on the retrieved context and chat history.
    """
    try:
        # 1. Retrieve relevant chunks
        relevant_chunks = retrieve_chunks(query)
        
        # 2. Formulate Context
        if not relevant_chunks:
            context_text = "No relevant documents found. Answer based on general knowledge."
            sources = []
        else:
            context_text = "\n\n".join([chunk.get('text', '') for chunk in relevant_chunks])
            sources = list(set([chunk.get('source', 'Unknown') for chunk in relevant_chunks]))

        # 3. Construct Messages with History
        # System Prompt
        system_msg = {
            "role": "system", 
            "content": f"You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say so, but you can use your general knowledge if helpful.\n\nContext:\n{context_text}"
        }
        
        # Build message chain
        messages = [system_msg]
        
        # Add history (last 5 turns to save tokens)
        for msg in history[-10:]: 
            role = "user" if msg.get("role") == "user" else "assistant"
            content = msg.get("content", "")
            if content:
                messages.append({"role": role, "content": content})
        
        # Add current query
        messages.append({"role": "user", "content": query})

        # 4. Generate Answer with Retry Logic
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                completion = client.chat.completions.create(
                    messages=messages,
                    model=LLM_MODEL,
                )
                return completion.choices[0].message.content, sources
                
            except Exception as api_err:
                if attempt < max_retries - 1:
                    import time
                    print(f"API Error (Attempt {attempt+1}/{max_retries}): {str(api_err)}. Retrying in {retry_delay}s...", file=sys.stderr)
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    raise api_err
        
    except Exception as e:
        return f"Error generating answer: {str(e)}", []

if __name__ == "__main__":
    # CLI Interface for Node.js
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        query = data.get("query")
        history = data.get("history", []) # Get history or empty list
        
        answer, sources = generate_answer(query, history)
        
        print(json.dumps({"answer": answer, "sources": sources}))
        
    except Exception as e:
        # Use str(e) to capture the error message safely
        error_msg = str(e)
        # Print JSON error to stdout so Node.js can parse it
        print(json.dumps({"error": error_msg}))
        # Exit with 0 to allow Node.js to read stdout, or 1 if you handle it in Node
        # Using 1 here, but ensure Node reads stdout before checking exit code
        sys.exit(1)
