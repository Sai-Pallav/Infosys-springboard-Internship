@echo off
cd ..
echo [DEBUG] Resetting to origin/main... >> "RAG Based Chatbot/git_debug.log"
git fetch origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
git reset --mixed origin/main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Staging current perfect local code... >> "RAG Based Chatbot/git_debug.log"
git add "RAG Based Chatbot" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Creating single clean commit... >> "RAG Based Chatbot/git_debug.log"
git commit -m "Final Production Release: Restored RAG pipeline, secured secrets, and enabled chat memory" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] PUSHING clean state... >> "RAG Based Chatbot/git_debug.log"
git push origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Final Exit Code: %errorlevel% >> "RAG Based Chatbot/git_debug.log"
