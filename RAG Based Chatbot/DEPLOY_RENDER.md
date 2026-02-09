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
    - **Root Directory**: `RAG Based Chatbot/server` (Do not forget the "RAG Based Chatbot/" part!)
    - **Runtime**: `Node`
    - **Build Command**: `npm install && pip install -r ../code_Files/requirements.txt`
    - **Start Command**: `node index.js`
    - **Plan**: Free

    > **Note**: Setting the **Root Directory** to `RAG Based Chatbot/server` tells Render where the Node.js project is. We then use `../` in the build command to reach the Python `requirements.txt`.

4.  **Environment Variables**:
    - Add the following in the **Environment Variables** section:
        - `MONGODB_URI`: `mongodb+srv://kotasaipallav123_db_user:i7zpzvTEtzhzT5g7@cluster0.l6zwnxg.mongodb.net/rag_chatbot?appName=Cluster0`
        - `GROQ_API_KEY`: (Your actual Groq API key)

5.  **Deploy**:
    - Click **Create Web Service**.
    - Wait for the build to finish.

## Verification
- Visit `https://your-app.onrender.com/health`.
- Chat with the bot and check logs to see "Calling Python Generation Script...".
