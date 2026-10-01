@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Generar GUIA.pdf y FOLLETO.pdf

rem Vuelve a crear los dos PDF de la carpeta del proyecto a partir de guia.html y folleto.html.
rem Usa Google Chrome en modo invisible (no abre ninguna ventana).

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo No encuentro Google Chrome en esta computadora.
  echo Alternativa: abri guia.html y folleto.html en el navegador y usa
  echo Imprimir - Guardar como PDF, tamano A4, con "Graficos de fondo" tildado.
  pause
  exit /b 1
)

echo Generando GUIA.pdf ...
"%CHROME%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%~dp0..\..\GUIA.pdf" "%~dp0guia.html" 2>nul
echo Generando FOLLETO.pdf ...
"%CHROME%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%~dp0..\..\FOLLETO.pdf" "%~dp0folleto.html" 2>nul

echo.
echo Listo. Los dos PDF quedaron en la carpeta del proyecto.
echo (Si alguno estaba abierto en un visor, cerralo y volve a correr este archivo.)
pause
