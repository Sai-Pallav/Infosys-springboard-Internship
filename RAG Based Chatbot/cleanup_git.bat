@echo off
cd ..
git rm "RAG Based Chatbot/debug_git.bat" "RAG Based Chatbot/debug_push.bat" "RAG Based Chatbot/debug_state.bat"
del "RAG Based Chatbot\git_push_log.txt"
git commit -m "Remove temporary debug scripts"
git push origin main
echo CLEANUP COMPLETE
