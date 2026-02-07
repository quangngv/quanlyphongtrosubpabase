@echo off
title Stop All Services
color 0C

echo ========================================
echo   Stopping all services...
echo ========================================
echo.

:: Kill all node processes
echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   Node.js processes stopped.
) else (
    echo   No Node.js processes found.
)

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
pause
