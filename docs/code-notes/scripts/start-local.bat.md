# scripts/start-local.bat 逐行说明

[打开源码](../../../scripts/start-local.bat) · 74 行 · 25 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>@echo off</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 6 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 13 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 15 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 21 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 27 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 32 | <code>rem</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 40 | <code>set ROOT=%~dp0..</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 43 | <code>set COLLECTOR=%COLLECTOR%</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 44 | <code>if "%COLLECTOR%"=="" set COLLECTOR=plc</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 47 | <code>if /i "%COLLECTOR%"=="mock" (</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 48 | <code>set EDGE_SCRIPT=mock_collector.py</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 49 | <code>) else (</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 50 | <code>set EDGE_SCRIPT=plc_collector.py</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 51 | <code>)</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 53 | <code>echo Starting line-twin local loop from %ROOT%</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 54 | <code>echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 58 | <code>start "lt-server" cmd /k "cd /d %ROOT%\server &amp;&amp; node dist\main.js"</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 61 | <code>timeout /t 3 /nobreak &gt;nul</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 64 | <code>start "lt-edge"   cmd /k "cd /d %ROOT%\edge &amp;&amp; py -3 %EDGE_SCRIPT%"</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 68 | <code>start "lt-web"    cmd /k "cd /d %ROOT%\web &amp;&amp; npm run dev"</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 71 | <code>echo.</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 72 | <code>echo Wait 5-10 seconds, then open http://localhost:5173 in browser.</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 73 | <code>echo Keep all 3 windows open. Close them to stop.</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 74 | <code>echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&amp;^&amp; scripts\start-local.bat</code> | 执行脚本命令、设置变量或控制执行流程。 |
