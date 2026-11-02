@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir a GitHub
set "H=..\SKILLS + REGLAS + CONOCIMIENTOS\herramientas"
if not exist "%H%\subir.ps1" set "H=..\SKILLS + REGLAS\herramientas"
powershell -NoProfile -ExecutionPolicy Bypass -File "%H%\subir.ps1" -Carpeta "%~dp0."
echo.
pause
