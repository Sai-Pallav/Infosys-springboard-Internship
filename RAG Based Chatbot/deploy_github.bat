@echo off
echo ===================================================
echo   Deploying to Infosys-springboard-Internship
echo ===================================================

:: We are already in the Project Root
echo [Debug] Current Directory: %CD%

:: Check Status
echo [Debug] Git Status:
git status

:: Configure the remote if it doesn't exist
git remote add origin https://github.com/Sai-Pallav/Infosys-springboard-Internship.git 2>NUL
echo [Debug] Remote URL:
git remote -v

:: Ensure we are on main branch (force creation if needed)
git checkout main 2>NUL || git checkout -b main


:: 1. Stage and Commit local changes FIRST (Required for rebase)
echo [1/4] Staging and Committing local changes...
git add "Dockerfile" "render.yaml" -f
git add .
git commit -m "Update RAG Chatbot: Production Ready (Security, UX, Stability fixes)"

:: 2. Sync with Remote (Pull with rebase)
echo [2/4] Pulling remote changes...
git pull origin main --rebase --allow-unrelated-histories

:: 3. Push
echo [3/4] Pushing to GitHub...
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed! Please check the error message above.
    echo Possible reasons:
    echo 1. You are not logged in (try 'git credential-manager diagnose')
    echo 2. Repository permissions (do you own this repo?)
    echo 3. Network issues
    pause
    exit /b
)

echo ===================================================
echo   Deployment Complete!
echo ===================================================
