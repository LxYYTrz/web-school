@echo off
rem ============================================================================
rem 文件作用：工控机一键启动脚本（开 4 个窗口：中间件/后端/采集器/SSH 隧道）
rem 所属模块：scripts/
rem ============================================================================
rem
rem 【执行顺序与理由】
rem   ① 中间件（EMQX + Redis）必须最先起 —— 后端启动时就要连 MQTT 和 Redis
rem   ② 等 15 秒 —— 给容器初始化留时间（EMQX 首次启动较慢）
rem   ③ 后端 —— 连接 MQTT/Redis/数据库
rem   ④ 采集器 —— 开始产生数据
rem   ⑤ SSH 隧道 —— 让云端 Nginx 能访问到工控机后端
rem
rem 【为什么用 start "标题" cmd /k】
rem   start 会开**新窗口**（不影响当前窗口），cmd /k 表示"执行完命令后保持窗口不关"
rem   —— 后端/采集器/隧道都需要持续运行，窗口必须留着看日志。
rem
rem 【★ 使用前必改】
rem   下面两个变量：隧道用的云服务器账号和 IP。
rem
rem 【★ 重要提醒】
rem   lt-tunnel 那个窗口**绝对不能关**！隧道断 = 网站打不开（唯一单点）。
rem   稳定后请用 NSSM 把这条 ssh 命令注册成 Windows 服务，做到开机自启+断线重连。
rem ============================================================================

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
rem   -R 3300:127.0.0.1:3000 云端 3300 → 工控机 3000（Web 流量）
rem   -L 5432:127.0.0.1:5432 工控机 5432 → 云端 5432（数据库）
echo [4/4] 建立 SSH 隧道(此窗口不能关)...
start "lt-tunnel" cmd /k "ssh -N -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes -R 3300:127.0.0.1:3000 -L 5432:127.0.0.1:5432 %CLOUD_USER%@%CLOUD_HOST%"

rem ---- 完成提示 ----
echo.
echo 全部启动。验收:浏览器访问 http://%CLOUD_HOST% 应看到实时画面。
rem pause = 等待用户按键，保持当前窗口不闪退（方便看提示）
pause
