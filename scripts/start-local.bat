@echo off
rem ============================================================================
rem 文件作用：本地闭环一键启动脚本（后端 + 采集器 + 前端 dev）
rem 所属模块：scripts/
rem ============================================================================
rem
rem 【用途】
rem   在**工控机本地**跑一个完整的闭环，不需要 Docker、不需要云服务器、
rem   不需要 SSH 隧道、不需要联网：
rem     - 后端   http://localhost:3000   （读本机 Mosquitto/Memurai/PostgreSQL）
rem     - 采集器 python <plc_collector.py | mock_collector.py>
rem     - 前端   http://localhost:5173   （Vite dev server，热更新）
rem
rem   这是 docs/工控机部署手册-U盘版.md 第 5 节要求的启动方式。
rem
rem 【★ 采集器选择（COLLECTOR）】
rem   默认用 **plc_collector.py**（真实 PLC，现场用）。
rem   开发机没有 PLC 时切回 mock：
rem       set COLLECTOR=mock && scripts\start-local.bat
rem   两者实现的是同一套数据契约，云端/前端/数据库零改动。
rem
rem 【前置条件】
rem   Windows 上已装好并启动：Mosquitto(1883) / Memurai(6379) / PostgreSQL+TimescaleDB(5432)
rem   且数据库已按手册 3.2 节初始化（001_init.sql 执行过）。
rem   server\.env 已预置正确配置。
rem   web\node_modules 与 server\dist 已存在（开发机打好的部署包自带）。
rem
rem 【为什么先起后端再起采集器】
rem   顺序：后端（订阅 MQTT）→ 采集器（发布 MQTT）。
rem   如果反了，采集器先发的数据后端没订阅到，会漏掉开头一小段；
rem   但因为状态类消息是 retained 的，后起来的后端依然能拿到最新状态，所以影响不大。
rem
rem 【验收（见部署手册 5 节）】
rem   1. curl http://localhost:3000/api/lines/line-01/snapshot → robots 非空
rem   2. 浏览器打开 http://localhost:5173 → 机械臂在动、计数在跳
rem   3. lt-edge 窗口有数据滚动；lt-server 窗口无红色报错
rem ============================================================================

rem ROOT = 上一级目录（line-twin 根目录）
set ROOT=%~dp0..

rem ---- 采集器选择：读环境变量 COLLECTOR，默认为 plc ----
set COLLECTOR=%COLLECTOR%
if "%COLLECTOR%"=="" set COLLECTOR=plc

rem 根据 COLLECTOR 决定跑哪个采集器脚本
if /i "%COLLECTOR%"=="mock" (
    set EDGE_SCRIPT=mock_collector.py
) else (
    set EDGE_SCRIPT=plc_collector.py
)

echo Starting line-twin local loop from %ROOT%
echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)

rem ---- ① 启动后端（3000 端口）----
rem cd /d 切目录；node dist\main.js 运行编译产物
start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"

rem ---- 等待 3 秒，避免采集器比后端先发数据 ----
timeout /t 3 /nobreak >nul

rem ---- ② 启动采集器（plc 或 mock）----
start "lt-edge"   cmd /k "cd /d %ROOT%\edge && python %EDGE_SCRIPT%"

rem ---- ③ 启动前端 dev server（5173 端口）----
rem npm run dev 启动 Vite；/api 与 /socket.io 由 vite.config.ts 代理到 3000
start "lt-web"    cmd /k "cd /d %ROOT%\web && npm run dev"

rem ---- 完成提示 ----
echo.
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
echo Keep all 3 windows open. Close them to stop.
echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&^& scripts\start-local.bat
