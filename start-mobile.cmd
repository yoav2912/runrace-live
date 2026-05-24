@echo off
title RunRace Mobile
cd /d "%~dp0apps\mobile"
set EXPO_NO_METRO_WORKSPACE_ROOT=1
echo.
echo === RunRace Mobile (Expo) ===
echo Folder: %CD%
echo.
call npx expo start --clear
pause
