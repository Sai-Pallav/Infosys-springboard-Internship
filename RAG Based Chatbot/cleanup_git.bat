@echo off
git rm debug_git.bat debug_push.bat debug_state.bat 2>NUL
del git_push_log.txt 2>NUL
git commit -m "Remove temporary debug scripts"
git push origin main
echo CLEANUP COMPLETE
