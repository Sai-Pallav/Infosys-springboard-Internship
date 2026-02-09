@echo off
SETLOCAL
cls
echo ==========================================
echo    Firebase Frontend Deployment Script
echo ==========================================
echo.

:: Check if firebase.json exists
if not exist "firebase.json" (
    echo [ERROR] firebase.json not found! 
    echo Please ensure you are in the project root.
    pause
    exit /b 1
)

echo [STEP 1] Checking Firebase Login status...
echo.
call npx firebase login
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Firebase login failed or was cancelled.
    pause
    exit /b 1
)

echo.
echo [STEP 2] Deploying to Firebase Hosting...
echo.
call npx firebase deploy --only hosting

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo    DEPLOYMENT SUCCESSFUL! 🚀
    echo ==========================================
    echo.
    echo Your frontend is now live. 
    echo Don't forget to configure your Backend URL in the UI!
) else (
    echo.
    echo [ERROR] Deployment failed. 
    echo Check the logs above for details.
)

echo.
pause
ENDLOCAL
