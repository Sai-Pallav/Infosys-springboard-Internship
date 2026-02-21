from pymongo import MongoClient
from config import MONGODB_URI
from embeddings import get_embedding

client = MongoClient(MONGODB_URI)
db = client['rag_chatbot']
collection = db['vectorStore']

def retrieve_chunks(query, top_k=5, active_documents=[]):

    try:
        embedding_result = get_embedding(query)
        
        if isinstance(embedding_result, list) and len(embedding_result) > 0 and isinstance(embedding_result[0], list):
            query_embedding = embedding_result[0]
        else:
            query_embedding = embedding_result
            
        import sys
        print(f"[DEBUG] Query Embedding Length: {len(query_embedding)}", file=sys.stderr)

    except Exception as e:
        print(f"[WARN] Atlas Vector Search failed or index missing: {e}. Falling back to in-memory search...", file=sys.stderr)
        
    try:
        query_filter = {}
        if active_documents:
            query_filter = {"source": {"$in": active_documents}}
            
        all_docs = list(collection.find(query_filter))
        if not all_docs:
            return []
            
        query_embedding = get_embedding(query)
        if isinstance(query_embedding, list) and len(query_embedding) > 0 and isinstance(query_embedding[0], list):
            query_embedding = query_embedding[0]

        import math
        def cosine_similarity(v1, v2):
            dot_product = sum(a*b for a, b in zip(v1, v2))
            magnitude1 = math.sqrt(sum(a*a for a in v1))
            magnitude2 = math.sqrt(sum(a*a for a in v2))
            if magnitude1 == 0 or magnitude2 == 0:
                return 0
            return dot_product / (magnitude1 * magnitude2)

        scored_docs = []
        for doc in all_docs:
            doc_emb = doc.get('embedding')
            if doc_emb and isinstance(doc_emb, list):
                score = cosine_similarity(query_embedding, doc_emb)
                if score >= 0.45:
                    doc['score'] = score
                    scored_docs.append(doc)
        
        scored_docs.sort(key=lambda x: x['score'], reverse=True)
        results = scored_docs[:top_k]
        print(f"[DEBUG] Fallback Search: Found {len(results)} matches (Threshold 0.45). Scores: {[round(r['score'], 3) for r in results]}", file=sys.stderr)
        return results

    except Exception as fallback_err:
        print(f"[ERROR] All retrieval methods failed: {fallback_err}", file=sys.stderr)
        return []