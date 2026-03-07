@echo off
title GolazoStore - Desarrollo
color 0B
setlocal

set "ROOT=%~dp0"

echo.
echo  ==============================================
echo      GOLAZOSTORE - DESARROLLO LOCAL
echo  ==============================================
echo.
echo  Levantando:
echo   - Backend con autorestart en http://localhost:3000
echo   - Frontend con live reload en http://localhost:8000/frontend/home.html
echo.

start "GolazoStore Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"
start "GolazoStore Frontend" cmd /k "cd /d "%ROOT%" && npm run frontend:dev"

timeout /t 5 /nobreak >nul
start "" http://localhost:8000/frontend/home.html

echo  Se abrieron dos ventanas nuevas y el navegador.
echo  - Backend: reinicia solo cuando cambias codigo backend.
echo  - Frontend: recarga solo cuando cambias archivos en frontend.
echo  Cierra esas ventanas para detener el entorno.
echo.
pause
