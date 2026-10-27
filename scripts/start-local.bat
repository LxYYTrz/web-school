rem 这一段负责按所选采集器启动本地后端、边缘进程与前端开发服务，为后续代码提供当前文件的处理入口。
@echo off
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
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
rem 3. lt-edge 窗口有数据滚动；lt-server 窗口无红色报错。
rem ROOT 是该脚本设置的批处理环境变量

rem ---- 采集器选择：读环境变量 COLLECTOR，默认为 plc ----
set COLLECTOR=%COLLECTOR%
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem COLLECTOR 是由批处理环境变量提供的当前配置或路径；COLLECTOR 是该脚本设置的批处理环境变量
if "%COLLECTOR%"=="" set COLLECTOR=plc
rem 检查"％COLLECTOR％"=="" set COLLECTOR=plc，按判断结果进入对应的处理分支。
rem COLLECTOR 是由批处理环境变量提供的当前配置或路径

rem 根据 COLLECTOR 决定跑哪个采集器脚本
if /i "%COLLECTOR%"=="mock" (
rem 检查/i "％COLLECTOR％"=="mock" （，按判断结果进入对应的处理分支。
rem COLLECTOR 是由批处理环境变量提供的当前配置或路径
    set EDGE_SCRIPT=test\mock_collector.py
    rem 根据 COLLECTOR 决定跑哪个采集器脚本。
    rem EDGE_SCRIPT 是该脚本设置的批处理环境变量
) else (
rem 执行 else 对应的本地处理，使用本行提供的数据。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    set EDGE_SCRIPT=plc_collector.py
    rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
    rem EDGE_SCRIPT 是该脚本设置的批处理环境变量
)
rem 结束当前函数、分支或对象配置，返回上一层处理流程。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

echo Starting line-twin local loop from %ROOT%
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem ROOT 是由批处理环境变量提供的当前配置或路径
echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem EDGE_SCRIPT 是由批处理环境变量提供的当前配置或路径；COLLECTOR 是由批处理环境变量提供的当前配置或路径

rem ---- ① 启动后端（3000 端口）----
rem cd /d 切目录；node dist\main.js 运行编译产物

rem 这里启动 Node.js 执行 server/dist/main.js，即已经构建的后端产物，工作目录切到 server。
rem ROOT 是项目根目录；后续还会启动采集器等程序。修改 src 后如果未重新构建，这个命令仍运行旧 dist。
rem 本脚本启动应用进程，不负责自动安装全部数据库、Redis 和 Broker 基础设施。

start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem ROOT 是由批处理环境变量提供的当前配置或路径

rem ---- 等待 3 秒，避免采集器比后端先发数据 ----
timeout /t 3 /nobreak >nul
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

rem ---- ② 启动采集器（plc 或 mock）----
start "lt-edge"   cmd /k "cd /d %ROOT%\edge && py -3 %EDGE_SCRIPT%"
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem ROOT 是由批处理环境变量提供的当前配置或路径；EDGE_SCRIPT 是由批处理环境变量提供的当前配置或路径

rem ---- ③ 启动前端 dev server（5173 端口）----
rem npm run dev 启动 Vite；/api 与 /socket.io 由 vite.config.ts 代理到 3000
start "lt-web"    cmd /k "cd /d %ROOT%\web && npm run dev"
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem ROOT 是由批处理环境变量提供的当前配置或路径

rem ---- 完成提示 ----
echo.
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
echo Keep all 3 windows open. Close them to stop.
rem 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&^& scripts\start-local.bat
rem 执行 mock 对应的本地处理，使用本行提供的数据。
rem 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
rem 这一段提供了按所选采集器启动本地后端、边缘进程与前端开发服务所需的定义和处理逻辑，结果交由调用方或运行环境使用。
