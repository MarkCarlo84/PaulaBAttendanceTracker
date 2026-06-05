@echo off
title Attendance Tracker System
cd /d "%~dp0"

echo ========================================
echo   Attendance Tracker System Launcher
echo ========================================
echo.

REM -------------------------------------------------------
REM 1. Start XAMPP Apache and MySQL
REM -------------------------------------------------------
echo [1/5] Starting XAMPP services...

set XAMPP_DIR=C:\xampp

if exist "%XAMPP_DIR%\apache\bin\httpd.exe" (
    powershell -Command "Start-Process -FilePath '%XAMPP_DIR%\apache\bin\httpd.exe' -WindowStyle Hidden"
    echo   - Apache started
) else (
    echo   - Apache not found, skipping
)

if exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
    powershell -Command "Start-Process -FilePath '%XAMPP_DIR%\mysql\bin\mysqld.exe' -ArgumentList '--console' -WindowStyle Hidden"
    echo   - MySQL started
) else (
    echo   - MySQL not found, skipping
)

echo.
echo   Waiting 8 seconds for services to be ready...
timeout /t 8 /nobreak > nul
echo.

REM -------------------------------------------------------
REM 2. Install backend dependencies if needed
REM -------------------------------------------------------
echo [2/5] Checking backend dependencies...
if not exist "backend\vendor" (
    echo   Installing Composer dependencies...
    cd backend
    call composer install --no-interaction 2>&1
    cd ..
) else (
    echo   - vendor found, skipping
)
echo.

REM -------------------------------------------------------
REM 3. Setup environment and database
REM -------------------------------------------------------
echo [3/5] Setting up environment and database...
if not exist "backend\.env" (
    echo   Creating .env file...
    cd backend
    copy .env.example .env > nul
    php artisan key:generate --force
    cd ..
)
cd backend

REM Run pending migrations only (safe to run repeatedly)
php artisan migrate --force

REM Only seed if no teachers exist yet
php artisan tinker --execute="if (\App\Models\Teacher::count() === 0) { \$this->call(\Database\Seeders\DatabaseSeeder::class); }" 2>&1

cd ..
echo.

REM -------------------------------------------------------
REM 4. Install frontend dependencies if needed
REM -------------------------------------------------------
echo [4/5] Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo   Installing npm packages...
    cd frontend
    call npm install 2>&1
    cd ..
) else (
    echo   - node_modules found, skipping
)
echo.

REM -------------------------------------------------------
REM 5. Start servers
REM -------------------------------------------------------
echo [5/5] Starting servers...
echo.

REM Kill old processes on ports 8000 and 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a > nul 2>&1
)

REM Start backend (hidden, log to file)
echo   Backend  : http://localhost:8000
start /B cmd /c "cd /d "%~dp0backend" && php artisan serve --port=8000 > "%~dp0backend\storage\logs\serve.log" 2>&1"

timeout /t 3 /nobreak > nul

REM Start frontend (hidden, log to file)
echo   Frontend : http://localhost:3000
start /B cmd /c "cd /d "%~dp0frontend" && npm run dev > "%~dp0frontend\dev.log" 2>&1"

timeout /t 5 /nobreak > nul

REM Open browser
echo   Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo   All services started!
echo   Backend : http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Login   : teacher@school.com / password
echo.
echo   Close this window to stop all services.
echo   Or run stop.bat to shut down.
echo ========================================
echo.
pause
