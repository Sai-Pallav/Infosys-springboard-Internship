@echo off
cd ..
echo [DEBUG] Staging dependency fix... >> "RAG Based Chatbot/git_debug.log"
git add "RAG Based Chatbot/code_Files/requirements.txt" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Committing dependency fix... >> "RAG Based Chatbot/git_debug.log"
git commit -m "Fix: Added numpy and scipy for cloud compatibility on Render" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] PUSHING fix... >> "RAG Based Chatbot/git_debug.log"
git push origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Exit Code: %errorlevel% >> "RAG Based Chatbot/git_debug.log"
