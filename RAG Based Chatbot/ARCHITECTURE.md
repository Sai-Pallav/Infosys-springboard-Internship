# System Architecture

## Overview
This RAG-based chatbot uses a **Decoupled Client-Server Architecture** to ensure security, scalability, and robust error handling.

### Components
1.  **Frontend (Client)**: Hosted on **Firebase Hosting**. Pure static HTML/CSS/JS. **Zero Knowledge** of API keys or database credentials.
2.  **Backend (Server)**: Hosted on **Render (Free Tier)**. Node.js + Express. Handles all business logic, database connections, and AI interactions.
3.  **Database**: **MongoDB Atlas**. Stores vector embeddings for RAG and chat history.
4.  **AI Service**: **Groq API**. Optional service for generating human-like answers.

---

## 🔒 Security Architecture
- **No Secrets in Frontend**: The client `app.js` only knows the URL of the Backend. It does *not* contain `FIREBASE_CONFIG` secrets or `GROQ_API_KEY`.
- **Environment Variables**: All sensitive data (`MONGODB_URI`, `GROQ_API_KEY`) is stored in Render's secure Environment Variables.
- **CORS**: The backend explicitly allows Cross-Origin Resource Sharing so the separate Frontend domain can talk to it.

---

## 🔄 RAG & Fallback Logic (The "Brain")

The backend implements a robust **Graceful Degradation** strategy to ensure the chatbot *always* works, even if the AI is down or the quota is exceeded.

### Step-by-Step Flow:
1.  **User Query**: Frontend sends query to `POST /api/chat`.
2.  **Vector Search**: Backend searches MongoDB vectors for relevant document chunks.
3.  **Attempt AI Generation**:
    - Backend constructs a prompt using the retrieved context.
    - It tries to call the **Groq API**.
4.  **Handling Failure (Fallback)**:
    - If Groq returns a `429 (Quota Exceeded)` or `500 (Error)`:
    - The backend **catches the error**.
    - It switches to **"Database Only" Mode**.
    - It formats the **raw text chunks** retrieved from MongoDB into a readable list.
    - It returns this list to the user with a message: *"AI Unavailable. Here are the most relevant results from the database..."*
5.  **Response**: The frontend displays the result (whether AI-generated or Raw DB text) seamlessly.

---

## 🥶 Cold Start Handling (Render Free Tier)
Render's free instance spins down after 15 minutes of inactivity. The first request can take **up to 50 seconds**.

- **Frontend**: Shows a "Connecting..." status and a textual warning if the request takes >5 seconds: *(Server might be waking up...)*.
- **Backend**: Has a lightweight `/health` endpoint to quickly check status without triggering a full RAG pipeline.
