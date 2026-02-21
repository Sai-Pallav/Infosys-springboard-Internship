import os
import sys
import pdfplumber
from pymongo import MongoClient
from config import MONGODB_URI
from embeddings import get_embeddings

client = MongoClient(MONGODB_URI)
db = client['rag_chatbot']
collection = db['vectorStore']

def extract_text(file_path):
    if file_path.endswith('.pdf'):
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        return text
    elif file_path.endswith('.txt'):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    else:
        raise ValueError("Unsupported file format. Only PDF and TXT are supported.")

def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks

def ingest_file(file_path):
    print(f"Ingesting {file_path}...")
    try:
        text = extract_text(file_path)
    except Exception as e:
        print(f"Error reading file: {e}", file=sys.stderr)
        sys.exit(1)

    if not text.strip():
        print("Warning: No text extracted from file.", file=sys.stderr)
        sys.exit(1)

    chunks = chunk_text(text)
    
    try:
        embeddings = get_embeddings(chunks)

    except Exception as e:
        print(f"Embedding generation failed: {e}", file=sys.stderr)
        sys.exit(1)
    
    documents = []
    for i, chunk in enumerate(chunks):
        documents.append({
            "text": chunk,
            "embedding": embeddings[i] if isinstance(embeddings[i], list) else embeddings, 
            "source": os.path.basename(file_path)
        })
    
    if len(documents) > 0 and isinstance(documents[0]['embedding'], float):
        pass

    if documents:
        try:
            collection.insert_many(documents)
            print(f"Successfully stored {len(documents)} chunks from {file_path}")
        except Exception as db_err:
            print(f"Database insertion failed: {db_err}", file=sys.stderr)
            sys.exit(1)
    else:
        print("No chunks to store.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingest.py <file_path>", file=sys.stderr)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)
        
    ingest_file(file_path)