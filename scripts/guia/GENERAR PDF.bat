@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Generar documentos de Rosario Access Map

rem Vuelve a crear, a partir de los archivos de esta carpeta:
rem   - las imagenes para redes (carpeta piezas-redes)   <- piezas.html
rem   - GUIA.pdf                                          <- guia.html
rem   - FOLLETO.pdf                                       <- folleto.html
rem   - PLAN DE DIFUSION.pdf                              <- difusion.html
rem Usa Google Chrome en modo invisible (no abre ninguna ventana).

set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo No encuentro Google Chrome en esta computadora.
  echo Alternativa: abri los archivos .html en el navegador y usa
  echo Imprimir - Guardar como PDF, tamano A4, con "Graficos de fondo" tildado.
  pause
  exit /b 1
)

echo Generando las imagenes para redes ...
set "CHROME=%CHROME%"
call node "%~dp0exportar-piezas.mjs"
if errorlevel 1 echo   (No se pudieron generar las imagenes: hace falta Node.js y correr "npm install" en el proyecto.)

echo Generando GUIA.pdf ...
"%CHROME%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%~dp0..\..\GUIA.pdf" "%~dp0guia.html" 2>nul
echo Generando FOLLETO.pdf ...
"%CHROME%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%~dp0..\..\FOLLETO.pdf" "%~dp0folleto.html" 2>nul
echo Generando PLAN DE DIFUSION.pdf ...
"%CHROME%" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="%~dp0..\..\PLAN DE DIFUSION.pdf" "%~dp0difusion.html" 2>nul

echo.
echo Listo. Los PDF quedaron en la carpeta del proyecto y las imagenes en piezas-redes.
echo (Si alguno estaba abierto en un visor, cerralo y volve a correr este archivo.)
pause
