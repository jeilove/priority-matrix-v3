@echo off
start "Priority Matrix" cmd /k "cd /d %~dp0 && pnpm dev"
timeout /t 5 /nobreak >nul
start http://localhost:3001
