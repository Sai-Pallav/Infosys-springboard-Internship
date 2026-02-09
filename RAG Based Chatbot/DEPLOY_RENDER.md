# Render Deployment Guide (Hybrid Node.js + Python)

This project uses a **Hybrid Architecture** where a Node.js server spawns Python subprocesses for AI tasks.

## Prerequisites
- GitHub Account
- Render Account (https://render.com)
- MongoDB Atlas Connection String
- Groq API Key

## Steps

1.  **Push Code to GitHub**:
    - Ensure your code is pushed to your repository.

2.  **Create Service on Render**:
    - Go to **Dashboard** -> **New** -> **Web Service**.
    - Connect your GitHub repository.

3.  **Configuration**:
    - **Name**: `rag-backend-hybrid`
    - **Root Directory**: `RAG Based Chatbot`
    - **Runtime**: `Node`
    - **Build Command**: `npm install --prefix server && pip install -r code_files/requirements.txt`
    - **Start Command**: `node server/index.js`
    - **Plan**: Free

    > **Note**: Render's Node runtime includes Python, so we can install dependencies for both.

4.  **Environment Variables**:
    - Add the following:
        - `MONGODB_URI`: (Your actual MongoDB connection string)
        - `GROQ_API_KEY`: (Your actual Groq API key)
        - `PYTHON_PATH`: `/opt/render/project/src/.venv/bin/python` (Optional, usually just `python` works)

5.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for the build to finish.

## Verification
- Visit `https://your-app.onrender.com/health`.
- Chat with the bot and check logs to see "Calling Python Generation Script...".
