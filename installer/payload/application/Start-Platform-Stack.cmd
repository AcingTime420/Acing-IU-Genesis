@echo off
setlocal EnableExtensions
title Acing IU — Start Platform Stack

set "PLATFORM=%~dp0..\platform"
cd /d "%PLATFORM%" || (
  echo ERROR: platform folder not found at %PLATFORM%
  exit /b 1
)

if not exist "docker-compose.yml" (
  echo ERROR: docker-compose.yml missing. Reinstall with Docker stack component.
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker is not installed or not on PATH.
  echo Install Docker Desktop for Windows, then retry.
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    echo Creating .env from .env.example — edit secrets before production use.
    copy /Y ".env.example" ".env" >nul
  )
)

echo Building and starting Acing IU stack...
docker compose up -d --build
if errorlevel 1 (
  echo docker compose failed.
  exit /b 1
)

echo.
echo Waiting for gateway...
timeout /t 8 /nobreak >nul
curl -s http://localhost:8080/health/live
echo.
echo.
echo Stack started. Gateway: http://localhost:8080
echo Identity Swagger is on the identity container; use gateway /api/auth/*
echo Run smoke test from Control Center menu option [4].
exit /b 0
