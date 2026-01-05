@echo off
title GolazoStore - Launcher
color 0B

:: Limpiar procesos anteriores si quedaron colgados
taskkill /F /IM node.exe >nul 2>&1

echo.
echo  ==============================================
echo       GOLAZOSTORE - LANZADOR DEL PROYECTO
echo  ==============================================
echo.
echo  1. Iniciando API Backend en puerto 3000...
echo     (No cierres esta ventana negra)
echo.
echo  2. Para ver la pagina web:
echo     - Abre Visual Studio Code
echo     - Ve al archivo index.html
echo     - Click derecho -> "Open with Live Server"
echo     - O usa el puerto 5500 en tu navegador
echo.
echo  ==============================================
echo.

cd backend
node server.js
pause
