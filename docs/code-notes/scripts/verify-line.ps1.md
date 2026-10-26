# scripts/verify-line.ps1 逐行注释

[打开源码](../../../scripts/verify-line.ps1) · 95 行 · 78 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<#
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 2 行**

```text
    verify-line.ps1 —— line-twin 全链路只读体检(工控机侧)
# 注释：调用 全链路只读体检，把括号中的值作为参数传入。
```

**源码第 4 行**

```text
    检查项(全部只读,不下发任何控制指令):
# 注释：调用 检查项，把括号中的值作为参数传入。
```

**源码第 5 行**

```text
      1. 本机服务端口(MQTT 1883、Redis 6379、PostgreSQL 5432)
# 注释：调用 本机服务端口，把括号中的值作为参数传入。
```

**源码第 6 行**

```text
      2. SSH 隧道进程(云端 -R 127.0.0.1:3300)
# 注释：调用 隧道进程，把括号中的值作为参数传入。
```

**源码第 7 行**

```text
      3. 本地后端 http://localhost:3000/api/lines/line-01/snapshot
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 8 行**

```text
      4. 云端公网 http://<云IP>:8081/api/lines/line-01/snapshot
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 9 行**

```text
      5. 从后端快照确认 PLC 数据持续更新(不与采集器争抢 Modbus 连接)
# 注释：调用 数据持续更新，把括号中的值作为参数传入。
```

**源码第 11 行**

```text
    用法:
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 12 行**

```text
        .\scripts\verify-line.ps1
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 13 行**

```text
        .\scripts\verify-line.ps1 -CloudHost 119.91.145.27 -CloudPort 8081
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 14 行**

```text
    退出码:0=全部通过;1=有 FAIL
# 注释：设置字段 退出码，值为 0=全部通过;1=有 FAIL。
```

**源码第 16 行**

```text
[CmdletBinding()]
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 17 行**

```text
param(
# 注释：控制执行流程或声明脚本参数。
```

**源码第 18 行**

```text
    [string]$CloudHost = '119.91.145.27',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 19 行**

```text
    [int]$CloudPort = 8081,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 20 行**

```text
    [switch]$SkipPlc
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 21 行**

```text
)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 23 行**

```text
$ErrorActionPreference = 'Continue'
# 注释：给变量 `$ErrorActionPreference` 赋值。
```

**源码第 24 行**

```text
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围；catch＝处理异常。
```

**源码第 25 行**

```text
$results = New-Object System.Collections.ArrayList
# 注释：给变量 `$results` 赋值。
```

**源码第 27 行**

```text
function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
# 注释：定义 PowerShell 函数 `Add-Result`。 关键字：function＝定义函数。
```

**源码第 28 行**

```text
    [void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })
# 注释：执行 PowerShell 命令或补全参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 29 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 31 行**

```text
function Test-Port([int]$Port) {
# 注释：定义 PowerShell 函数 `Test-Port`。 关键字：function＝定义函数。
```

**源码第 32 行**

```text
    $c = New-Object System.Net.Sockets.TcpClient
# 注释：给变量 `$c` 赋值。
```

**源码第 33 行**

```text
    try {
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围。
```

**源码第 34 行**

```text
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
# 注释：给变量 `$iar` 赋值。 关键字：null＝空值。
```

**源码第 35 行**

```text
        $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
# 注释：给变量 `$ok` 赋值。 关键字：false＝布尔假值。
```

**源码第 36 行**

```text
        return $ok
# 注释：执行 PowerShell 命令或补全参数。 关键字：return＝结束函数并返回结果。
```

**源码第 37 行**

```text
    } catch { return $false } finally { $c.Close() }
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值；return＝结束函数并返回结果；catch＝处理异常。
```

**源码第 38 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 40 行**

```text
function Get-Json([string]$Url, [int]$TimeoutSec = 8) {
# 注释：定义 PowerShell 函数 `Get-Json`。 关键字：function＝定义函数。
```

**源码第 41 行**

```text
    try {
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围。
```

**源码第 42 行**

```text
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
# 注释：给变量 `$r` 赋值。
```

**源码第 43 行**

```text
        return @{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }
# 注释：执行 PowerShell 命令或补全参数。 关键字：return＝结束函数并返回结果。
```

**源码第 44 行**

```text
    } catch {
# 注释：执行 PowerShell 命令或补全参数。 关键字：catch＝处理异常。
```

**源码第 45 行**

```text
        $code = 0
# 注释：给变量 `$code` 赋值。
```

**源码第 46 行**

```text
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 47 行**

```text
        return @{ ok = $false; body = $_.Exception.Message; code = $code }
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值；return＝结束函数并返回结果。
```

**源码第 48 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 49 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 51 行**

```text
Write-Host "=== line-twin 全链路体检 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 54 行**

```text
Add-Result 'MQTT 1883' (Test-Port 1883) '消息代理'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 55 行**

```text
Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 56 行**

```text
Add-Result 'PostgreSQL 5432' (Test-Port 5432) '历史与业务数据'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 59 行**

```text
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 注释：给变量 `$sshProc` 赋值。
```

**源码第 60 行**

```text
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 61 行**

```text
Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })
# 注释：执行 PowerShell 命令或补全参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 64 行**

```text
$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'
# 注释：给变量 `$local` 赋值。
```

**源码第 65 行**

```text
Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 66 行**

```text
if ($local.ok) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 67 行**

```text
    try {
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围。
```

**源码第 68 行**

```text
        $j = $local.body | ConvertFrom-Json
# 注释：给变量 `$j` 赋值。
```

**源码第 69 行**

```text
        if ($j.error) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 70 行**

```text
            Add-Result '快照状态' $false "后端读取 Redis 失败: $($j.error)"
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值。
```

**源码第 71 行**

```text
        } elseif (-not $SkipPlc) {
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 72 行**

```text
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
# 注释：给变量 `$nowMs` 赋值。
```

**源码第 73 行**

```text
            $statusFresh = $j.status -and $j.status.ts -and (($nowMs - [int64]$j.status.ts) -le 15000)
# 注释：给变量 `$statusFresh` 赋值。
```

**源码第 74 行**

```text
            $robotFresh = @($j.robots.PSObject.Properties | Where-Object {
# 注释：给变量 `$robotFresh` 赋值。
```

**源码第 75 行**

```text
                $_.Value -and $_.Value.ts -and (($nowMs - [int64]$_.Value.ts) -le 15000)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 76 行**

```text
            }).Count -gt 0
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 77 行**

```text
            $ok = $statusFresh -and $robotFresh -and ($j.edge.status -eq 'online')
# 注释：给变量 `$ok` 赋值。
```

**源码第 78 行**

```text
            Add-Result 'PLC 采集数据' $ok "state=$($j.status.state) edge=$($j.edge.status) statusTs=$($j.status.ts) robotFresh=$robotFresh"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 79 行**

```text
        }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 80 行**

```text
    } catch { Add-Result '快照解析' $false $_.Exception.Message }
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值；catch＝处理异常。
```

**源码第 81 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 84 行**

```text
$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"
# 注释：给变量 `$cloud` 赋值。
```

**源码第 85 行**

```text
Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"
# 注释：执行 PowerShell 命令或补全参数。 关键字：if＝条件判断；else＝条件不满足时的分支。
```

**源码第 87 行**

```text
Write-Host ""
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 88 行**

```text
$results | Format-Table -AutoSize | Out-String | Write-Host
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 89 行**

```text
$failed = @($results | Where-Object { $_.结果 -eq 'FAIL' })
# 注释：给变量 `$failed` 赋值。
```

**源码第 90 行**

```text
if ($failed.Count -gt 0) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 91 行**

```text
    Write-Host "有 $($failed.Count) 项 FAIL —— 对照 CLAUDE.md §4.5 排查表" -ForegroundColor Red
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 92 行**

```text
    exit 1
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 93 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 94 行**

```text
Write-Host "全部通过 ✅" -ForegroundColor Green
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 95 行**

```text
exit 0
# 注释：执行 PowerShell 命令或补全参数。
```
