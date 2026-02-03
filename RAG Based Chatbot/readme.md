# RAG Chatbot (Internship Project)

A Full-Stack AI Chatbot capable of answering questions from uploaded PDF documents using **Retrieval Augmented Generation (RAG)**.

## 🚀 Features
-   **Chat Interface**: Real-time Q&A with AI (Groq/Llama3).
-   **Document Understanding**: Upload PDFs to "teach" the AI new knowledge.
-   **Source Citations**: Answers include references to the specific documents used.
-   **Conversation History**: Memory of past chats (Saved in MongoDB).
-   **Security**: XSS protection and file validation.

## 🛠️ Architecture
-   **Frontend**: Vanilla HTML/CSS/JS (Lightweight, Responsive).
-   **Backend**: Node.js & Express.
-   **Memory (Chat Logs)**: **MongoDB Atlas** (Cloud Database).
-   **Knowledge Base (Vectors)**: **Local Vector Store** (Custom In-Memory Implementation).
    -   *Note*: This project utilizes a local file-based vector index for efficient, zero-cost semantic search during the internship phase. It allows for future migration to FAISS or Atlas Vector Search.
-   **AI Model**: Groq API (Llama-3.3-70b).

## 📦 Installation
1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd code_Files
    ```
2.  **Install Dependencies**:
    ```bash
    cd server
    npm install
    ```
3.  **Configure Environment**:
    Create a `.env` file in `code_Files/` with:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_atlas_url
    GROQ_API_KEY=your_groq_api_key
    ```
4.  **Run the Application**:
    ```bash
    npm start
    ```
    Open `http://localhost:5000` in your browser.

## 🖥️ Deployment (Internship Demo)
This project is designed to be demonstrated via **Local Tunneling** (ngrok) or a VPS to preserve the local vector state.
1.  Start the app locally.
2.  Run `ngrok http 5000`.
3.  Share the generated URL.

## 🔮 Future Scope
-   Migrate local vector index to **MongoDB Atlas Vector Search** for horizontal scaling.
-   Implement User Authentication (OAuth).

A powerful RAG (Retrieval-Augmented Generation) Chatbot built with a modern **MERN-like stack** (MongoDB, Express, React, Node.js) and a specialized **Python AI Microservice**.

## Architecture

The application consists of three main components:

1.  **Frontend (React + Vite)**:
    -   Located in `code_Files/client`.
    -   Provides a responsive, glassmorphism-styled chat interface.
    -   Handles user interaction, message display, and file uploads.
    -   Runs on Port `5173`.

2.  **Backend (Node.js + Express)**:
    -   Located in `code_Files/server`.
    -   Acts as the main application server (the "Brain").
    -   Manages API routes (`/api/chat`, `/api/upload`).
    -   Connects to **MongoDB** to store conversation history.
    -   Proxies AI requests to the Python service.
    -   Runs on Port `5000`.

3.  **AI Service (Python + Flask)**:
    -   Located in `code_Files/ai_service.py`.
    -   Handles the heavy lifting for AI operations.
    -   Performs document ingestion (PDF, DOCX, TXT), chunking, and embedding.
    -   Manages the FAISS vector store for semantic search.
    -   Generates answers using the Groq API (LLM).
    -   Runs on Port `5001`.

## Prerequisites

-   **Node.js** (v18+)
-   **Python** (v3.10+)
-   **MongoDB** (running locally or via Atlas)
-   **Groq API Key** (set in `.env`)

## Setup & Running

We have provided a unified startup script to launch all services at once.

1.  **Install Dependencies** (First time only):
    -   Python: The script will automatically check for the `.venv` and use it. If needed, install manually:
        ```bash
        pip install -r requirements.txt
        ```
    -   Node.js (Server): `cd code_Files/server && npm install`
    -   React (Client): `cd code_Files/client && npm install`

2.  **Start the Application**:
    Simply run the PowerShell script from the root directory:
    ```powershell
    .\start_app.ps1
    ```

    This will launch:
    -   Python AI Service (Port 5001)
    -   Node.js Backend (Port 5000)
    -   React Frontend (Port 5173)

## Features

-   **Multi-Format Ingestion**: Supports uploading .txt, .pdf, and .docx files.
-   **Intelligent Retrieval**: Uses FAISS for fast similarity search on document chunks.
-   **Context-Aware**: Maintains conversation history for follow-up questions.
-   **Modern UI**: Sleek interface with markdown support, citations, and loading states.
