# API Documentation

Base URL: `https://<your-render-app>.onrender.com`

## 1. Health Check
Use this to verify the server is running and the database is connected.

- **Endpoint**: `GET /health`
- **Response**:
  ```json
  {
    "status": "UP",
    "mongo": "connected",
    "timestamp": "2024-02-09T12:00:00.000Z"
  }
  ```

## 2. Chat (RAG) - SSE Stream
Send a user query to get an answer based on the knowledge base in real-time.

- **Endpoint**: `POST /api/chat`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Accept`: `text/event-stream`
- **Body**:
  ```json
  {
    "query": "What is the capital of France?",
    "sessionId": "sess_12345",
    "model": "llama-3.1-8b-instant",
    "systemPrompt": "Optional custom prompt...",
    "activeDocuments": []
  }
  ```
- **Response Format (Server-Sent Events)**:
  The response is a series of `data:` blocks.
  
  **1. Chunk Block (Multiple)**:
  ```json
  data: {"type": "chunk", "text": "The capital "}
  ```
  
  **2. Metadata Block (Final)**:
  ```json
  data: {"type": "metadata", "sources": ["docs.pdf"], "followups": ["Tell me about Paris"]}
  ```

  **3. Error Block**:
  ```json
  data: {"type": "error", "error": "Quota exceeded"}
  ```

### Fallback Behavior
If the AI service (Groq) is down or quota is exceeded, the `answer` field will contain:
> **AI Unavailable. Here are the most relevant results from the database:**
> 1. Source: document.pdf
>    (Snippet of text...)
