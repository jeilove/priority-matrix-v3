import os

batch_content = """@echo off
setlocal
title Priority Matrix V3 - Local Runner

echo ==========================================
echo [STEP 1] Environment Check...
echo ==========================================
pnpm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm is not found. Please install pnpm.
    pause
    exit /b
)
echo [OK] pnpm found.

echo.
echo ==========================================
echo [STEP 2] Cleaning Port 3001...
echo ==========================================
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Found process %%a using port 3001. Killing...
    taskkill /F /PID %%a /T >nul 2>&1
)
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Cleanup complete.

echo.
echo ==========================================
echo [STEP 3] Starting Dev Server...
echo ==========================================
echo Launching pnpm dev in new window...
start "Priority Matrix Log" cmd /k "pnpm dev"

echo.
echo ==========================================
echo [STEP 4] Opening Browser...
echo ==========================================
echo Waiting for server...
timeout /t 5 /nobreak >nul
start http://localhost:3001

echo.
echo ------------------------------------------
echo Priority Matrix V3 is running!
echo ------------------------------------------
pause
"""

# Windows CMD 호환성을 위해 cp949(ANSI)로 저장
with open("run_app.bat", "w", encoding="cp949") as f:
    f.write(batch_content)

print("Batch file 'run_app.bat' created with cp949 encoding.")
