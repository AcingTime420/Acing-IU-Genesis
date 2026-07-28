@echo off
setlocal EnableExtensions
title Acing IU: Genesis — Menu

set "ROOT=%~dp0.."
set "PLATFORM=%ROOT%\platform"
set "APP=%~dp0"

:menu
cls
echo.
echo  ============================================
echo   Acing IU: Genesis Control Center
echo  ============================================
echo.
echo   [1] Start platform stack (Docker Compose)
echo   [2] Stop platform stack
echo   [3] View stack status
echo   [4] Run auth + trust smoke test
echo   [5] Open documentation folder
echo   [6] Open logs folder
echo   [7] Regenerate local security token
echo   [0] Exit
echo.
set /p CHOICE="  Select option: "

if "%CHOICE%"=="1" goto start_stack
if "%CHOICE%"=="2" goto stop_stack
if "%CHOICE%"=="3" goto status_stack
if "%CHOICE%"=="4" goto smoke
if "%CHOICE%"=="5" goto docs
if "%CHOICE%"=="6" goto logs
if "%CHOICE%"=="7" goto token
if "%CHOICE%"=="0" exit /b 0
goto menu

:start_stack
if not exist "%PLATFORM%\docker-compose.yml" (
  echo Platform stack not installed. Re-run setup with "Docker Compose" component checked.
  pause
  goto menu
)
call "%APP%Start-Platform-Stack.cmd"
pause
goto menu

:stop_stack
if not exist "%PLATFORM%\docker-compose.yml" (
  echo Platform stack not found.
  pause
  goto menu
)
cd /d "%PLATFORM%"
docker compose down
pause
goto menu

:status_stack
if not exist "%PLATFORM%\docker-compose.yml" (
  echo Platform stack not found.
  pause
  goto menu
)
cd /d "%PLATFORM%"
docker compose ps
echo.
curl -s http://localhost:8080/health/live 2>nul || echo Gateway not responding on :8080
pause
goto menu

:smoke
if not exist "%PLATFORM%\scripts\smoke-auth.sh" (
  echo Smoke script not found under platform\scripts
  pause
  goto menu
)
cd /d "%PLATFORM%"
REM Git Bash or WSL preferred for .sh; fallback message
where bash >nul 2>&1
if %ERRORLEVEL%==0 (
  bash scripts/smoke-auth.sh
) else (
  echo Install Git Bash or WSL to run smoke-auth.sh
  echo Or: docker compose exec is not required — script hits localhost:8080
)
pause
goto menu

:docs
start "" "%ROOT%\documentation"
goto menu

:logs
start "" "%ROOT%\logs"
goto menu

:token
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\services\mcp-server\scripts\generate-token.ps1"
pause
goto menu
