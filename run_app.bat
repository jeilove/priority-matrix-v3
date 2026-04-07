@echo off
setlocal
title Priority Matrix V3 - Local Runner

echo [1/3] Cleaning up existing processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Priority Matrix*" /T >nul 2>&1

echo [2/3] Starting Development Server (pnpm dev)...
start "Priority Matrix Dev Server" cmd /c "pnpm dev"

echo [3/3] Opening Browser...
timeout /t 5 >nul
start http://localhost:3001

echo.
echo ==========================================
echo Priority Matrix V3 is now running!
echo URL: http://localhost:3001
echo ==========================================
pause
