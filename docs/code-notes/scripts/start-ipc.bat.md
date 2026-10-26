# scripts/start-ipc.bat 逐行注释

[打开源码](../../../scripts/start-ipc.bat) · 5 行 · 3 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
@echo off
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 4 行**

```text
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ipc-recover.ps1" %*
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 5 行**

```text
exit /b %ERRORLEVEL%
# 注释：执行脚本命令、设置变量或控制执行流程。
```
