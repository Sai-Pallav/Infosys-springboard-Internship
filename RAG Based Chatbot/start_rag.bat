@echo off
echo ===================================================
echo   RAG Chatbot - Robust Launcher
echo ===================================================

cd /d "%~dp0"

echo [1/3] Installing Python Dependencies...
pip install -r code_files/requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Python dependency installation failed!
    pause
    exit /b %errorlevel%
)

echo [2/3] Installing Node.js Dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Node.js dependency installation failed!
    pause
    exit /b %errorlevel%
)
cd ..

echo [3/3] Starting Server...
echo.
echo Open your browser to: http://localhost:5000
echo.
cd server
node index.js
pause
