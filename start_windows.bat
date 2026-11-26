@echo off
setlocal enabledelayedexpansion
title Narrative Engine v3 - Universal Launcher (Windows)

echo =====================================================================
echo              NARRATIVE ENGINE v3 - UNIVERSAL LAUNCHER
echo            Narrative-to-Code Orchestrator ^& Visual IDE
echo =====================================================================
echo.

:: 1. Detect Node.js and npm
echo [1/3] Checking Node.js environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] npm package manager is not found!
    echo.
    pause
    exit /b 1
)

echo   Found Node.js:
node --version
call npm --version

:: 2. Setup Dependencies
echo.
echo [2/3] Checking project dependencies...
cd /d "%~dp0."

if not exist "node_modules" (
    echo   Installing project dependencies [first run only]...
    call npm install
)

if not exist "shared\dist" (
    echo   Building shared package...
    call npm run build:shared
)

:: 3. Launch Servers & Open Browser
echo.
echo Freeing ports 3001 and 5173 if previously occupied...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\free_ports.ps1" >nul 2>&1

echo =====================================================================
echo   Starting Narrative Engine Services:
echo   - Backend API ^& MCP: http://127.0.0.1:3001
echo   - Frontend Web IDE:  http://127.0.0.1:5173
echo =====================================================================
echo.
echo Opening Narrative Engine in your default browser...

call npm run dev

echo.
echo Narrative Engine services have stopped.
pause
