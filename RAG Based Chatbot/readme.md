## Milestone-1: Document Ingestion & Indexing

### What was implemented
- Multi-format document ingestion (.txt, .pdf, .docx)
- Text chunking with overlap
- Semantic embedding generation
- FAISS vector indexing

### Testing & Validation
- Verified document ingestion and content extraction
- Validated chunk creation and overlap
- Confirmed embedding dimensionality
- Ensured FAISS index integrity
- Performed semantic search sanity test

### Result
All Milestone-1 tests passed successfully.

## Milestone-2: RAG Pipeline Development

### What was implemented
- Retrieval System: Implemented `retrieve_chunks` to search the FAISS index for relevant document chunks based on user queries.
- Generation System: Integrated Google Gemini API (`gemini-2.0-flash`) to generate natural language answers using the retrieved context.
- Backend Integration: Updated `app.py` to connect the frontend with the full RAG pipeline.
- Rate Limit Handling: Implemented exponential backoff retry logic to gracefully handle API rate limits (429 errors).

### Testing & Validation
- Unit Testing:
    - `test_retrieval.py`: Verified accurate retrieval of chunks.
    - `test_generation.py`: Verified answer generation logic (mocked).
- End-to-End Testing:
    - `rag_test.py`: CLI tool to test the full pipeline.
    - valid API integration confirmed (with known free tier rate limits).

### Result
Milestone-2 is complete. The application now accepts user queries, retrieves relevant information, and generates grounded answers.
