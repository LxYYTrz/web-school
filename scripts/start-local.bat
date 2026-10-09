@echo off
rem line-twin local loop starter (IPC, no docker, no tunnel)
rem starts: backend :3000, mock collector, frontend dev server :5173
set ROOT=%~dp0..
echo Starting line-twin local loop from %ROOT%
start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"
timeout /t 3 /nobreak >nul
start "lt-edge" cmd /k "cd /d %ROOT%\edge && python mock_collector.py"
start "lt-web" cmd /k "cd /d %ROOT%\web && npm run dev"
echo.
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
echo Keep all 3 windows open. Close them to stop.
