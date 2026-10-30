@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir a GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "..\SKILLS + REGLAS\herramientas\subir.ps1" -Carpeta "%~dp0."
echo.
pause
