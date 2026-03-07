@echo off
setlocal EnableExtensions EnableDelayedExpansion
title GolazoStore - Desarrollo
color 0B

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=8000"
set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%/frontend/home.html"
set "BACKEND_START=cd /d ""%BACKEND_DIR%"" && node ..\scripts\dev-backend.js"
set "FRONTEND_START=cd /d ""%FRONTEND_DIR%"" && node scripts\serve-frontend.js"

echo.
echo  ==============================================
echo      GOLAZOSTORE - DESARROLLO LOCAL
echo  ==============================================
echo.
echo  Punto de entrada oficial:
echo   - Backend:  http://localhost:%BACKEND_PORT%
echo   - Frontend: %FRONTEND_URL%
echo.

call :kill_port %BACKEND_PORT% Backend
call :kill_port %FRONTEND_PORT% Frontend

echo  [1/4] Levantando backend...
start "GolazoStore Backend" cmd /k "%BACKEND_START%"

echo  [2/4] Levantando frontend...
start "GolazoStore Frontend" cmd /k "%FRONTEND_START%"

echo  [3/4] Validando backend en puerto %BACKEND_PORT%...
call :wait_for_port %BACKEND_PORT% 15
if errorlevel 1 (
    echo  [ERROR] El backend no quedo escuchando en %BACKEND_PORT%.
    echo  Revisa la ventana "GolazoStore Backend".
    goto :end
)

echo  [4/4] Validando frontend en puerto %FRONTEND_PORT%...
call :wait_for_port %FRONTEND_PORT% 15
if errorlevel 1 (
    echo  [ERROR] El frontend no quedo escuchando en %FRONTEND_PORT%.
    echo  Revisa la ventana "GolazoStore Frontend".
    goto :end
)

echo.
echo  [OK] Backend y frontend levantados correctamente.
echo  - Backend reinicia solo cuando cambias codigo backend.
echo  - Frontend recarga solo cuando cambias archivos en frontend.
echo.
start "" explorer "%FRONTEND_URL%"

:end
echo  Cierra las ventanas de backend/frontend para detener el entorno.
echo.
pause
goto :eof

:kill_port
set "TARGET_PORT=%~1"
set "TARGET_NAME=%~2"
set "FOUND_PID="
set "SEEN_PIDS= "

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /r /c:":%TARGET_PORT% .*LISTENING"') do (
    set "PID=%%P"
    echo !SEEN_PIDS! | findstr /c:" !PID! " >nul
    if errorlevel 1 (
        set "SEEN_PIDS=!SEEN_PIDS!!PID! "
        set "FOUND_PID=1"
        echo  [INFO] Cerrando proceso !PID! que ocupaba %TARGET_NAME% ^(puerto %TARGET_PORT%^)^...
        taskkill /PID !PID! /F >nul 2>&1
    )
)

if not defined FOUND_PID (
    echo  [INFO] %TARGET_NAME% libre en puerto %TARGET_PORT%.
)
exit /b 0

:wait_for_port
set "WAIT_PORT=%~1"
set /a "WAIT_TRIES=%~2"

:wait_loop
netstat -ano | findstr /r /c:":%WAIT_PORT% .*LISTENING" >nul
if not errorlevel 1 exit /b 0

set /a "WAIT_TRIES-=1"
if %WAIT_TRIES% LEQ 0 exit /b 1

timeout /t 1 /nobreak >nul
goto :wait_loop
