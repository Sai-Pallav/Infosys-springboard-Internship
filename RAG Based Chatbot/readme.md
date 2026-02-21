# RAG Chatbot (Premium AI Assistant) 🤖✨

A secure, decoupled RAG (Retrieval Augmented Generation) chatbot built with **React**, **Vite**, **Tailwind CSS**, **Node.js**, **Express**, and **MongoDB Atlas**.

## 🚀 Features
- **Premium UI/UX**: Stunning **Emerald Green** theme with Dark Mode, glassmorphism, and smooth Framer Motion animations.
- **Real-time Streaming**: Utilizes Server-Sent Events (SSE) for instant, streaming AI responses.
- **RAG Architecture**: Intelligent document retrieval from MongoDB Vector Search.
- **Graceful Fallback**: Automatic failover to local database context if AI quotas are exceeded.
- **Enterprise Security**:
  - **Helmet & Rate Limiting**: Production-grade header protection and DDoS prevention.
  - **Input Validation**: Secure handling of large document payloads.
- **Multi-Source Support**: Scraping of live URLs and local PDF/TXT uploads.

## 📂 Project Structure
```
├── client/                 # Premium React Frontend (Vite)
│   ├── src/                # Components (Sidebar, ChatWindow, etc.)
│   ├── tailwind.config.js  # Emerald Design System
│   └── dist/               # Production Build Output
├── server/                 # Node.js Backend API
│   ├── index.js            # Entry point & Static Serving
│   ├── services/           # AI & Streaming Logic
│   └── python_engine/      # RAG & Embedding Workers
├── Dockerfile              # Monolithic Container Config
└── firebase.json           # Frontend Deployment Config
```

## 🛠️ Quick Start (Local Development)

### 1. Backend
```bash
cd server
npm install
# Create .env with MONGODB_URI and GROQ_API_KEY
npm start
```

### 2. Frontend
```bash
cd client
npm install
npm run dev
```

## 📚 Documentation
- **[System Architecture](ARCHITECTURE.md)**
- **[API Reference](API_DOCS.md)**
- **[Backend Deployment (Render)](DEPLOY_RENDER.md)**
- **[Frontend Deployment (Firebase)](DEPLOY_FIREBASE.md)**
- **[Project Case Study](PROJECT_REPORT.md)**

---
*Internship Project Evaluation - Final Version*
