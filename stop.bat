@echo off
title Attendance Tracker - Shutdown
echo Stopping all services...

REM Kill PHP Artisan server
taskkill /F /IM php.exe /FI "WINDOWTITLE eq *artisan*" > nul 2>&1

REM Kill npm dev server
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *npm*" > nul 2>&1

REM Kill XAMPP services
taskkill /F /IM httpd.exe > nul 2>&1
taskkill /F /IM mysqld.exe > nul 2>&1

echo All services stopped.
pause
