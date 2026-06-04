@echo off
REM Diagnostic script for Moresave SACCO
title Moresave SACCO Diagnostics

echo ========================================
echo Moresave SACCO - System Diagnostics
echo ========================================
echo.

REM Check Node.js
echo [*] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js NOT installed - Install from https://nodejs.org/ (version 20+)
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
)

REM Check npm
echo [*] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm NOT installed
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
)

REM Check MySQL
echo [*] Checking MySQL on localhost:3306...
netstat -an | findstr :3306 >nul 2>&1
if errorlevel 1 (
    echo [X] MySQL NOT running - Start MySQL service
) else (
    echo [OK] MySQL is running on port 3306
)

REM Check port 5000
echo [*] Checking if port 5000 is available...
netstat -an | findstr :5000 >nul 2>&1
if errorlevel 1 (
    echo [OK] Port 5000 is available
) else (
    echo [!] WARNING: Port 5000 is already in use
    echo Kill the process with: netstat -ano | findstr :5000
    echo Then: taskkill /PID ^<PID^> /F
)

REM Check required files
echo [*] Checking project structure...
if exist "moresave-react\package.json" (
    echo [OK] Frontend found
) else (
    echo [X] Frontend NOT found at moresave-react
)

if exist "moresave-react\server\package.json" (
    echo [OK] Backend found
) else (
    echo [X] Backend NOT found at moresave-react\server
)

if exist "database\SACCO.sql" (
    echo [OK] Database script found
) else (
    echo [X] Database script NOT found at database\SACCO.sql
)

echo.
echo ========================================
echo Diagnostics Complete
echo ========================================
pause
