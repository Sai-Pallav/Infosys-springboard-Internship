@echo off
del "server\debug_rag.js"
del "code_Files\test_import.py"
del "code_Files\python_debug.log"
del "server\python_debug.log" 2>NUL
del "validate_deployment.bat" 2>NUL
del "verify_generation.bat"
del "server\uploads\*" /Q 2>NUL
