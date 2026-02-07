@echo off
title Build Admin & Client
color 0A

echo ========================================
echo   Building Admin and Client
echo ========================================
echo.

echo [1/2] Building Admin...
cd /d %~dp0admin
call npm run build
if errorlevel 1 (
    echo       Admin build FAILED!
    pause
    exit /b 1
)
echo       Admin build completed!
echo.

echo [2/2] Building Client...
cd /d %~dp0client
call npm run build
if errorlevel 1 (
    echo       Client build FAILED!
    pause
    exit /b 1
)
echo       Client build completed!
echo.

echo ========================================
echo   Build completed successfully!
echo ========================================
echo.
echo   Output folders:
echo   - admin/dist
echo   - client/dist
echo.
pause
