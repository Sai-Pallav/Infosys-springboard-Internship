@echo off
cd ..
echo [DEBUG] Undoing the bad commit... >> "RAG Based Chatbot/git_debug.log"
git reset --soft HEAD~1 >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Re-staging clean files... >> "RAG Based Chatbot/git_debug.log"
git add "RAG Based Chatbot" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Re-committing... >> "RAG Based Chatbot/git_debug.log"
git commit -m "Final Production Fix: Sanitized configurations and verified RAG pipeline" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Attempting PUSH again... >> "RAG Based Chatbot/git_debug.log"
git push origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Exit Code: %errorlevel% >> "RAG Based Chatbot/git_debug.log"
