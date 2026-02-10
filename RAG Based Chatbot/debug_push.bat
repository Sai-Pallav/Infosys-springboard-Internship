@echo off
cd ..
echo STARTING PUSH... > "RAG Based Chatbot\git_push_log.txt"
git push origin main >> "RAG Based Chatbot\git_push_log.txt" 2>&1
echo FINISHED. >> "RAG Based Chatbot\git_push_log.txt"
