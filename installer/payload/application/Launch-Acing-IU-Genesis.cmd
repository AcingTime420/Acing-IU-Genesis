@echo off
setlocal EnableExtensions
title Acing IU: Genesis — Control Center

set "ROOT=%~dp0.."
set "LOGDIR=%ROOT%\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

echo.
echo  ============================================
echo   Acing IU: Genesis  v0.1.0
echo   Control Center
echo  ============================================
echo.

REM Prefer Windows Terminal if available
where wt >nul 2>&1
if %ERRORLEVEL%==0 (
  wt -d "%ROOT%" cmd /k "%~dp0Control-Center-Menu.cmd"
  exit /b 0
)

call "%~dp0Control-Center-Menu.cmd"
