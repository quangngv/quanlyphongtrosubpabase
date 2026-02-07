@echo off
title Seed Database - Quan Ly Phong Tro
color 0E

echo ========================================
echo   SEED DATABASE - SUPABASE
echo ========================================
echo.

echo This will create sample data in Supabase:
echo   - Default admin account (thanhnam/thanhtrung)
echo   - 5 sample rooms
echo   - 2 tenant accounts with access codes
echo.
echo Make sure you have run the SQL script first!
echo (backend\src\migrations\create_tables.sql in Supabase SQL Editor)
echo.
pause

cd /d %~dp0backend
call npm run seed

echo.
echo Press any key to close...
pause > nul
