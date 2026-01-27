import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from retrieval import retrieve_chunks
from generation import generate_answer

def run_rag_demo(query):
    print("="*60)
    print(f"🔹 RAG DEMO: '{query}'")
    print("="*60)
    
    print("\n🔎 RETRIEVED CHUNKS:")
    print("-" * 20)
    
    chunks = retrieve_chunks(query, k=3)
    
    if not chunks:
        print("No relevant chunks found.")
    else:
        for i, chunk in enumerate(chunks):
            print(f"[{i+1}] Score: {chunk['similarity_score']:.4f} | Source: {chunk['source']}")
            snippet = chunk['text'][:100].replace('\n', ' ')
            print(f"    Content: {snippet}...")
            print("")

    print("\n🤖 GENERATED ANSWER:")
    print("-" * 20)
    
    answer = generate_answer(query)
    print(answer)
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    user_query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Who is Dr. APJ Abdul Kalam?"
    
    run_rag_demo(user_query)
