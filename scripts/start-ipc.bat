@echo off
rem ============================================================
rem  line-twin 工控机一键启动
rem  用法:把本文件放在 line-twin 根目录,先修改下方两个变量
rem  会打开 4 个窗口:中间件 / 后端 / 采集器 / SSH 隧道
rem ============================================================

rem 隧道用的云服务器 SSH 用户名（不要用 root）
set CLOUD_USER=linetwin
rem 云服务器 IP（或域名）
set CLOUD_HOST=119.91.145.27

rem ROOT = 当前批处理所在目录的路径（%~dp0 展开为驱动器+路径，带结尾反斜杠）
set ROOT=%~dp0

rem ---- ① 启动中间件（需要 Docker Desktop）----
echo [1/4] 启动中间件(EMQX/Redis,需要 Docker Desktop)...
start "lt-middleware" cmd /k "docker compose -f %ROOT%deploy\docker-compose.ipc.yml up"

rem ---- 等待中间件就绪 ----
echo 等待中间件就绪(15s)...
rem /t 15 = 等待 15 秒；/nobreak = 允许重定向输出（避免"按键继续"提示）
timeout /t 15 /nobreak >nul

rem ---- ② 启动后端 ----
rem cd /d = 切换目录（/d 表示跨盘符也能切）
rem node dist\main.js = 运行编译后的产物（dist 由 npm run build 生成）
echo [2/4] 启动后端...
start "lt-backend" cmd /k "cd /d %ROOT%server && node dist\main.js"

rem ---- ③ 启动采集器(mock)----
echo [3/4] 启动采集器(mock)...
start "lt-collector" cmd /k "cd /d %ROOT%edge && python mock_collector.py"

rem ---- ④ 建立 SSH 隧道 ----
rem   -N                     不执行远程命令，只做端口转发
rem   -o ServerAliveInterval=15  每 15 秒发一次保活包
rem   -o ServerAliveCountMax=3    连续 3 次没回应就断开（触发重连）
rem   -o ExitOnForwardFailure=yes 端口转发失败就直接退出（避免"假活"隧道）
rem   -R 172.18.0.1:3300:127.0.0.1:3000 云端 3300 → 工控机 3000（Web 流量）
rem   -R 172.18.0.1:3300:127.0.0.1:3000 云端 3300 → 工控机 3000（后端/网站转发）
echo [4/4] 建立 SSH 隧道(此窗口不能关)...
start "lt-tunnel" cmd /k "ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 172.18.0.1:3300:127.0.0.1:3000 %CLOUD_USER%@%CLOUD_HOST%"

rem ---- 完成提示 ----
echo.
echo 全部启动。验收:浏览器访问 http://%CLOUD_HOST% 应看到实时画面。
rem pause = 等待用户按键，保持当前窗口不闪退（方便看提示）
pause
