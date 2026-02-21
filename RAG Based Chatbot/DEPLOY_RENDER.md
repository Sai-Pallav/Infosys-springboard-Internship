# Render Deployment Guide (Docker Method)

Since we have added a `Dockerfile`, deploying this project to Render is very straightforward. The Dockerfile now automatically builds your React frontend and serves it via the Node.js backend as a single monolithic service.

## 1. Create a New Web Service
1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click the **"New +"** button and select **"Web Service"**.
3.  Choose **"Build and deploy from a Git repository"**.
4.  Connect your repository: `Infosys-springboard-Internship`.

## 2. Configure the Service (Critical Steps)
You must configure these settings exactly as shown below:

| Setting | Value |
| :--- | :--- |
| **Name** | `rag-chatbot-backend` |
| **Region** | Choose the one closest to you |
| **Branch** | `main` |
| **Root Directory** | `RAG Based Chatbot/server` |
| **Runtime** | **Docker** |
| **Instance Type** | **Free** |

> **⚠️ IMPORTANT:** You **MUST** set the **Root Directory** to `RAG Based Chatbot/server`. This ensures Render looks directly at the backend code and the sub-directory Dockerfile.

## 3. Environment Variables
Scroll down to the **Environment Variables** section and add the following keys. Copy the values from your local `.env` file.

| Key | Value |
| :--- | :--- |
| `GROQ_API_KEY` | *(Paste your actual API Key)* |
| `MONGODB_URI` | *(Paste your actual MongoDB Connection String)* |
| `HF_API_KEY` | *(Paste your actual Hugging Face Classic Token)* |
| `PYTHON_PATH` | `python3` |
| `PORT` | `3000` |
| `NODE_ENV` | `production` |

## 4. Deploy
1.  Click **"Create Web Service"**.
2.  Render will start building the Docker image. This might take a few minutes as it installs Python and Node.js.
3.  Once finished, you will see a green **"Live"** badge.

## 5. Verification
-   Your URL will look like: `https://rag-chatbot-backend.onrender.com`
-   Visit `https://rag-chatbot-backend.onrender.com/health` to confirm the API is running.
