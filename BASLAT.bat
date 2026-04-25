@echo off
title ISG Saha Gozlem Sunucusu
echo.
echo =============================================
echo   ISG Saha Gozlem Sistemi Baslatiliyor...
echo =============================================
echo.

cd /d "%~dp0"

echo [1/2] Uygulama derleniyor (build)...
call npx vite build
if errorlevel 1 (
    echo.
    echo HATA: Build basarisiz! 
    pause
    exit /b 1
)

echo.
echo [2/2] Sunucu baslatiliyor...
echo.

start http://localhost:8080

node server.cjs
pause
