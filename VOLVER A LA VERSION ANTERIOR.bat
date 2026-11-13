@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Volver a la version anterior
set "H=C:\PROYECTOS FACU\SKILLS + REGLAS + CONOCIMIENTOS\herramientas"
powershell -NoProfile -ExecutionPolicy Bypass -File "%H%\volver.ps1" -Carpeta "%~dp0."
echo.
pause
