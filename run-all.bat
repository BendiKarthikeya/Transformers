@echo off
echo ========================================
echo TRANSFORMERS CI/CD Healing Agent
echo ========================================
echo.
echo Starting both backend and frontend...
echo.

start "Backend - FastAPI (8000)" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"
timeout /t 3
start "Frontend - React (5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo ✅ SERVERS STARTED
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C in either window to stop
echo ========================================
echo.

timeout /t 3
