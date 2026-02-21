@echo off
echo ===================================================
echo   RAG Chatbot - Robust Launcher
echo ===================================================

cd /d "%~dp0"

echo [1/3] Installing Python Dependencies...
pip install -r server/python_engine/requirements.txt
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

:: Set Python Encoding to UTF-8 to avoid Windows emoji crashes
set PYTHONIOENCODING=utf-8

echo [3/3] Starting Servers (Frontend & Backend)...
echo.
echo Launching Frontend Dev Server (Port 5173)...
start cmd /k "cd client && npm run dev"
echo.
echo Launching Backend Server (Port 3000)...
echo Open your browser to: http://localhost:5173
echo.
start http://localhost:5173
cd server
node index.js
pause
