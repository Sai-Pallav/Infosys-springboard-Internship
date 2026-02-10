@echo off
cd ..
echo [DEBUG] Current Directory: %CD% > "RAG Based Chatbot/git_debug.log"
echo [DEBUG] Git Status: >> "RAG Based Chatbot/git_debug.log"
git status >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Remote Info: >> "RAG Based Chatbot/git_debug.log"
git remote -v >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Attempting Push... >> "RAG Based Chatbot/git_debug.log"
git push origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Exit Code: %errorlevel% >> "RAG Based Chatbot/git_debug.log"
