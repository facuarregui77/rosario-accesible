@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir a GitHub
set "H=C:\PROYECTOS FACU\SKILLS + REGLAS + CONOCIMIENTOS\herramientas"
powershell -NoProfile -ExecutionPolicy Bypass -File "%H%\subir.ps1" -Carpeta "%~dp0."
echo.
pause
