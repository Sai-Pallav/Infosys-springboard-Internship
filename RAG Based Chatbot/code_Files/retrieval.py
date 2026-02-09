from sentence_transformers import SentenceTransformer, util
import numpy as np
from config import EMBEDDING_MODEL

# Initialize model
model = SentenceTransformer(EMBEDDING_MODEL)

def retrieve_chunks(query, chunks, top_k=5):
    """
    Retrieve the most relevant chunks for a given query.
    Assumes 'chunks' is a list of dicts with 'text' and 'embedding' keys.
    """
    if not chunks:
        return []

    # Encode query
    query_embedding = model.encode(query, convert_to_tensor=True)

    # Prepare corpus embeddings
    corpus_embeddings = [chunk['embedding'] for chunk in chunks if 'embedding' in chunk]
    
    if not corpus_embeddings:
        return []

    # Calculate similarity
    hits = util.semantic_search(query_embedding, corpus_embeddings, top_k=top_k)
    
    # Extract results
    results = []
    for hit in hits[0]:
        chunk_index = hit['corpus_id']
        results.append(chunks[chunk_index])
        
    return results
