from pymongo import MongoClient
from config import MONGODB_URI
from utils import get_embedding # Shared Utility with Retry Logic

# Initialize MongoDB Connection
# (We initialize it here to keep the module self-contained, 
# though in a larger app we might share the connection pool)
client = MongoClient(MONGODB_URI)
db = client['rag_chatbot']
collection = db['documents']

def retrieve_chunks(query, top_k=5):
    """
    Retrieve the most relevant chunks for a given query.
    Uses the shared get_embedding utility which handles API retries.
    """
    try:
        # Utils returns normalized embedding for query string
        embedding_result = get_embedding(query)
        
        # Normalize if nested (InferenceClient for 1 string sometimes returns [[...]])
        if isinstance(embedding_result, list) and len(embedding_result) > 0 and isinstance(embedding_result[0], list):
            query_embedding = embedding_result[0]
        else:
            query_embedding = embedding_result
            
        print(f"[DEBUG] Query Embedding Length: {len(query_embedding)}")

    except Exception as e:
        print(f"[WARN] Atlas Vector Search failed or index missing: {e}. Falling back to in-memory search...", file=sys.stderr)
        
    # FALLBACK: In-memory Cosine Similarity
    try:
        # Load all documents (for small collections this is fast)
        # In production, you MUST create a search index named 'vector_index' in Atlas
        all_docs = list(collection.find({}))
        if not all_docs:
            return []
            
        # Get query embedding again if not already defined
        query_embedding = get_embedding(query)
        if isinstance(query_embedding, list) and len(query_embedding) > 0 and isinstance(query_embedding[0], list):
            query_embedding = query_embedding[0]

        # Calculate similarity
        import math
        def cosine_similarity(v1, v2):
            dot_product = sum(a*b for a, b in zip(v1, v2))
            magnitude1 = math.sqrt(sum(a*a for a in v1))
            magnitude2 = math.sqrt(sum(a*a for a in v2))
            if magnitude1 == 0 or magnitude2 == 0:
                return 0
            return dot_product / (magnitude1 * magnitude2)

        # Score and sort
        scored_docs = []
        for doc in all_docs:
            doc_emb = doc.get('embedding')
            if doc_emb and isinstance(doc_emb, list):
                score = cosine_similarity(query_embedding, doc_emb)
                doc['score'] = score
                scored_docs.append(doc)
        
        scored_docs.sort(key=lambda x: x['score'], reverse=True)
        results = scored_docs[:top_k]
        print(f"[DEBUG] Fallback Search Results: {len(results)} matches found.")
        return results

    except Exception as fallback_err:
        print(f"[ERROR] All retrieval methods failed: {fallback_err}", file=sys.stderr)
        return []
