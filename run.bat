@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\.bin\next.exe" (
  echo Next.js dependencies are missing.
  echo Run npm install first, then launch run.bat again.
  pause
  exit /b 1
)

echo Starting the accounting website at http://127.0.0.1:3000
call "node_modules\.bin\next.exe" dev -p 3000 -H 127.0.0.1

endlocal
