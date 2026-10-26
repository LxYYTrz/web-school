@echo off
rem 关闭批处理命令回显，让输出只显示实际提示。
rem ============================================================================
rem 文件作用：本地闭环一键启动脚本（后端 + 采集器 + 前端 dev）
rem 所属模块：scripts/
rem ============================================================================
rem
rem 【用途】
rem   在**工控机本地**跑一个完整的闭环，不需要 Docker、不需要云服务器、
rem   不需要 SSH 隧道、不需要联网：
rem     - 后端   http://localhost:3000   （读本机 Mosquitto/Memurai/PostgreSQL）
rem     - 采集器 Python 3.11+ <plc_collector.py | mock_collector.py>
rem     - 前端   http://localhost:5173   （Vite dev server，热更新）
rem
rem   本地闭环(不联网、不装 Docker)的启动方式。
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
rem 【验收（见 CLAUDE.md §6）】
rem   1. curl http://localhost:3000/api/lines/line-01/snapshot → robots 非空
rem   2. 浏览器打开 http://localhost:5173 → 机械臂在动、计数在跳
rem   3. lt-edge 窗口有数据滚动；lt-server 窗口无红色报错
rem ============================================================================

rem ROOT = 上一级目录（line-twin 根目录）
set ROOT=%~dp0..
rem 将批处理变量 ROOT 设为等号右侧的值；set 用于设置环境变量。

rem ---- 采集器选择：读环境变量 COLLECTOR，默认为 plc ----
set COLLECTOR=%COLLECTOR%
rem 将批处理变量 COLLECTOR 设为等号右侧的值；set 用于设置环境变量。
if "%COLLECTOR%"=="" set COLLECTOR=plc
rem 用 if 判断采集器选择是否符合条件，进入对应的分支。

rem 根据 COLLECTOR 决定跑哪个采集器脚本
if /i "%COLLECTOR%"=="mock" (
rem 用 if 判断采集器选择是否符合条件，进入对应的分支。
    set EDGE_SCRIPT=mock_collector.py
    rem 将批处理变量 EDGE_SCRIPT 设为等号右侧的值；set 用于设置环境变量。
) else (
rem 结束前一分支，并进入条件不成立时的 else 分支。
    set EDGE_SCRIPT=plc_collector.py
    rem 将批处理变量 EDGE_SCRIPT 设为等号右侧的值；set 用于设置环境变量。
)
rem 结束当前 if 分支。

echo Starting line-twin local loop from %ROOT%
rem 用 echo 向控制台输出这一行启动提示。
echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)
rem 用 echo 向控制台输出这一行启动提示。

rem ---- ① 启动后端（3000 端口）----
rem cd /d 切目录；node dist\main.js 运行编译产物
start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"
rem 用 start 新开命令窗口，执行引号内的服务启动命令。

rem ---- 等待 3 秒，避免采集器比后端先发数据 ----
timeout /t 3 /nobreak >nul
rem 用 timeout 暂停指定秒数，等待后端准备就绪。

rem ---- ② 启动采集器（plc 或 mock）----
start "lt-edge"   cmd /k "cd /d %ROOT%\edge && py -3 %EDGE_SCRIPT%"
rem 用 start 新开命令窗口，执行引号内的服务启动命令。

rem ---- ③ 启动前端 dev server（5173 端口）----
rem npm run dev 启动 Vite；/api 与 /socket.io 由 vite.config.ts 代理到 3000
start "lt-web"    cmd /k "cd /d %ROOT%\web && npm run dev"
rem 用 start 新开命令窗口，执行引号内的服务启动命令。

rem ---- 完成提示 ----
echo.
rem 用 echo 向控制台输出这一行启动提示。
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
rem 用 echo 向控制台输出这一行启动提示。
echo Keep all 3 windows open. Close them to stop.
rem 用 echo 向控制台输出这一行启动提示。
echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&^& scripts\start-local.bat
rem 用 echo 向控制台输出这一行启动提示。
