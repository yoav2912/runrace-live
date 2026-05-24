@echo off
cd /d "%~dp0"
set EXPO_NO_METRO_WORKSPACE_ROOT=1
echo Starting Expo from apps\mobile ...
npx expo start --clear
