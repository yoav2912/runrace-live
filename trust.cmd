@echo off
chcp 65001 >nul
setlocal

if "%~1"=="" goto usage
if "%~2"=="" goto usage

set USER=%~1
set AMT=%~2
set API=https://runrace-api.onrender.com
set KEY=runrace-dev-trust-key
set OUT=%TEMP%\runrace-trust-out.txt

if "%AMT:~0,1%"=="=" (
  set SCORE=%AMT:~1%
  curl.exe -s -o "%OUT%" -X POST "%API%/api/dev/trust" -H "Content-Type: application/json" -H "x-admin-key: %KEY%" -d "{\"username\":\"%USER%\",\"trustScore\":%SCORE%}"
) else (
  curl.exe -s -o "%OUT%" -X POST "%API%/api/dev/trust" -H "Content-Type: application/json" -H "x-admin-key: %KEY%" -d "{\"username\":\"%USER%\",\"delta\":%AMT%}"
)

type "%OUT%"
echo.

findstr /C:"ok\":true" "%OUT%" >nul 2>&1 && (
  echo [הצלחה] התנתק והתחבר באפל.
  exit /b 0
)

findstr /C:"Cannot POST" "%OUT%" >nul 2>&1 && (
  echo.
  echo [שגיאה] הקוד החדש עדיין לא על Render.
  echo   1. git add . ^& git commit -m "trust cmd" ^& git push
  echo   2. Render - runrace-api - Deploy live
  echo   3. Environment: ADMIN_API_KEY = runrace-dev-trust-key
  exit /b 1
)

echo [לא הצליח] בדוק username ו-ADMIN_API_KEY ב-Render.
exit /b 1

:usage
echo.
echo   trust.cmd שם_משתמש כמות
echo   trust.cmd runner_2433 80
echo   trust.cmd runner_2433 =100
exit /b 1
