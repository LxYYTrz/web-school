<#
    tunnel-keepalive.ps1 —— SSH 反向隧道看门狗(工控机侧)
    # 调用 反向隧道看门狗，把括号中的值作为参数传入。

    背景:隧道断 = 公网站点实时数据全断(云端 nginx 502)。
    # 调用 公网站点实时数据全断，把括号中的值作为参数传入。
    2026-10-23 事故:工控机重启后隧道进程没起来,公网 /api 一直 502 到 8h。
    # 继续当前表达式；这一行的值由外层代码块或调用使用。

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\tunnel-keepalive.ps1                     # 前台跑看门狗
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\tunnel-keepalive.ps1 -Once               # 只检查+必要时重连一次,然后退出
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\tunnel-keepalive.ps1 -InstallTask        # 注册成开机自启的计划任务
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\tunnel-keepalive.ps1 -UninstallTask      # 注销计划任务
        # 继续当前表达式；这一行的值由外层代码块或调用使用。

    关键参数(默认值已按线上现状填好):
    # 调用 关键参数，把括号中的值作为参数传入。
        -RemoteBind 127.0.0.1:3300   云端原生 Nginx 使用的本机隧道入口。
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
#>
[CmdletBinding()]
# 调用 [CmdletBinding()]，按照本行参数处理或检查对应资源。
param(
# 开始声明该脚本的输入参数；param 是 PowerShell 参数块。
    [string]$CloudHost = '119.91.145.27',
    # 声明参数 $CloudHost，类型为 string，等号右边是默认值（若有）。
    [string]$CloudUser = 'root',
    # 声明参数 $CloudUser，类型为 string，等号右边是默认值（若有）。
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
    # 声明参数 $KeyPath，类型为 string，等号右边是默认值（若有）。
    [string]$RemoteBind = '127.0.0.1:3300',
    # 声明参数 $RemoteBind，类型为 string，等号右边是默认值（若有）。
    [int]$LocalBackendPort = 3000,
    # 声明参数 $LocalBackendPort，类型为 int，等号右边是默认值（若有）。
    [int]$IntervalSec = 30,
    # 声明参数 $IntervalSec，类型为 int，等号右边是默认值（若有）。
    [switch]$InstallTask,
    # 声明参数 $InstallTask，类型为 switch，等号右边是默认值（若有）。
    [switch]$UninstallTask,
    # 声明参数 $UninstallTask，类型为 switch，等号右边是默认值（若有）。
    [switch]$Once
    # 声明参数 $Once，类型为 switch，等号右边是默认值（若有）。
)
# 结束当前参数列表或脚本代码块。

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
$TaskName = 'line-twin-tunnel'
# 给变量 $TaskName 赋值。
$ScriptPath = $PSCommandPath
# 给变量 $ScriptPath 赋值。

function Write-Log([string]$Msg) {
# 定义 PowerShell 函数 Write-Log。 关键字：function＝定义函数。
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)
    # 用 Write-Host 把本行的状态消息输出到终端。
}
# 结束当前参数列表或脚本代码块。

function Test-SshAlive {
# 定义 PowerShell 函数 Test-SshAlive。 关键字：function＝定义函数。
    # 找已经在跑、且带我们这条 -R 的 ssh 进程
    $procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue
    # 给变量 $procs 赋值。
    foreach ($p in $procs) {
    # 用 foreach 遍历括号中的集合，每次处理一个元素。
        if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    }
    # 结束当前参数列表或脚本代码块。
    return $null
    # 返回本行表达式的值并结束当前函数；return 表示返回。
}
# 结束当前参数列表或脚本代码块。

function Start-Tunnel {
# 定义 PowerShell 函数 Start-Tunnel。 关键字：function＝定义函数。
    if (-not (Test-Path $KeyPath)) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"
        # 调用 Write-Log，按照本行参数处理或检查对应资源。
        return $null
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    }
    # 结束当前参数列表或脚本代码块。
    $args = @(
    # 给变量 $args 赋值。
        '-N', '-T',
        # 调用 '-N',，按照本行参数处理或检查对应资源。
        '-o', 'ServerAliveInterval=15',
        # 调用 '-o',，按照本行参数处理或检查对应资源。
        '-o', 'ServerAliveCountMax=3',
        # 调用 '-o',，按照本行参数处理或检查对应资源。
        '-o', 'ExitOnForwardFailure=yes',
        # 调用 '-o',，按照本行参数处理或检查对应资源。
        '-o', 'StrictHostKeyChecking=accept-new',
        # 调用 '-o',，按照本行参数处理或检查对应资源。
        '-i', $KeyPath,
        # 调用 '-i',，按照本行参数处理或检查对应资源。
        '-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",
        # 调用 '-R',，按照本行参数处理或检查对应资源。
        # ★ 数据库只走本地(2026-10-23 云端库下线),不再建立 -L 5432 的数据库方向转发
        "${CloudUser}@${CloudHost}"
        # 调用 "${CloudUser}@${CloudHost}"，按照本行参数处理或检查对应资源。
    )
    # 结束当前参数列表或脚本代码块。
    Write-Log "拉起隧道: ssh $($args -join ' ')"
    # 调用 Write-Log，按照本行参数处理或检查对应资源。
    $p = Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden
    # 给变量 $p 赋值。
    Start-Sleep -Seconds 5
    # 暂停指定时间，等待外部服务完成启动。
    if ($p.HasExited) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Write-Log "[FAIL] 隧道进程立刻退出(exit=$($p.ExitCode))。常见原因:-R 绑定地址在云端不存在 / 公钥没装 / 云端 PermitOpen 限制"
        # 调用 Write-Log，按照本行参数处理或检查对应资源。
        return $null
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    }
    # 结束当前参数列表或脚本代码块。
    Write-Log "隧道已建立 (pid=$($p.Id))"
    # 调用 Write-Log，按照本行参数处理或检查对应资源。
    return $p
    # 返回本行表达式的值并结束当前函数；return 表示返回。
}
# 结束当前参数列表或脚本代码块。

function Install-Task {
# 定义 PowerShell 函数 Install-Task。 关键字：function＝定义函数。
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
        # 向上一行的 PowerShell 命令传入 -Argument 参数及其取值。
    $trigger = New-ScheduledTaskTrigger -AtStartup
    # 给变量 $trigger 赋值。
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
    # 给变量 $principal 赋值。
    $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
        # 向上一行的 PowerShell 命令传入 -ExecutionTimeLimit 参数及其取值。
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
        # 向上一行的 PowerShell 命令传入 -Principal 参数及其取值。
    Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"
    # 调用 Write-Log，按照本行参数处理或检查对应资源。
}
# 结束当前参数列表或脚本代码块。

function Uninstall-Task {
# 定义 PowerShell 函数 Uninstall-Task。 关键字：function＝定义函数。
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    # 注销本行指定的 Windows 计划任务。
    Write-Log "已注销计划任务 '$TaskName'"
    # 调用 Write-Log，按照本行参数处理或检查对应资源。
}
# 结束当前参数列表或脚本代码块。

if ($InstallTask) { Install-Task; exit 0 }
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
if ($UninstallTask) { Uninstall-Task; exit 0 }
# 用 if 检查括号内的条件；成立时执行花括号中的操作。

Write-Log "看门狗启动: 云端=$CloudHost 绑定=$RemoteBind 本地后端=$LocalBackendPort 间隔=${IntervalSec}s"
# 调用 Write-Log，按照本行参数处理或检查对应资源。

while ($true) {
# 调用 while，按照本行参数处理或检查对应资源。
    $alive = Test-SshAlive
    # 给变量 $alive 赋值。
    if ($null -eq $alive) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Write-Log "隧道进程不存在 → 重连"
        # 调用 Write-Log，按照本行参数处理或检查对应资源。
        [void](Start-Tunnel)
        # 调用 [void](Start-Tunnel)，按照本行参数处理或检查对应资源。
    }
    # 结束当前参数列表或脚本代码块。
    else {
    # 调用 else，按照本行参数处理或检查对应资源。
        Write-Log "隧道在线 (pid=$($alive.ProcessId))"
        # 调用 Write-Log，按照本行参数处理或检查对应资源。
    }
    # 结束当前参数列表或脚本代码块。
    if ($Once) { break }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Start-Sleep -Seconds $IntervalSec
    # 暂停指定时间，等待外部服务完成启动。
}
# 结束当前参数列表或脚本代码块。
