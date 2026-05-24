@echo off
cd /d "%~dp0"
set EXPO_NO_METRO_WORKSPACE_ROOT=1

echo ============================================
echo   Expo TUNNEL - QR for friend far away
echo ============================================
echo.
echo Before first time: npx expo login  (free account)
echo.

call npx expo start --tunnel --clear

echo.
if errorlevel 1 (
  echo [FAILED] Tunnel did not start.
  echo.
  echo Try:
  echo   1. npx expo login
  echo   2. npm install   (from project root folder)
  echo   3. Run this file again
  echo.
  echo Or use start-expo.cmd - same Wi-Fi only.
) else (
  echo Expo closed.
)

echo.
pause
