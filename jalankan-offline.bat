@echo off
title PT Mencari Cinta Sejati - Offline
cd /d "%~dp0"
echo Menyalakan server offline... browser akan terbuka otomatis.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0jalankan-offline.ps1"
echo.
echo Server berhenti.
pause
