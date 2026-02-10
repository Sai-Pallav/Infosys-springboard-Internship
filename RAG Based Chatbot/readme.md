# RAG Chatbot (Internship Project)

A secure, decoupled RAG (Retrieval Augmented Generation) chatbot built with **Node.js**, **Express**, **MongoDB Atlas**, and **Firebase Hosting**.

## 🚀 Features
- **RAG Architecture**: Retrieves relevant context from MongoDB Vector Search.
- **Graceful Fallback**: If the AI API (Groq) fails or quota is exceeded, the system automatically falls back to displaying raw database results.
- **Enterprise Security**:
  - **Helmet**: Secures HTTP headers.
  - **Rate Limiting**: Protects against DDoS with IP-based limits (100 req/15min).
  - **Input Validation**: Prevents large payload attacks.
- **Reliability**:
  - **Auto-Retry**: Exponential backoff for AI API calls.
  - **Fail-Fast**: Validates environment variables on startup.
- **Modern UI**: Clean interface with Markdown support, responsive design (Mobile Support), and cold-start indicators.

## 📂 Project Structure
```
├── client/                 # Frontend (Firebase Hosting)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server/                 # Backend API (Render)
│   ├── index.js            # Entry point
│   ├── routes/             # API Endpoints
│   └── services/           # RAG Logic
├── .env                    # Environment Variables (Not committed)
└── Documentation
    ├── ARCHITECTURE.md     # System Design & Logic
    ├── DEPLOY_FIREBASE.md  # Frontend Deployment Guide
    ├── DEPLOY_RENDER.md    # Backend Deployment Guide
    └── API_DOCS.md         # API Reference
```

## 🛠️ Quick Start (Local Development)

### 1. Backend
```bash
cd server
npm install
# Create .env with MONGODB_URI and GROQ_API_KEY
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend
Open `client/index.html` in your browser.
*(Note: You may need a simple HTTP server like `npx serve client` to avoid local file CORS issues)*.

## 📚 Documentation
- **[System Architecture & Logic](ARCHITECTURE.md)**
- **[Backend Deployment (Render)](DEPLOY_RENDER.md)**
- **[Frontend Deployment (Firebase)](DEPLOY_FIREBASE.md)**
- **[API Reference](API_DOCS.md)**

---
*Internship Project Evaluation*
