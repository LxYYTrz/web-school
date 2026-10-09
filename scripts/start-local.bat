@echo off
rem line-twin local loop starter (IPC, no docker, no tunnel)
rem starts: backend :3000, edge collector, frontend dev server :5173
rem
rem 默认起 plc_collector.py(真实 PLC)。
rem 临时切回 mock:  set COLLECTOR=mock ^&^& start-local.bat
rem                     (开发机无 PLC 时用)

set ROOT=%~dp0..
set COLLECTOR=%COLLECTOR%
if "%COLLECTOR%"=="" set COLLECTOR=plc

if /i "%COLLECTOR%"=="mock" (
    set EDGE_SCRIPT=mock_collector.py
) else (
    set EDGE_SCRIPT=plc_collector.py
)

echo Starting line-twin local loop from %ROOT%
echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)

start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"
timeout /t 3 /nobreak >nul
start "lt-edge"   cmd /k "cd /d %ROOT%\edge && python %EDGE_SCRIPT%"
start "lt-web"    cmd /k "cd /d %ROOT%\web && npm run dev"

echo.
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
echo Keep all 3 windows open. Close them to stop.
echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&^& scripts\start-local.bat
