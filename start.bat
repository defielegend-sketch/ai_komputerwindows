@echo off
setlocal
title AI Komputer
cd /d "%~dp0"

echo.
echo  ============================================
echo             AI KOMPUTER  v1.0
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] Node.js tidak ditemukan.
  echo      Instal Node.js dari https://nodejs.org lalu coba lagi.
  echo.
  pause
  exit /b 1
)

netstat -ano | findstr "127.0.0.1:8787" | findstr "LISTENING" >nul
if not errorlevel 1 (
  echo  Server sudah berjalan. Membuka browser...
  start "" "http://127.0.0.1:8787"
  timeout /t 2 >nul
  exit /b 0
)

if not exist "node_modules\express" (
  echo  Memasang dependensi pertama kali...
  call npm install --no-fund --no-audit
  if errorlevel 1 (
    echo.
    echo  [!] Gagal memasang dependensi. Periksa koneksi internet.
    pause
    exit /b 1
  )
)

echo  Membuka http://127.0.0.1:8787 ...
start "" "http://127.0.0.1:8787"

node server.js
echo.
echo  Server berhenti.
pause
