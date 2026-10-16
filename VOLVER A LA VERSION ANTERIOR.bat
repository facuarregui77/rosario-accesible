@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Volver a la version anterior
powershell -NoProfile -ExecutionPolicy Bypass -File "..\_herramientas\volver.ps1" -Carpeta "%~dp0."
echo.
pause
