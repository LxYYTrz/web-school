<#
    tunnel-keepalive.ps1 —— SSH 反向隧道看门狗(工控机侧)

    背景:隧道断 = 公网站点实时数据全断(云端 nginx 502)。
    2026-10-23 事故:工控机重启后隧道进程没起来,公网 /api 一直 502 到 8h。

    用法:
        .\scripts\tunnel-keepalive.ps1                     # 前台跑看门狗
        .\scripts\tunnel-keepalive.ps1 -Once               # 只检查+必要时重连一次,然后退出
        .\scripts\tunnel-keepalive.ps1 -InstallTask        # 注册成开机自启的计划任务
        .\scripts\tunnel-keepalive.ps1 -UninstallTask      # 注销计划任务

    关键参数(默认值已按线上现状填好):
        -RemoteBind 127.0.0.1:3300   云端原生 Nginx 使用的本机隧道入口。
#>
[CmdletBinding()]
param(
    [string]$CloudHost = '119.91.145.27',
    [string]$CloudUser = 'root',
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
    [string]$RemoteBind = '127.0.0.1:3300',
    [int]$LocalBackendPort = 3000,
    [int]$IntervalSec = 30,
    [switch]$InstallTask,
    [switch]$UninstallTask,
    [switch]$Once
)

$ErrorActionPreference = 'Continue'
$TaskName = 'line-twin-tunnel'
$ScriptPath = $PSCommandPath

function Write-Log([string]$Msg) {
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)
}

function Test-SshAlive {
    # 找已经在跑、且带我们这条 -R 的 ssh 进程
    $procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }
    }
    return $null
}

function Start-Tunnel {
    if (-not (Test-Path $KeyPath)) {
        Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"
        return $null
    }
    $args = @(
        '-N', '-T',
        '-o', 'ServerAliveInterval=15',
        '-o', 'ServerAliveCountMax=3',
        '-o', 'ExitOnForwardFailure=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-i', $KeyPath,
        '-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",
        # ★ 数据库只走本地(2026-10-23 云端库下线),不再建立 -L 5432 的数据库方向转发
        "${CloudUser}@${CloudHost}"
    )
    Write-Log "拉起隧道: ssh $($args -join ' ')"
    $p = Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 5
    if ($p.HasExited) {
        Write-Log "[FAIL] 隧道进程立刻退出(exit=$($p.ExitCode))。常见原因:-R 绑定地址在云端不存在 / 公钥没装 / 云端 PermitOpen 限制"
        return $null
    }
    Write-Log "隧道已建立 (pid=$($p.Id))"
    return $p
}

function Install-Task {
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
    $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
    Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"
}

function Uninstall-Task {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Log "已注销计划任务 '$TaskName'"
}

if ($InstallTask) { Install-Task; exit 0 }
if ($UninstallTask) { Uninstall-Task; exit 0 }

Write-Log "看门狗启动: 云端=$CloudHost 绑定=$RemoteBind 本地后端=$LocalBackendPort 间隔=${IntervalSec}s"

while ($true) {
    $alive = Test-SshAlive
    if ($null -eq $alive) {
        Write-Log "隧道进程不存在 → 重连"
        [void](Start-Tunnel)
    }
    else {
        Write-Log "隧道在线 (pid=$($alive.ProcessId))"
    }
    if ($Once) { break }
    Start-Sleep -Seconds $IntervalSec
}
