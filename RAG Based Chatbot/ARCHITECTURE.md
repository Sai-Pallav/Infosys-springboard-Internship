# System Architecture

## Overview
This RAG-based chatbot uses a **Decoupled Client-Server Architecture** to ensure security, scalability, and a premium user experience.

### Components
1.  **Frontend (Client)**: Built with **React + Vite + Tailwind CSS**. Hosted on **Firebase Hosting**. Implements a modern glassmorphic design system and real-time streaming state management.
2.  **Backend (Server)**: Hosted on **Render**. Node.js + Express + Multer. Orchestrates the RAG pipeline, handles file uploads/scraping, and manages chat sessions.
3.  **Database**: **MongoDB Atlas**. Stores vector embeddings for RAG and persistent chat history.
4.  **AI Service**: **Groq API / Hugging Face**. High-speed inference using Llama-3 models and transformer-based embeddings.

---

## 🔒 Security Architecture
- **Stateless Authentication**: The backend is protected by environment variables; no API keys are exposed to the client.
- **Enterprise Middleware**: 
  - **Helmet**: Enforces secure HTTP headers.
  - **Rate Limiting**: Throttles requests per IP to prevent DDoS.
  - **CORS Policy**: Restricts access to authorized frontend domains.

---

## 🔄 RAG & Streaming Logic
The system implements a state-of-the-art **Streaming RAG Pipeline** using Server-Sent Events (SSE).

### Step-by-Step Flow:
1.  **Query Generation**: Frontend sends a request to `POST /api/chat`.
2.  **Context Retrieval**: The backend runs a Python worker to perform a Vector Search in MongoDB.
3.  **Streaming Response**:
    - The server establishes an SSE connection (`text/event-stream`).
    - AI tokens are streamed to the frontend in real-time as they are generated.
    - **Metadata Block**: Once generation is complete, the server sends a JSON block containing the sources (URLs/Filenames) and follow-up question suggestions.
4.  **Graceful Fallback**: If the AI API reaches a rate limit, the backend automatically switches to **Database-Only Mode**, returning raw relevant snippets to guarantee service availability.

---

## 📂 Data Pipeline
- **Ingestion**: PDFs, TXT files, and URLs are processed into 384-dimensional embeddings using the Hugging Face Inference API.
- **Persistence**: Document chunks and their vectors are stored in the `vectorStore` collection. Chat sessions are persisted in the `conversations` collection.

---

## 🥶 Cold Start Handling
As the project is hosted on Render's Free tier, the instance spins down after 15 minutes.
- **Pulse Indicators**: The UI shows a subtle pulse animation during the "Connecting..." phase.
- **Health Check**: The frontend pings `/api/health` to wake up the server before heavy requests.

---

## ⚠️ Performance Bottlenecks
- **Python Initialization**: Every RAG request currently spawns a Python subprocess. This adds ~2s fixed overhead.
- **Future Goal**: Migrate the Python workers into a persistent **FastAPI** service to keep models hot in memory.
