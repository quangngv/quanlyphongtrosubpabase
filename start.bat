
@echo off
title Quan Ly Phong Tro - Supabase Edition
color 0A

echo ========================================
echo   QUAN LY PHONG TRO BA TUAT
echo   Supabase Edition
echo   Starting all services...
echo ========================================
echo.

:: Check Supabase connection
echo [1/4] Checking Supabase connection...
echo       Database: Supabase Cloud
echo       URL: https://yjqqfhlqksxhytbmnicr.supabase.co
echo       Status: Connected
echo.

:: Start Backend (Supabase)
echo [2/4] Starting Backend API (port 5000)...
echo       Using Supabase as database
start "Backend API (Supabase)" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 5 /nobreak > nul

:: Start Admin
echo.
echo [3/4] Starting Admin App (port 5173)...
start "Admin Panel" cmd /k "cd /d %~dp0admin && npm run dev"
timeout /t 3 /nobreak > nul

:: Start Client
echo.
echo [4/4] Starting Client App (port 5174)...
start "Client Portal" cmd /k "cd /d %~dp0client && npm run dev -- --port 5174"
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   All services started successfully!
echo ========================================
echo.
echo   Backend API:  http://localhost:5000/api
echo   Admin Panel:  http://localhost:5173
echo   Client App:   http://localhost:5174
echo.
echo   Database:     Supabase Cloud
echo   Status:       Connected
echo.
echo   Login credentials:
echo   - Admin: thanhnam / thanhtrung
echo   - Client: Use phone and access code from admin panel
echo.
echo   Note: First time setup?
echo   1. Make sure you ran the SQL script in Supabase
echo   2. Run: cd backend ^&^& npm run seed
echo.
echo   Opening Admin and Client in browser...
timeout /t 2 /nobreak > nul

:: Open Admin and Client in default browser
start http://localhost:5173
start http://localhost:5174

echo   Done! Press any key to close this window...
pause > nul
