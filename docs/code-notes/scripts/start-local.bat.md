# scripts/start-local.bat 逐行注释

[打开源码](../../../scripts/start-local.bat) · 74 行 · 25 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
@echo off
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 6 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 13 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 15 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 21 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 27 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 32 行**

```text
rem
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 40 行**

```text
set ROOT=%~dp0..
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 43 行**

```text
set COLLECTOR=%COLLECTOR%
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 44 行**

```text
if "%COLLECTOR%"=="" set COLLECTOR=plc
# 注释：执行脚本命令、设置变量或控制执行流程。 关键字：if＝条件判断。
```

**源码第 47 行**

```text
if /i "%COLLECTOR%"=="mock" (
# 注释：执行脚本命令、设置变量或控制执行流程。 关键字：if＝条件判断。
```

**源码第 48 行**

```text
    set EDGE_SCRIPT=mock_collector.py
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 49 行**

```text
) else (
# 注释：执行脚本命令、设置变量或控制执行流程。 关键字：else＝条件不满足时的分支。
```

**源码第 50 行**

```text
    set EDGE_SCRIPT=plc_collector.py
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 51 行**

```text
)
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 53 行**

```text
echo Starting line-twin local loop from %ROOT%
# 注释：执行脚本命令、设置变量或控制执行流程。 关键字：from＝指定导入来源。
```

**源码第 54 行**

```text
echo Edge collector: %EDGE_SCRIPT%  (COLLECTOR=%COLLECTOR%)
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 58 行**

```text
start "lt-server" cmd /k "cd /d %ROOT%\server && node dist\main.js"
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 61 行**

```text
timeout /t 3 /nobreak >nul
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 64 行**

```text
start "lt-edge"   cmd /k "cd /d %ROOT%\edge && py -3 %EDGE_SCRIPT%"
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 68 行**

```text
start "lt-web"    cmd /k "cd /d %ROOT%\web && npm run dev"
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 71 行**

```text
echo.
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 72 行**

```text
echo Wait 5-10 seconds, then open http://localhost:5173 in browser.
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 73 行**

```text
echo Keep all 3 windows open. Close them to stop.
# 注释：执行脚本命令、设置变量或控制执行流程。
```

**源码第 74 行**

```text
echo To switch back to mock (no PLC needed):  set COLLECTOR=mock ^&^& scripts\start-local.bat
# 注释：执行脚本命令、设置变量或控制执行流程。
```
