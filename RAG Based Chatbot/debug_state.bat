@echo off
echo START > debug.log
cd ..
if %errorlevel% neq 0 (
    echo CD FAILED >> "RAG Based Chatbot\debug.log"
    exit /b
)
echo IN PARENT: %CD% >> "RAG Based Chatbot\debug.log"
git status >> "RAG Based Chatbot\debug.log" 2>&1
git log -1 >> "RAG Based Chatbot\debug.log" 2>&1
echo END >> "RAG Based Chatbot\debug.log"
