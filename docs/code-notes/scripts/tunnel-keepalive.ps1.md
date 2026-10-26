# scripts/tunnel-keepalive.ps1 逐行注释

[打开源码](../../../scripts/tunnel-keepalive.ps1) · 106 行 · 91 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
<#
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 2 行**

```text
    tunnel-keepalive.ps1 —— SSH 反向隧道看门狗(工控机侧)
# 注释：调用 反向隧道看门狗，把括号中的值作为参数传入。
```

**源码第 4 行**

```text
    背景:隧道断 = 公网站点实时数据全断(云端 nginx 502)。
# 注释：调用 公网站点实时数据全断，把括号中的值作为参数传入。
```

**源码第 5 行**

```text
    2026-10-23 事故:工控机重启后隧道进程没起来,公网 /api 一直 502 到 8h。
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 7 行**

```text
    用法:
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 8 行**

```text
        .\scripts\tunnel-keepalive.ps1                     # 前台跑看门狗
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 9 行**

```text
        .\scripts\tunnel-keepalive.ps1 -Once               # 只检查+必要时重连一次,然后退出
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 10 行**

```text
        .\scripts\tunnel-keepalive.ps1 -InstallTask        # 注册成开机自启的计划任务
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 11 行**

```text
        .\scripts\tunnel-keepalive.ps1 -UninstallTask      # 注销计划任务
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 13 行**

```text
    关键参数(默认值已按线上现状填好):
# 注释：调用 关键参数，把括号中的值作为参数传入。
```

**源码第 14 行**

```text
        -RemoteBind 127.0.0.1:3300   云端原生 Nginx 使用的本机隧道入口。
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
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
    [string]$CloudUser = 'root',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 20 行**

```text
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 21 行**

```text
    [string]$RemoteBind = '127.0.0.1:3300',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 22 行**

```text
    [int]$LocalBackendPort = 3000,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 23 行**

```text
    [int]$IntervalSec = 30,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 24 行**

```text
    [switch]$InstallTask,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 25 行**

```text
    [switch]$UninstallTask,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 26 行**

```text
    [switch]$Once
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 27 行**

```text
)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 29 行**

```text
$ErrorActionPreference = 'Continue'
# 注释：给变量 `$ErrorActionPreference` 赋值。
```

**源码第 30 行**

```text
$TaskName = 'line-twin-tunnel'
# 注释：给变量 `$TaskName` 赋值。
```

**源码第 31 行**

```text
$ScriptPath = $PSCommandPath
# 注释：给变量 `$ScriptPath` 赋值。
```

**源码第 33 行**

```text
function Write-Log([string]$Msg) {
# 注释：定义 PowerShell 函数 `Write-Log`。 关键字：function＝定义函数。
```

**源码第 34 行**

```text
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 35 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 37 行**

```text
function Test-SshAlive {
# 注释：定义 PowerShell 函数 `Test-SshAlive`。 关键字：function＝定义函数。
```

**源码第 39 行**

```text
    $procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue
# 注释：给变量 `$procs` 赋值。
```

**源码第 40 行**

```text
    foreach ($p in $procs) {
# 注释：控制执行流程或声明脚本参数。
```

**源码第 41 行**

```text
        if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；return＝结束函数并返回结果。
```

**源码第 42 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 43 行**

```text
    return $null
# 注释：执行 PowerShell 命令或补全参数。 关键字：null＝空值；return＝结束函数并返回结果。
```

**源码第 44 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 46 行**

```text
function Start-Tunnel {
# 注释：定义 PowerShell 函数 `Start-Tunnel`。 关键字：function＝定义函数。
```

**源码第 47 行**

```text
    if (-not (Test-Path $KeyPath)) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 48 行**

```text
        Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 49 行**

```text
        return $null
# 注释：执行 PowerShell 命令或补全参数。 关键字：null＝空值；return＝结束函数并返回结果。
```

**源码第 50 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 51 行**

```text
    $args = @(
# 注释：给变量 `$args` 赋值。
```

**源码第 52 行**

```text
        '-N', '-T',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 53 行**

```text
        '-o', 'ServerAliveInterval=15',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 54 行**

```text
        '-o', 'ServerAliveCountMax=3',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 55 行**

```text
        '-o', 'ExitOnForwardFailure=yes',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 56 行**

```text
        '-o', 'StrictHostKeyChecking=accept-new',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 57 行**

```text
        '-i', $KeyPath,
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 58 行**

```text
        '-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 60 行**

```text
        "${CloudUser}@${CloudHost}"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 61 行**

```text
    )
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 62 行**

```text
    Write-Log "拉起隧道: ssh $($args -join ' ')"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 63 行**

```text
    $p = Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden
# 注释：给变量 `$p` 赋值。
```

**源码第 64 行**

```text
    Start-Sleep -Seconds 5
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 65 行**

```text
    if ($p.HasExited) {
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 66 行**

```text
        Write-Log "[FAIL] 隧道进程立刻退出(exit=$($p.ExitCode))。常见原因:-R 绑定地址在云端不存在 / 公钥没装 / 云端 PermitOpen 限制"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 67 行**

```text
        return $null
# 注释：执行 PowerShell 命令或补全参数。 关键字：null＝空值；return＝结束函数并返回结果。
```

**源码第 68 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 69 行**

```text
    Write-Log "隧道已建立 (pid=$($p.Id))"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 70 行**

```text
    return $p
# 注释：执行 PowerShell 命令或补全参数。 关键字：return＝结束函数并返回结果。
```

**源码第 71 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 73 行**

```text
function Install-Task {
# 注释：定义 PowerShell 函数 `Install-Task`。 关键字：function＝定义函数。
```

**源码第 74 行**

```text
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
# 注释：给变量 `$action` 赋值。
```

**源码第 75 行**

```text
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 76 行**

```text
    $trigger = New-ScheduledTaskTrigger -AtStartup
# 注释：给变量 `$trigger` 赋值。
```

**源码第 77 行**

```text
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
# 注释：给变量 `$principal` 赋值。
```

**源码第 78 行**

```text
    $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
# 注释：给变量 `$settings` 赋值。
```

**源码第 79 行**

```text
        -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 80 行**

```text
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 81 行**

```text
        -Principal $principal -Settings $settings -Force | Out-Null
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 82 行**

```text
    Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 83 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 85 行**

```text
function Uninstall-Task {
# 注释：定义 PowerShell 函数 `Uninstall-Task`。 关键字：function＝定义函数。
```

**源码第 86 行**

```text
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
# 注释：执行 PowerShell 命令或补全参数。 关键字：false＝布尔假值。
```

**源码第 87 行**

```text
    Write-Log "已注销计划任务 '$TaskName'"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 88 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 90 行**

```text
if ($InstallTask) { Install-Task; exit 0 }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 91 行**

```text
if ($UninstallTask) { Uninstall-Task; exit 0 }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 93 行**

```text
Write-Log "看门狗启动: 云端=$CloudHost 绑定=$RemoteBind 本地后端=$LocalBackendPort 间隔=${IntervalSec}s"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 95 行**

```text
while ($true) {
# 注释：控制执行流程或声明脚本参数。 关键字：true＝布尔真值；while＝条件循环。
```

**源码第 96 行**

```text
    $alive = Test-SshAlive
# 注释：给变量 `$alive` 赋值。
```

**源码第 97 行**

```text
    if ($null -eq $alive) {
# 注释：控制执行流程或声明脚本参数。 关键字：null＝空值；if＝条件判断。
```

**源码第 98 行**

```text
        Write-Log "隧道进程不存在 → 重连"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 99 行**

```text
        [void](Start-Tunnel)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 100 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 101 行**

```text
    else {
# 注释：执行 PowerShell 命令或补全参数。 关键字：else＝条件不满足时的分支。
```

**源码第 102 行**

```text
        Write-Log "隧道在线 (pid=$($alive.ProcessId))"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 103 行**

```text
    }
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 104 行**

```text
    if ($Once) { break }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 105 行**

```text
    Start-Sleep -Seconds $IntervalSec
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 106 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```
