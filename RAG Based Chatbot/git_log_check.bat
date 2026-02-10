@echo off
cd ..
echo [DEBUG] Git Log (Last 10): >> "RAG Based Chatbot/git_debug.log"
git log -n 10 --oneline >> "RAG Based Chatbot/git_debug.log" 2>&1
echo [DEBUG] Searching for commit 311d13b... >> "RAG Based Chatbot/git_debug.log"
git branch --contains 311d13b >> "RAG Based Chatbot/git_debug.log" 2>&1
