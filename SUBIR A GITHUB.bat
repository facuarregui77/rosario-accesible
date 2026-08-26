@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir a GitHub
powershell -NoProfile -ExecutionPolicy Bypass -File "..\_herramientas\subir.ps1" -Carpeta "%~dp0."
echo.
pause
