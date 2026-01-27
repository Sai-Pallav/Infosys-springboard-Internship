import numpy as np
from loaders import load_documents
from splitter import split_documents
from embeddings import embed_texts
from vector_store import save_faiss_index

def ingest():
    print("Starting document ingestion...")
    docs = load_documents()
    print(f"Loaded {len(docs)} documents.")
    
    if not docs:
        print("No documents found in 'data/' folder.")
        return {"success": False, "message": "No documents found", "count": 0}

    chunks = split_documents(docs)
    print(f"Created {len(chunks)} chunks.")
    
    print("Generating embeddings...")
    texts = [chunk.page_content for chunk in chunks]
    embeddings = embed_texts(texts)
    
    print("Saving FAISS index...")
    embedding_matrix = np.array(embeddings).astype("float32")
    save_faiss_index(embedding_matrix, chunks)
    print("✅ Ingestion complete. Index saved to 'storage/'.")
    
    return {
        "success": True, 
        "message": "Ingestion complete", 
        "docs_count": len(docs),
        "chunks_count": len(chunks)
    }

if __name__ == "__main__":
    ingest()