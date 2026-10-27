<#
    # 这一段负责安装或运行 SSH 反向隧道保活巡检，为后续代码提供当前文件的处理入口。
    tunnel-keepalive.ps1 —— SSH 反向隧道看门狗(工控机侧)
    # 调用 反向隧道看门狗，把括号中的值作为参数传入，供当前处理流程继续使用。
    # tunnel-keepalive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    背景:隧道断 = 公网站点实时数据全断(云端 nginx 502)。
    # 调用 公网站点实时数据全断，把括号中的值作为参数传入，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    2026-10-23 事故:工控机重启后隧道进程没起来,公网 /api 一直 502 到 8h。
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        .\scripts\tunnel-keepalive.ps1                     # 前台跑看门狗
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # tunnel-keepalive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        .\scripts\tunnel-keepalive.ps1 -Once               # 只检查+必要时重连一次,然后退出
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # tunnel-keepalive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        .\scripts\tunnel-keepalive.ps1 -InstallTask        # 注册成开机自启的计划任务
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # tunnel-keepalive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        .\scripts\tunnel-keepalive.ps1 -UninstallTask      # 注销计划任务
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # tunnel-keepalive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    关键参数(默认值已按线上现状填好):
    # 调用 关键参数，把括号中的值作为参数传入，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        -RemoteBind 127.0.0.1:3300   云端原生 Nginx 使用的本机隧道入口。
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
#>
[CmdletBinding()]
# 执行 CmdletBinding 对应的本地处理，使用本行提供的数据。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
param(
# 执行 param 对应的本地处理，使用本行提供的数据。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    [string]$CloudHost = '119.91.145.27',
    # 根据 '119.91.145.27', 设置 [string]$CloudHost，供当前流程后续使用。
    # $CloudHost 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [string]$CloudUser = 'root',
    # 根据 'root', 设置 [string]$CloudUser，供当前流程后续使用。
    # $CloudUser 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
    # 根据 'C:\ProgramData\line-twin\tunnel_ed25519', 设置 [string]$KeyPath，供当前流程后续使用。
    # $KeyPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；line-twin 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    # RemoteBind 描述云端 sshd 要创建的监听地址；LocalBackendPort 描述工控机 ssh 连接的本机后端目标。
    # 下面 -R 将两者拼成“云端监听地址:工控机目标地址”，所以两个 127.0.0.1 属于不同机器。
    # 工控机 ssh 先主动连接 CloudHost 的 SSH 服务，外部 API 请求随后才经这条既有通道转交。

    [string]$RemoteBind = '127.0.0.1:3300',
    # 根据 '127.0.0.1:3300', 设置 [string]$RemoteBind，供当前流程后续使用。
    # $RemoteBind 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [int]$LocalBackendPort = 3000,
    # 根据 3000, 设置 [int]$LocalBackendPort，供当前流程后续使用。
    # $LocalBackendPort 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [int]$IntervalSec = 30,
    # 根据 30, 设置 [int]$IntervalSec，供当前流程后续使用。
    # $IntervalSec 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [switch]$InstallTask,
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $InstallTask 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [switch]$UninstallTask,
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $UninstallTask 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [switch]$Once
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $Once 是本脚本或当前函数前面定义的配置、命令结果或路径值
)
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
$TaskName = 'line-twin-tunnel'
# 给变量 $TaskName 赋值。
# $TaskName 是本脚本或当前函数前面定义的配置、命令结果或路径值；line-twin 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$ScriptPath = $PSCommandPath
# 给变量 $ScriptPath 赋值。
# $ScriptPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；$PSCommandPath 是本脚本或当前函数前面定义的配置、命令结果或路径值

function Write-Log([string]$Msg) {
# 定义 PowerShell 函数 Write-Log。
# $Msg 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)
    # 执行 Host 对应的本地处理，使用本行提供的数据。
    # $Msg 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

function Test-SshAlive {
# 定义 PowerShell 函数 Test-SshAlive。
# Test-SshAlive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    # 找已经在跑、且带我们这条 -R 的 ssh 进程
    $procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue
    # 根据 Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue 设置 $procs，供当前流程后续使用。
    # $procs 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-CimInstance 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    foreach ($p in $procs) {
    # 循环处理each ($p in $procs)，按判断结果进入对应的处理分支。
    # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值；$procs 是本脚本或当前函数前面定义的配置、命令结果或路径值
        if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }
        # 检查($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }，按判断结果进入对应的处理分支。
        # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值；$RemoteBind 是本脚本或当前函数前面定义的配置、命令结果或路径值
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    return $null
    # 把$null作为当前函数的结果返回。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

function Start-Tunnel {
# 定义 PowerShell 函数 Start-Tunnel。
# Start-Tunnel 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if (-not (Test-Path $KeyPath)) {
    # 检查(-not (Test-Path $KeyPath))，按判断结果进入对应的处理分支。
    # $KeyPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $KeyPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        return $null
        # 把$null作为当前函数的结果返回。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    # 下面的参数数组交给本机 ssh.exe，核心 -R 请求云端监听 RemoteBind，并把连接送往工控机本机后端端口。
    # -N 不运行远程命令，连接用来承载转发；云端 Nginx 连到监听后，sshd 与本机 ssh 双向转交请求和响应字节。
    # 这里的保活与退出选项帮助发现断连或转发失败，进程存在本身仍不能证明应用接口或现场数据已正常。

    $args = @(
    # 根据 @( 设置 $args，供当前流程后续使用。
    # $args 是本脚本或当前函数前面定义的配置、命令结果或路径值
        '-N', '-T',
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        '-o', 'ServerAliveInterval=15',
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        '-o', 'ServerAliveCountMax=3',
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        '-o', 'ExitOnForwardFailure=yes',
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        '-o', 'StrictHostKeyChecking=accept-new',
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # accept-new 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        '-i', $KeyPath,
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $KeyPath 是本脚本或当前函数前面定义的配置、命令结果或路径值
        '-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        # ★ 数据库只走本地(2026-10-23 云端库下线),不再建立 -L 5432 的数据库方向转发
        "${CloudUser}@${CloudHost}"
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    )
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Write-Log "拉起隧道: ssh $($args -join ' ')"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $args 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $p = Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden
    # 根据 Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden 设置 $p，供当前流程后续使用。
    # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值；$args 是本脚本或当前函数前面定义的配置、命令结果或路径值；Start-Process 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Start-Sleep -Seconds 5
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # Start-Sleep 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if ($p.HasExited) {
    # 检查($p.HasExited)，按判断结果进入对应的处理分支。
    # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值
        Write-Log "[FAIL] 隧道进程立刻退出(exit=$($p.ExitCode))。常见原因:-R 绑定地址在云端不存在 / 公钥没装 / 云端 PermitOpen 限制"
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        return $null
        # 把$null作为当前函数的结果返回。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Write-Log "隧道已建立 (pid=$($p.Id))"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    return $p
    # 把$p作为当前函数的结果返回。
    # $p 是本脚本或当前函数前面定义的配置、命令结果或路径值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

function Install-Task {
# 定义 PowerShell 函数 Install-Task。
# Install-Task 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $action = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $ScriptPath 是本脚本或当前函数前面定义的配置、命令结果或路径值
    $trigger = New-ScheduledTaskTrigger -AtStartup
    # 给变量 $trigger 赋值。
    # $trigger 是本脚本或当前函数前面定义的配置、命令结果或路径值；New-ScheduledTaskTrigger 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount
    # 给变量 $principal 赋值。
    # $principal 是本脚本或当前函数前面定义的配置、命令结果或路径值；New-ScheduledTaskPrincipal 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
        -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable
        # 执行 ExecutionTimeLimit 对应的本地处理，使用本行提供的数据。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
        -Principal $principal -Settings $settings -Force | Out-Null
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $principal 是本脚本或当前函数前面定义的配置、命令结果或路径值；$settings 是本脚本或当前函数前面定义的配置、命令结果或路径值；Out-Null 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $TaskName 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

function Uninstall-Task {
# 定义 PowerShell 函数 Uninstall-Task。
# Uninstall-Task 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $TaskName 是本脚本或当前函数前面定义的配置、命令结果或路径值；$false 是本脚本或当前函数前面定义的配置、命令结果或路径值；Unregister-ScheduledTask 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Write-Log "已注销计划任务 '$TaskName'"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $TaskName 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

if ($InstallTask) { Install-Task; exit 0 }
# 检查($InstallTask) { Install-Task; exit 0 }，按判断结果进入对应的处理分支。
# $InstallTask 是本脚本或当前函数前面定义的配置、命令结果或路径值；Install-Task 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if ($UninstallTask) { Uninstall-Task; exit 0 }
# 检查($UninstallTask) { Uninstall-Task; exit 0 }，按判断结果进入对应的处理分支。
# $UninstallTask 是本脚本或当前函数前面定义的配置、命令结果或路径值；Uninstall-Task 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

Write-Log "看门狗启动: 云端=$CloudHost 绑定=$RemoteBind 本地后端=$LocalBackendPort 间隔=${IntervalSec}s"
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $CloudHost 是本脚本或当前函数前面定义的配置、命令结果或路径值；$RemoteBind 是本脚本或当前函数前面定义的配置、命令结果或路径值；$LocalBackendPort 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

while ($true) {
# 持续检查($true)，按判断结果进入对应的处理分支。
# $true 是本脚本或当前函数前面定义的配置、命令结果或路径值
    $alive = Test-SshAlive
    # 根据 Test-SshAlive 设置 $alive，供当前流程后续使用。
    # $alive 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-SshAlive 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if ($null -eq $alive) {
    # 检查($null -eq $alive)，按判断结果进入对应的处理分支。
    # $alive 是本脚本或当前函数前面定义的配置、命令结果或路径值
        Write-Log "隧道进程不存在 → 重连"
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        [void](Start-Tunnel)
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # Start-Tunnel 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    else {
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        Write-Log "隧道在线 (pid=$($alive.ProcessId))"
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $alive 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Log 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    if ($Once) { break }
    # 检查($Once) { break }，按判断结果进入对应的处理分支。
    # $Once 是本脚本或当前函数前面定义的配置、命令结果或路径值
    Start-Sleep -Seconds $IntervalSec
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $IntervalSec 是本脚本或当前函数前面定义的配置、命令结果或路径值；Start-Sleep 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
# 这一段提供了安装或运行 SSH 反向隧道保活巡检所需的定义和处理逻辑，结果交由调用方或运行环境使用。
