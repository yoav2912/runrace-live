@echo off

cd /d "%~dp0"

set EXPO_NO_METRO_WORKSPACE_ROOT=1

if exist .expo rmdir /s /q .expo

echo Clearing cache and starting Expo from apps\mobile ...

npx expo start --clear

