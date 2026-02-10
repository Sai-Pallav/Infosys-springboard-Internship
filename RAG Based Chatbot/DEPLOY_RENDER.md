# Render Deployment Guide (Docker Method)

Since we have added a `Dockerfile`, deploying this project to Render is very straightforward.

## 1. Create a New Web Service
1.  Log in to your [Render Dashboard](https://dashboard.render.com).
2.  Click the **"New +"** button and select **"Web Service"**.
3.  Choose **"Build and deploy from a Git repository"**.
4.  Connect your repository: `Infosys-springboard-Internship`.

## 2. Configure the Service (Critical Steps)
You must configure these settings exactly as shown below:

| Setting | Value |
| :--- | :--- |
| **Name** | `rag-chatbot-backend` (or any name you like) |
| **Region** | Choose the one closest to you (e.g., Singapore) |
| **Branch** | `main` |
| **Root Directory** | `RAG Based Chatbot` |
| **Runtime** | **Docker** (Render should auto-detect this if Root Directory is correct) |
| **Instance Type** | **Free** |

> **⚠️ IMPORTANT:** You **MUST** set the **Root Directory** to `RAG Based Chatbot`. If you leave it empty, the deployment will fail because Render won't find the Dockerfile.

## 3. Environment Variables
Scroll down to the **Environment Variables** section and add the following keys. Copy the values from your local `.env` file.

| Key | Value |
| :--- | :--- |
| `GROQ_API_KEY` | *(Paste your actual API Key)* |
| `MONGODB_URI` | *(Paste your actual MongoDB Connection String)* |
| `PYTHON_PATH` | `python3` |
| `PORT` | `5000` |

## 4. Deploy
1.  Click **"Create Web Service"**.
2.  Render will start building the Docker image. This might take a few minutes as it installs Python and Node.js.
3.  Once finished, you will see a green **"Live"** badge.

## 5. Verification
-   Your URL will look like: `https://rag-chatbot-backend.onrender.com`
-   Visit `https://rag-chatbot-backend.onrender.com/status` to confirm the API is running.
