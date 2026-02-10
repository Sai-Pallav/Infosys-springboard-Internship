@echo off
cd ..
echo [DEBUG] Staging ALL changes in the project directory... >> "RAG Based Chatbot/git_debug.log"
git add "RAG Based Chatbot" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Committing remaining refinements... >> "RAG Based Chatbot/git_debug.log"
git commit -m "Final Optimization: Synchronized all configurations, documentation, and cloud scripts" >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] PUSHING everything... >> "RAG Based Chatbot/git_debug.log"
git push origin main >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Final Status... >> "RAG Based Chatbot/git_debug.log"
git status >> "RAG Based Chatbot/git_debug.log" 2>&1
