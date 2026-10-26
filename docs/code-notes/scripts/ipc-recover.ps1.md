# scripts/ipc-recover.ps1 逐行注释

[打开源码](../../../scripts/ipc-recover.ps1) · 128 行 · 111 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<#
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 2 行**

```text
    ipc-recover.ps1 —— 工控机侧一键恢复(幂等)
# 注释：调用 工控机侧一键恢复，把括号中的值作为参数传入。
```

**源码第 4 行**

```text
    背景:2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起,
# 注释：设置字段 背景，值为 2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起。
```

**源码第 5 行**

```text
          公网站点实时数据全断(云端 nginx 502 connect() failed 111)。
# 注释：调用 公网站点实时数据全断，把括号中的值作为参数传入。
```

**源码第 7 行**

```text
    本脚本按依赖顺序拉起并自检(全部幂等,已在跑的不会重复起):
# 注释：调用 本脚本按依赖顺序拉起并自检，把括号中的值作为参数传入。
```

**源码第 8 行**

```text
        1. 检查本机 MQTT、Redis、PostgreSQL 服务端口
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 9 行**

```text
        2. SSH 反向隧道(云端 -R 127.0.0.1:3300)
# 注释：调用 反向隧道，把括号中的值作为参数传入。
```

**源码第 10 行**

```text
        3. NestJS 后端(node dist\main.js)
# 注释：调用 后端，把括号中的值作为参数传入。
```

**源码第 11 行**

```text
        4. PLC 采集器(python edge/plc_collector.py)
# 注释：调用 采集器，把括号中的值作为参数传入。
```

**源码第 12 行**

```text
        5. 调 scripts\verify-line.ps1 自检
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 14 行**

```text
    用法:
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 15 行**

```text
        .\scripts\ipc-recover.ps1
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 16 行**

```text
        .\scripts\ipc-recover.ps1 -CloudUser linetwin -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 18 行**

```text
[CmdletBinding()]
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 19 行**

```text
param(
# 注释：控制执行流程或声明脚本参数。
```

**源码第 20 行**

```text
    [string]$CloudHost = '119.91.145.27',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 21 行**

```text
    [string]$CloudUser = 'root',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 22 行**

```text
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 23 行**

```text
    [switch]$SkipBuild
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 24 行**

```text
)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 26 行**

```text
$ErrorActionPreference = 'Continue'
# 注释：给变量 `$ErrorActionPreference` 赋值。
```

**源码第 27 行**

```text
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围；catch＝处理异常。
```

**源码第 28 行**

```text
$root = Split-Path -Parent $PSCommandPath
# 注释：给变量 `$root` 赋值。
```

**源码第 29 行**

```text
$root = Split-Path -Parent $root
# 注释：给变量 `$root` 赋值。
```

**源码第 30 行**

```text
$logDir = Join-Path $root 'logs'
# 注释：给变量 `$logDir` 赋值。
```

**源码第 31 行**

```text
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 33 行**

```text
function Write-Step([string]$Msg) { Write-Host "==> $Msg" -ForegroundColor Cyan }
# 注释：定义 PowerShell 函数 `Write-Step`。 关键字：function＝定义函数。
```

**源码第 34 行**

```text
function Test-Port([int]$Port) {
# 注释：定义 PowerShell 函数 `Test-Port`。 关键字：function＝定义函数。
```

**源码第 35 行**

```text
    $c = New-Object System.Net.Sockets.TcpClient
# 注释：给变量 `$c` 赋值。
```

**源码第 36 行**

```text
    try {
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围。
```

**源码第 37 行**

```text
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
# 注释：给变量 `$iar` 赋值。 关键字：null＝空值。
```

**源码第 38 行**

```text
        return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值；return＝结束函数并返回结果。
```

**源码第 39 行**

```text
    } catch { return $false } finally { $c.Close() }
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值；return＝结束函数并返回结果；catch＝处理异常。
```

**源码第 40 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 43 行**

```text
Write-Step '检查本机 MQTT / Redis / PostgreSQL'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 44 行**

```text
$ports = @(1883, 6379, 5432)
# 注释：给变量 `$ports` 赋值。
```

**源码第 45 行**

```text
foreach ($port in $ports) {
# 注释：控制执行流程或声明脚本参数。
```

**源码第 46 行**

```text
    if (-not (Test-Port $port)) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 47 行**

```text
        Write-Host "[FAIL] 本机端口 $port 未就绪,请检查对应的 Windows 服务" -ForegroundColor Red
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 48 行**

```text
        exit 1
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 49 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 50 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 53 行**

```text
Write-Step '确保 SSH 反向隧道在线'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 54 行**

```text
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 注释：给变量 `$sshProc` 赋值。
```

**源码第 55 行**

```text
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 56 行**

```text
if ($sshProc) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 57 行**

```text
    Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 58 行**

```text
} else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 59 行**

```text
    $keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'
# 注释：给变量 `$keepAlive` 赋值。
```

**源码第 60 行**

```text
    $kArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive,
# 注释：给变量 `$kArgs` 赋值。
```

**源码第 61 行**

```text
        '-CloudHost', $CloudHost, '-CloudUser', $CloudUser, '-KeyPath', $KeyPath, '-Once')
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 62 行**

```text
    & powershell @kArgs
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 63 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 66 行**

```text
if (Test-Port 3000) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 67 行**

```text
    Write-Step '后端已在跑 (3000)'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 68 行**

```text
} else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 69 行**

```text
    Write-Step '启动后端 node dist\main.js'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 70 行**

```text
    $main = Join-Path $root 'server\dist\main.js'
# 注释：给变量 `$main` 赋值。
```

**源码第 71 行**

```text
    if (-not (Test-Path $main)) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 72 行**

```text
        if ($SkipBuild) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 73 行**

```text
            Write-Host '[FAIL] server\dist\main.js 不存在(且 -SkipBuild 已指定)' -ForegroundColor Red
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 74 行**

```text
        } else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 75 行**

```text
            Write-Host 'dist 缺失,先 npm run build ...' -ForegroundColor Yellow
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 76 行**

```text
            Push-Location (Join-Path $root 'server')
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 77 行**

```text
            npm.cmd run build
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 78 行**

```text
            Pop-Location
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 79 行**

```text
        }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 80 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 81 行**

```text
    if (Test-Path $main) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 82 行**

```text
        Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 83 行**

```text
            -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 84 行**

```text
            -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 85 行**

```text
            -RedirectStandardError (Join-Path $logDir 'backend.err.log') | Out-Null
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 86 行**

```text
        for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }
# 注释：执行 PowerShell 命令或补全参数。 关键字：if＝条件判断；for＝开始循环。
```

**源码第 87 行**

```text
        Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 88 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 89 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 92 行**

```text
$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
# 注释：给变量 `$collector` 赋值。
```

**源码第 93 行**

```text
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 94 行**

```text
if ($collector) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 95 行**

```text
    Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 96 行**

```text
} else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 97 行**

```text
    Write-Step '启动 PLC 采集器'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 99 行**

```text
    $py = $null
# 注释：给变量 `$py` 赋值。 关键字：null＝空值。
```

**源码第 100 行**

```text
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
# 注释：给变量 `$launcher` 赋值。
```

**源码第 101 行**

```text
    if ($launcher) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 102 行**

```text
        $candidate = & $launcher.Source -3 -c 'import sys; assert sys.version_info >= (3, 11); print(sys.executable)' 2>$null
# 注释：给变量 `$candidate` 赋值。 关键字：null＝空值；import＝导入模块。
```

**源码第 103 行**

```text
        if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 104 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 105 行**

```text
    if (-not $py) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 106 行**

```text
        $candidate = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
# 注释：给变量 `$candidate` 赋值。
```

**源码第 107 行**

```text
        if ($candidate) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 108 行**

```text
            $supported = & $candidate -c 'import sys; print(sys.version_info >= (3, 11))' 2>$null
# 注释：给变量 `$supported` 赋值。 关键字：null＝空值；import＝导入模块。
```

**源码第 109 行**

```text
            if ($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；True＝Python 真值。
```

**源码第 110 行**

```text
        }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 111 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 112 行**

```text
    if ($py) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 113 行**

```text
        Start-Process -FilePath $py -ArgumentList 'plc_collector.py' `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 114 行**

```text
            -WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 115 行**

```text
            -RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 116 行**

```text
            -RedirectStandardError (Join-Path $logDir 'collector.err.log') | Out-Null
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 117 行**

```text
        Start-Sleep -Seconds 5
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 118 行**

```text
        Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 119 行**

```text
            Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 120 行**

```text
    } else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 121 行**

```text
        Write-Host '[FAIL] 没找到 Python 3.11+,采集器起不来' -ForegroundColor Red
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 122 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 123 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 126 行**

```text
Write-Step '体检'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 127 行**

```text
& (Join-Path $root 'scripts\verify-line.ps1') -CloudHost $CloudHost
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 128 行**

```text
exit $LASTEXITCODE
# 注释：执行 PowerShell 命令或补全参数。
```
