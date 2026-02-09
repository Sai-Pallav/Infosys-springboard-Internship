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

def generate_answer(query):
    """
    Generates an answer using Groq API based on the retrieved context.
    """
    try:
        # 1. Retrieve relevant chunks
        all_chunks = get_all_chunks()
        relevant_chunks = retrieve_chunks(query, all_chunks)
        
        # 2. Formulate Context
        if not relevant_chunks:
            context = "No relevant context found."
            sources = []
        else:
            context = "\n\n".join([chunk.get('text', '') for chunk in relevant_chunks])
            sources = list(set([chunk.get('source', 'Unknown') for chunk in relevant_chunks]))

        # 3. Generate Answer
        system_prompt = f"You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know.\n\nContext:\n{context}"
        
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            model=LLM_MODEL,
        )
        
        return completion.choices[0].message.content, sources
        
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
        
        answer, sources = generate_answer(query)
        
        print(json.dumps({"answer": answer, "sources": sources}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
