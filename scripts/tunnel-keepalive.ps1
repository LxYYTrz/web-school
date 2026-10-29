# 在工控机运行的 SSH 反向隧道保活脚本，参数描述云端 SSH 与本机后端目标。
# 按参数/环境准备 → -R 参数组装 → 启动 ssh → 退出与重试阅读；两个 127.0.0.1 分别属于两端机器。
# 脚本建立转发连接，不执行产线业务；进程存在或端口打开不单独证明后端和现场数据正常。

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

    # RemoteBind 描述云端 sshd 要创建的监听地址；LocalBackendPort 描述工控机 ssh 连接的本机后端目标。
    # 下面 -R 将两者拼成“云端监听地址:工控机目标地址”，所以两个 127.0.0.1 属于不同机器。
    # 工控机 ssh 先主动连接 CloudHost 的 SSH 服务，外部 API 请求随后才经这条既有通道转交。

    [string]$RemoteBind = '127.0.0.1:3300',
    [int]$LocalBackendPort = 3000,
    [int]$IntervalSec = 30,
    [switch]$InstallTask,
    [switch]$UninstallTask,
    [switch]$Once
)

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
$TaskName = 'line-twin-tunnel'
# 给变量 $TaskName 赋值。
$ScriptPath = $PSCommandPath
# 给变量 $ScriptPath 赋值。

function Write-Log([string]$Msg) {
# 定义 PowerShell 函数 Write-Log。
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)
}

# 按 Win32_Process 中 ssh.exe 的命令行查找包含 RemoteBind 的进程，返回匹配进程或空值。
# 此处没有向云端或后端发业务探测；匹配到进程不保证隧道和接口当前可以正常转发。
function Test-SshAlive {
# 定义 PowerShell 函数 Test-SshAlive。
    # 找已经在跑、且带我们这条 -R 的 ssh 进程
    $procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
    # 循环处理each ($p in $procs)，按判断结果进入对应的处理分支。
        if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }
    }
    return $null
}

# 核对密钥文件后组装 ssh.exe 的 -R、保活及退出参数，并隐藏启动进程。
# 云端监听 RemoteBind，工控机目标为本机后端端口；短暂等待只检查进程是否退出，不读取 PLC 状态。
function Start-Tunnel {
# 定义 PowerShell 函数 Start-Tunnel。
    if (-not (Test-Path $KeyPath)) {
        Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"
        return $null
    }

    # 下面的参数数组交给本机 ssh.exe，核心 -R 请求云端监听 RemoteBind，并把连接送往工控机本机后端端口。
    # -N 不运行远程命令，连接用来承载转发；云端 Nginx 连到监听后，sshd 与本机 ssh 双向转交请求和响应字节。
    # 这里的保活与退出选项帮助发现断连或转发失败，进程存在本身仍不能证明应用接口或现场数据已正常。

    $args = @(
        '-N', '-T',
        '-o', 'ServerAliveInterval=15',
        '-o', 'ServerAliveCountMax=3',
        '-o', 'ExitOnForwardFailure=yes',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-i', $KeyPath,
        '-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",
        # 1. -R 是 ssh.exe 的远程转发参数，后一个字符串按“远端监听:本地目标地址:本地目标端口”解释。
        # 2. RemoteBind 配置为云端回环地址与 3300；后半段 127.0.0.1 指运行 ssh 的工控机自身。
        # 3. LocalBackendPort 默认目标是 3000，所以云端新连接沿 SSH 通道送回工控机后，再由 ssh 连接后端。
        # 4. 上方 -N 不执行远端命令，-T 不申请终端；这条连接主要承载双向转发字节。
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

# 注册 Windows 开机计划任务运行本脚本，任务选项与进程权限以此配置为准。
# 这里只定义脚本的安装分支；阅读或解释函数不会创建任务，是否执行取决于下方参数分支。
function Install-Task {
# 定义 PowerShell 函数 Install-Task。
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    # 给变量 $trigger 赋值。
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
    # 给变量 $principal 赋值。
    $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
    Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"
}

# 对应卸载参数分支，注销指定名称的 Windows 计划任务。
function Uninstall-Task {
# 定义 PowerShell 函数 Uninstall-Task。
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
