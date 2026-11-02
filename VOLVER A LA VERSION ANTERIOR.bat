@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Volver a la version anterior
set "H=..\SKILLS + REGLAS + CONOCIMIENTOS\herramientas"
if not exist "%H%\volver.ps1" set "H=..\SKILLS + REGLAS\herramientas"
powershell -NoProfile -ExecutionPolicy Bypass -File "%H%\volver.ps1" -Carpeta "%~dp0."
echo.
pause
