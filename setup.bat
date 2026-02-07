@echo off
title Setup - Quan Ly Phong Tro
color 0B

echo ========================================
echo   QUAN LY PHONG TRO BA TUAT
echo   Supabase Edition - Setup Script
echo ========================================
echo.

echo This script will:
echo   1. Install all dependencies
echo   2. Configure environment variables
echo   3. Prepare the application
echo.
pause

:: Install Backend Dependencies
echo.
echo [1/3] Installing Backend dependencies...
cd /d %~dp0backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

:: Install Admin Dependencies
echo.
echo [2/3] Installing Admin dependencies...
cd /d %~dp0admin
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install admin dependencies
    pause
    exit /b 1
)

:: Install Client Dependencies
echo.
echo [3/3] Installing Client dependencies...
cd /d %~dp0client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Create tables in Supabase:
echo      - Go to https://yjqqfhlqksxhytbmnicr.supabase.co
echo      - Open SQL Editor
echo      - Run the script from: backend\src\migrations\create_tables.sql
echo.
echo   2. Seed sample data:
echo      - cd backend
echo      - npm run seed
echo.
echo   3. Start the application:
echo      - Run start.bat
echo.
pause
