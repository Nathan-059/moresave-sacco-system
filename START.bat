@echo off
echo Starting Moresave SACCO System...
echo.

echo [1/2] Starting Backend Server (port 5000)...
start "Moresave Backend" cmd /k "cd /d %~dp0moresave-react\server && node index.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (port 5173)...
start "Moresave Frontend" cmd /k "cd /d %~dp0moresave-react && npm run dev"

echo.
echo Both servers are starting...
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Open your browser at: http://localhost:5173
timeout /t 4 /nobreak >nul
start http://localhost:5173
