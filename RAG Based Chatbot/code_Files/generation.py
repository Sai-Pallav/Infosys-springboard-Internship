import time
from config import OPENAI_API_KEY, LLM_MODEL
from retrieval import retrieve_chunks
from openai import OpenAI

# ---- CREATE CLIENT ONCE ----
client = OpenAI(api_key=OPENAI_API_KEY)

# ---- OPTIONAL SIMPLE CACHE (SAVES MONEY) ----
_CACHE = {}

def generate_answer(query: str, history: list = []):
    """
    Efficient RAG-based answer generation using OpenAI.

    Guarantees:
    - ONE API call per query
    - No retries
    - Token-limited
    - Cache-enabled
    """

    if not OPENAI_API_KEY:
        return "Error: OPENAI_API_KEY is not set."

    # Note: We disable caching for multi-turn conversations to ensure context updates
    # allow for follow-up questions
    if not history and query in _CACHE:
        return _CACHE[query]

    # ---- Retrieve context ----
    # (In a more advanced system, we might rewrite the query using history before retrieval)
    chunks = retrieve_chunks(query, k=5)
    if not chunks:
        return {"answer": "I couldn't find any relevant information in the knowledge base.", "sources": []}

    # ---- Trim context (VERY IMPORTANT) ----
    MAX_CHARS = 3500  # safe limit
    context_parts = []
    total_chars = 0

    for c in chunks:
        text = c.get("text", "")
        if total_chars + len(text) > MAX_CHARS:
            break
        context_parts.append(
            f"Source: {c.get('source', 'Unknown')}\n{text}"
        )
        total_chars += len(text)

    context_text = "\n\n".join(context_parts)

    # Format history for prompt
    history_text = ""
    if history:
         history_text = "Conversation History:\n" + "\n".join([f"{msg['role'].title()}: {msg['content']}" for msg in history]) + "\n\n"

    system_prompt = (
        "You are a factual assistant.\n"
        "Answer ONLY using the provided context.\n"
        "Use the Conversation History to resolve references (e.g., 'he', 'it') in the current question.\n"
        "If the answer is not in the context, say:\n"
        "'I don't know based on the given context.'"
    )

    user_prompt = f"""
Context:
{context_text}

{history_text}
Question:
{query}

Answer:
"""

    # ---- Soft cooldown (good hygiene) ----
    time.sleep(1)

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )

        answer_text = response.choices[0].message.content.strip()

    except Exception as e:
        return {"answer": f"OpenAI API error: {str(e)}", "sources": []}

    # ---- Build sources list ----
    structured_sources = []
    seen = set()
    for c in chunks:
        src = c.get("source", "Unknown")
        cid = c.get("chunk_id", "?")
        text = c.get("text", "")
        key = f"{src}_{cid}"
        
        if key not in seen:
            structured_sources.append({
                "source": src,
                "chunk_id": cid,
                "text": text
            })
            seen.add(key)

    # Return structured data
    result = {
        "answer": answer_text,
        "sources": structured_sources
    }

    # Only cache if no history (simple queries)
    if not history:
        _CACHE[query] = result
    return result


if __name__ == "__main__":
    import sys

    q = sys.argv[1] if len(sys.argv) > 1 else "Who is Bhagat Singh?"
    result = generate_answer(q)
    print("\nAnswer:\n")
    print(result["answer"])
    print("\nSources:\n")
    for s in result["sources"]:
        print(f"- {s['source']} (Chunk {s['chunk_id']})")
