@echo off
cd ..
echo ==========================================
echo CHEKING GIT STATUS
echo ==========================================
git remote -v
echo.
echo ==========================================
echo GIT STATUS
echo ==========================================
git status
echo.
echo ==========================================
echo LAST COMMIT
echo ==========================================
git log -n 1
