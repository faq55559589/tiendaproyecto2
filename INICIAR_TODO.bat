@echo off
setlocal EnableExtensions
title GolazoStore - Desarrollo Local
color 0B

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND_DIR=%ROOT%\backend"
set "BACKEND_PORT=3000"
set "FRONTEND_PORT=8000"
set "FRONTEND_URL=http://localhost:%FRONTEND_PORT%/frontend/home.html"

echo.
echo ==============================================
echo   GOLAZOSTORE - ENTORNO LOCAL
echo ==============================================
echo.
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: %FRONTEND_URL%
echo.

call :stop_port %BACKEND_PORT% Backend
if errorlevel 1 goto :fail

call :stop_port %FRONTEND_PORT% Frontend
if errorlevel 1 goto :fail

echo [1/4] Levantando backend...
start "GolazoStore Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && node ..\scripts\dev-backend.js"

echo [2/4] Levantando frontend...
start "GolazoStore Frontend" cmd /k "cd /d ""%ROOT%"" && node scripts\serve-frontend.js"

echo [3/4] Esperando backend en puerto %BACKEND_PORT%...
call :wait_for_port %BACKEND_PORT% 20
if errorlevel 1 (
    echo [ERROR] El backend no quedo disponible en %BACKEND_PORT%.
    goto :fail
)

echo [4/4] Esperando frontend en puerto %FRONTEND_PORT%...
call :wait_for_port %FRONTEND_PORT% 20
if errorlevel 1 (
    echo [ERROR] El frontend no quedo disponible en %FRONTEND_PORT%.
    goto :fail
)

echo.
echo [OK] Entorno local levantado.
echo Abriendo navegador...
start "" "%FRONTEND_URL%"
goto :end

:stop_port
set "TARGET_PORT=%~1"
set "TARGET_NAME=%~2"
echo [INFO] Liberando %TARGET_NAME% en puerto %TARGET_PORT% si existe...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$conns = Get-NetTCPConnection -State Listen -LocalPort %TARGET_PORT% -ErrorAction SilentlyContinue; " ^
    "if (-not $conns) { exit 0 }; " ^
    "$procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique; " ^
    "foreach ($procId in $procIds) { try { Stop-Process -Id $procId -Force -ErrorAction Stop; Write-Host ('  Proceso detenido: ' + $procId) } catch { Write-Host ('  No se pudo detener PID ' + $procId + ': ' + $_.Exception.Message); exit 1 } }"
exit /b %errorlevel%

:wait_for_port
set "WAIT_PORT=%~1"
set "WAIT_SECONDS=%~2"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$deadline = (Get-Date).AddSeconds(%WAIT_SECONDS%); " ^
    "while ((Get-Date) -lt $deadline) { " ^
    "  if (Get-NetTCPConnection -State Listen -LocalPort %WAIT_PORT% -ErrorAction SilentlyContinue) { exit 0 }; " ^
    "  Start-Sleep -Milliseconds 500; " ^
    "} " ^
    "exit 1"
exit /b %errorlevel%

:fail
echo.
echo Revisa las ventanas "GolazoStore Backend" y "GolazoStore Frontend".

:end
echo.
pause
