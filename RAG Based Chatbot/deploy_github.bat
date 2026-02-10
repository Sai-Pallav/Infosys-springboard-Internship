@echo off
echo ===================================================
echo   Deploying to Infosys-springboard-Internship
echo ===================================================

:: Navigate to the parent directory (Repo Root)
cd ..
echo [Debug] Current Directory: %CD%

:: Check Status
echo [Debug] Git Status:
git status

:: Configure the remote if it doesn't exist
git remote add origin https://github.com/Sai-Pallav/Infosys-springboard-Internship.git 2>NUL
echo [Debug] Remote URL:
git remote -v

:: Ensure we are on main branch
git branch -M main

:: Sync with Remote (Pull first to avoid rejection)
echo [1/4] Pulling remote changes...
git pull origin main --rebase --allow-unrelated-histories

:: Stage the changes (including deletion of debug files)
echo [2/4] Staging changes...
git add "RAG Based Chatbot"

:: Commit (if there are changes)
echo [3/4] Committing changes...
git commit -m "Update RAG Chatbot: Production Ready (Security, UX, Stability fixes)"

:: Push
echo [4/4] Pushing to GitHub...
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

echo.
echo ===================================================
echo   Deployment Complete!
echo ===================================================
pause
