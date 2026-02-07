@echo off
title Clear Database - Quan Ly Phong Tro
color 0C

echo ========================================
echo   XOA TAT CA DU LIEU MAU
echo ========================================
echo.
echo CANH BAO: Script nay se xoa:
echo   - Tat ca phong tro
echo   - Tat ca nguoi thue
echo   - Tat ca lich su thanh toan
echo   - Tat ca tai khoan client
echo.
echo Tai khoan admin se KHONG bi xoa.
echo.
echo Ban co chac chan muon tiep tuc?
pause

cd /d %~dp0backend
call node src/clear-data.js

echo.
echo Press any key to close...
pause > nul
