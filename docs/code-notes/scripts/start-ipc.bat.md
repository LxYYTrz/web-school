# scripts/start-ipc.bat 逐行说明

[打开源码](../../../scripts/start-ipc.bat) · 5 行 · 3 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>@echo off</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 4 | <code>powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ipc-recover.ps1" %*</code> | 执行脚本命令、设置变量或控制执行流程。 |
| 5 | <code>exit /b %ERRORLEVEL%</code> | 执行脚本命令、设置变量或控制执行流程。 |
