@echo off
rem ============================================================
rem  line-twin 工控机一键启动
rem  用法:把本文件放在 line-twin 根目录,先修改下方两个变量
rem  会打开 4 个窗口:中间件 / 后端 / 采集器 / SSH 隧道
rem ============================================================

set CLOUD_USER=linetwin
set CLOUD_HOST=119.91.145.27

set ROOT=%~dp0

echo [1/4] 启动中间件(EMQX/Redis/MinIO,需要 Docker Desktop)...
start "lt-middleware" cmd /k "docker compose -f %ROOT%deploy\docker-compose.ipc.yml up"

echo 等待中间件就绪(15s)...
timeout /t 15 /nobreak >nul

echo [2/4] 启动后端...
start "lt-backend" cmd /k "cd /d %ROOT%server && node dist\main.js"

echo [3/4] 启动采集器(mock)...
start "lt-collector" cmd /k "cd /d %ROOT%edge && python mock_collector.py"

echo [4/4] 建立 SSH 隧道(此窗口不能关)...
start "lt-tunnel" cmd /k "ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 %CLOUD_USER%@%CLOUD_HOST%"

echo.
echo 全部启动。验收:浏览器访问 http://%CLOUD_HOST% 应看到实时画面。
pause
