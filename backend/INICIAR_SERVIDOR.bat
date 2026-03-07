@echo off
title GolazoStore - Servidor Backend
color 0A
echo.
echo  =========================================
echo       GOLAZOSTORE - SERVIDOR BACKEND
echo  =========================================
echo.
echo  Iniciando API BACKEND en http://localhost:3000
echo  (El frontend/web debe abrirse en http://localhost:5500 con Live Server)
echo  Presiona Ctrl+C para detener
echo.
echo  =========================================
echo.

cd /d "%~dp0"
node server.js

echo.
echo  El servidor se detuvo.
pause
