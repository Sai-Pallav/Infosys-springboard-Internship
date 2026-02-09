import os
import pdfplumber
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from config import MONGODB_URI, EMBEDDING_MODEL

# Initialize MongoDB
client = MongoClient(MONGODB_URI)
db = client['rag_chatbot']
collection = db['documents']

# Initialize Model
model = SentenceTransformer(EMBEDDING_MODEL)

def extract_text_from_pdf(pdf_path):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

def chunk_text(text, chunk_size=500, overlap=50):
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunks.append(text[i:i + chunk_size])
    return chunks

def ingest_file(file_path):
    print(f"Ingesting {file_path}...")
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    
    # Generate Embeddings
    embeddings = model.encode(chunks)
    
    # Store in MongoDB
    documents = []
    for i, chunk in enumerate(chunks):
        documents.append({
            "text": chunk,
            "embedding": embeddings[i].tolist(),
            "source": os.path.basename(file_path)
        })
    
    if documents:
        collection.insert_many(documents)
        print(f"Successfully stored {len(documents)} chunks from {file_path}")

if __name__ == "__main__":
    # Example usage: python ingest.py
    # You can add argument parsing here to ingest specific files
    pass
