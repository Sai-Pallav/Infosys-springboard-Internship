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

## 2. Chat (RAG)
Send a user query to get an answer based on the knowledge base.

- **Endpoint**: `POST /api/chat`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "query": "What is the capital of France?",
    "sessionId": "sess_12345"
  }
  ```
- **Response (Success - AI or Fallback)**:
  ```json
  {
    "answer": "The capital of France is Paris.",
    "sources": ["geography_textbook.pdf"],
    "history": [ ... ]
  }
  ```
- **Response (Error)**:
  ```json
  {
    "error": "Internal Server Error..."
  }
  ```

### Fallback Behavior
If the AI service (Groq) is down or quota is exceeded, the `answer` field will contain:
> **AI Unavailable. Here are the most relevant results from the database:**
> 1. Source: document.pdf
>    (Snippet of text...)
