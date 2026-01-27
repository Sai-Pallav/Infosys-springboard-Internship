import numpy as np
from vector_store import load_faiss_index
from embeddings import embed_texts

def retrieve_chunks(query: str, k: int = 5):
    """
    Retrieves the top-k most relevant chunks for a given query.
    
    Args:
        query (str): The search query.
        k (int): Number of chunks to retrieve.

    Returns:
        List[dict]: A list of dictionaries containing:
                    - text
                    - source
                    - chunk_id
                    - similarity_score (L2 distance, lower is better)
    """
    query_embeddings = embed_texts([query])
    if len(query_embeddings) == 0:
        return []
        
    query_embedding = query_embeddings[0]
    
    index, chunks, metadata_list = load_faiss_index()
    
    query_vector = np.array([query_embedding]).astype("float32")
    
    distances, indices = index.search(query_vector, k)
    
    results = []
    
    
    found_indices = indices[0]
    found_distances = distances[0]
    
    for rank, idx in enumerate(found_indices):
        if idx == -1: 
            continue 
        
        chunk = chunks[idx]
        score = found_distances[rank]
        
        meta = chunk.metadata if hasattr(chunk, 'metadata') else {}
        if not meta and idx < len(metadata_list):
            meta = metadata_list[idx]
            
        source = meta.get("source", "Unknown") if meta else "Unknown"
        
        results.append({
            "text": chunk.page_content,
            "source": source,
            "chunk_id": int(idx),
            "similarity_score": float(score)  # L2 distance
        })
        
    return results

if __name__ == "__main__":
    import sys
    search_query = sys.argv[1] if len(sys.argv) > 1 else "What is RAG?"
    print(f"Searching for: '{search_query}'")
    
    try:
        hits = retrieve_chunks(search_query)
        for i, hit in enumerate(hits):
            print(f"\nResult {i+1}:")
            print(f"Score: {hit['similarity_score']:.4f}")
            print(f"Source: {hit['source']}")
            print(f"Text: {hit['text'][:100]}...") # Print first 100 chars
    except Exception as e:
        print(f"Error during retrieval: {e}")
