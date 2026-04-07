@echo off
echo [INFO] Starting Priority Matrix Development Server...
echo [INFO] Using pnpm as requested...

:: =========================================
:: STEP 1: 3001 포트 좀비 프로세스 자동 정리
:: =========================================
echo [INFO] Checking for zombie processes on port 3001...

:: 3001 포트를 사용 중인 PID를 찾아 강제 종료
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr /i "listening"') do (
    echo [WARN] Found process on port 3001 - PID: %%a. Killing...
    taskkill /PID %%a /F >nul 2>&1
)

echo [INFO] Port 3001 is now free.
echo.

:: =========================================
:: STEP 2: 현재 IP 주소 확인 및 안내
:: =========================================
for /f "tokens=4" %%f in ('route print ^| findstr 0.0.0.0 ^| find "0.0.0.0"') do set IP=%%f
echo [INFO] Mobile Access: http://%IP%:3001
echo.

:: =========================================
:: STEP 3: 브라우저 자동 실행 및 서버 시작
:: =========================================
echo [INFO] Opening browser and starting dev server...
start http://localhost:3001

:: .next 캐시 삭제 후 서버 실행
echo [INFO] Cleaning .next cache and starting dev server...
call pnpm run dev:clean

pause

