@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Generar el video tutorial de Rosario Access Map

echo.
echo   Arma "VIDEO TUTORIAL.mp4": graba la app, le pone voz y subtitulos.
echo   Tarda unos 5 minutos. No hace falta tocar nada mientras tanto.
echo.

where ffmpeg >nul 2>nul || (
  echo   Falta el programa ffmpeg. Instalandolo...
  winget install --id Gyan.FFmpeg -e --accept-source-agreements --accept-package-agreements
  echo   Listo. Cerra esta ventana y volve a hacer doble clic para que lo tome.
  pause
  exit /b 1
)
python -c "import edge_tts" 2>nul || (
  echo   Instalando la voz...
  python -m pip install --quiet edge-tts
)

echo   Preparando la app...
call npm run build >nul 2>nul
if errorlevel 1 (
  echo   No se pudo preparar la app. Corre "npm install" en esta carpeta y volve a probar.
  pause
  exit /b 1
)
node scripts\video\grabar-tutorial.mjs
if errorlevel 1 (
  echo.
  echo   Algo fallo. Fijate que haya internet y que Google Chrome este instalado, y volve a probar.
  pause
  exit /b 1
)
echo.
echo   Abriendo el video...
start "" "VIDEO TUTORIAL.mp4"
pause
