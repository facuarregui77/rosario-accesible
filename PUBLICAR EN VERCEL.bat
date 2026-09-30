@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Publicar Rosario Access Map en Vercel

echo ==========================================================
echo   PUBLICAR EN VERCEL (access-app-rosario.vercel.app)
echo ==========================================================
echo.
echo 1) Verifico si Vercel me reconoce...
call npx vercel whoami >nul 2>&1
if errorlevel 1 (
  echo    No hay sesion. Se va a abrir una direccion en el navegador:
  echo    entra, toca "Confirm" y volve a esta ventana.
  echo.
  call npx vercel login
  if errorlevel 1 (
    echo.
    echo    No se pudo iniciar sesion. Cerra esta ventana y volve a intentar.
    pause
    exit /b 1
  )
)

echo.
echo 2) Compilo y publico la version nueva (tarda 1 minuto)...
call npx vercel --prod --yes
if errorlevel 1 (
  echo.
  echo    Fallo la publicacion. Mostrale este mensaje a Claude.
  pause
  exit /b 1
)

echo.
echo 3) Conecto el proyecto con GitHub para que se publique solo con cada "subir"...
call npx vercel git connect --yes
echo    (Si arriba dice que ya estaba conectado o pide instalar la app de GitHub, esta bien.)

echo.
echo ==========================================================
echo   LISTO. La app esta publicada en https://access-app-rosario.vercel.app
echo ==========================================================
pause
