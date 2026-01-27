from retrieval import retrieve_chunks

def test_retrieval():
    query = "What libraries are used?"
    print(f"Testing retrieval with query: '{query}'")
    try:
        results = retrieve_chunks(query, k=3)
        print(f"Found {len(results)} results.")
        for res in results:
            snippet = res['text'][:50].replace('\n', ' ')
            print(f"- [Score: {res['similarity_score']:.3f}] {res['source']}: {snippet}...")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_retrieval()
