@echo off
title RailOpt - AI-Powered Automatic Block Planning (SIH26027)
echo =====================================================================
echo  RailOpt: AI-Powered Automatic Block Planning System
echo  Indian Railways Decision Support Prototype (SIH26027)
echo =====================================================================
echo.

cd /d "%~dp0backend"
echo [1/2] Initializing Python Virtual Environment and CP-SAT Solver...
if not exist ".venv\Scripts\python.exe" (
    echo Error: Python virtual environment not found in backend\.venv.
    pause
    exit /b 1
)

echo [2/2] Launching RailOpt Integrated Server on http://localhost:8000 ...
start "" "http://localhost:8000"
".venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
pause
