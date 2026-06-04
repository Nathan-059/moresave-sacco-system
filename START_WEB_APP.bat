@echo off
REM Moresave SACCO Web App Startup Script
echo Starting Moresave SACCO Web Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed. Please install Node.js 20 from https://nodejs.org/
    pause
    exit /b 1
)

REM Start backend server
echo [1/2] Starting Backend Server on port 5000...
start "Moresave Backend" cmd /k "cd moresave-react\server && npm install && npm start"

REM Wait for backend to start
echo [*] Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak

REM Start frontend
echo [2/2] Starting Frontend on http://localhost:5173...
cd moresave-react
npm install
npm run dev

pause
