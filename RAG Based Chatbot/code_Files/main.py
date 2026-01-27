import numpy as np
from loaders import load_documents
from splitter import split_documents
from embeddings import embed_texts
from vector_store import save_faiss_index, load_faiss_index

def run_tests():
    print("Starting Milestone-1 testing...")
    docs = load_documents()
    print("\n[TEST 2] Document Ingestion")
    print("Documents loaded:", len(docs))
    assert len(docs) > 0, "❌ No documents loaded"
    print("Sample content:")
    print(docs[0].page_content[:300])
    chunks = split_documents(docs)
    print("\n[TEST 3] Chunking")
    print("Chunks created:", len(chunks))
    assert len(chunks) > 0, "❌ Chunking failed"
    print("\nChunk 1:")
    print(chunks[0].page_content[:200])
    if len(chunks) > 1:
        print("\nChunk 2:")
        print(chunks[1].page_content[:200])
    texts = [chunk.page_content for chunk in chunks]
    embeddings = embed_texts(texts)
    print("\n[TEST 4] Embeddings")
    print("Embeddings generated:", len(embeddings))
    print("Embedding dimension:", len(embeddings[0]))
    assert len(embeddings) == len(chunks), "❌ Embedding mismatch"
    print("\n🔢 Sample embedding (first 10 values):")
    print(embeddings[0][:10])
    embedding_matrix = np.array(embeddings).astype("float32")
    save_faiss_index(embedding_matrix, chunks)
    print("\n[TEST 5] FAISS Index Saved to Disk")
    index, stored_chunks, metadata = load_faiss_index()
    print("\n[TEST 6] FAISS Index Loaded from Disk")
    print("Vectors stored in FAISS:", index.ntotal)
    assert index.ntotal == len(stored_chunks), "❌ FAISS load mismatch"
    query = "student pursuing data science"
    query_embedding = embed_texts([query])
    query_embedding = np.array(query_embedding).astype("float32")
    D, I = index.search(query_embedding, k=1)
    idx = I[0][0]
    print("\nSemantic Search Query:", query)
    print("Top matching stored chunk:")
    print(stored_chunks[idx].page_content[:300])
    print("\nMetadata:")
    print(metadata[idx])

if __name__ == "__main__":
    run_tests()