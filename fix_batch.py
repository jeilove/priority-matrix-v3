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
echo [STEP 2] Cleaning Port 3001 and Node...
echo ==========================================
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo [INFO] Killing process %%a on port 3001...
    taskkill /F /PID %%a /T >nul 2>&1
)
taskkill /F /IM node.exe /T >nul 2>&1
echo [OK] Cleanup complete.

echo.
echo ==========================================
echo [STEP 3] Starting Dev Server (3001)...
echo ==========================================
start "Priority Matrix v3 Server" cmd /k "pnpm dev"

echo.
echo ==========================================
echo [STEP 4] Opening Browser...
echo ==========================================
echo [INFO] Waiting for 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:3001

echo.
echo ------------------------------------------
echo Priority Matrix V3 is running!
echo ------------------------------------------
pause
"""

# 가급적 한글을 배제하고 ANSI(CP949)로 저장하여 실행 보장
with open("run_app.bat", "w", encoding="cp949") as f:
    f.write(batch_content)

with open("run_matrix.bat", "w", encoding="cp949") as f:
    f.write(batch_content)

print("Batch files created with CP949 encoding.")
