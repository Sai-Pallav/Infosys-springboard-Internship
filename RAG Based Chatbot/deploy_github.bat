@echo off
echo ===================================================
echo   Deploying to Infosys-springboard-Internship
echo ===================================================

:: Navigate to the parent directory (Repo Root)
cd ..

:: Configure the remote if it doesn't exist (just in case)
git remote add origin https://github.com/Sai-Pallav/Infosys-springboard-Internship.git 2>NUL

:: Stage the changes for this specific project
echo [1/3] Staging changes...
git add "RAG Based Chatbot"

:: Commit
echo [2/3] Committing changes...
git commit -m "Update RAG Chatbot: Production Ready (Security, UX, Stability fixes)"

:: Push
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo ===================================================
echo   Deployment Complete!
echo ===================================================
