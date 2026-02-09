# Firebase Hosting Deployment (Frontend)

## Prerequisites
- Google Account
- Node.js installed locally (to run CLI)

## Steps

1.  **Install Firebase CLI**:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login**:
    ```bash
    firebase login
    ```

3.  **Initialize Project**:
    - Go to the root directory `RAG Based Chatbot`.
    - Run:
      ```bash
      firebase init hosting
      ```
    - **Select**: "Use an existing project" (or create new).
    - **Public directory**: `code_Files/client`  <-- **IMPORTANT**
    - **Configure as single-page app?**: `No`
    - **Set up automatic builds/deploys?**: `No` (unless you want GitHub Actions)

4.  **Deploy**:
    ```bash
    firebase deploy --only hosting
    ```

5.  **Post-Deployment**:
    - Firebase will give you a Hosting URL (e.g., `https://your-project.web.app`).
    - Open this URL.
    - **Configure Backend**:
        - You will see internal connectivity errors initially because it defaults to `localhost`.
        - Enter your **Render Backend URL** (e.g., `https://rag-backend.onrender.com`) in the "Backend URL" input field on the page.
        - Click **Set**.
    - The app is now live!
