# scripts/tunnel-keepalive.ps1 逐行说明

[打开源码](../../../scripts/tunnel-keepalive.ps1) · 106 行 · 80 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 16 | <code>[CmdletBinding()]</code> | 执行 PowerShell 命令或补全参数。 |
| 17 | <code>param(</code> | 控制执行流程或声明脚本参数。 |
| 18 | <code>[string]$CloudHost = '119.91.145.27',</code> | 执行 PowerShell 命令或补全参数。 |
| 19 | <code>[string]$CloudUser = 'root',</code> | 执行 PowerShell 命令或补全参数。 |
| 20 | <code>[string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',</code> | 执行 PowerShell 命令或补全参数。 |
| 21 | <code>[string]$RemoteBind = '127.0.0.1:3300',</code> | 执行 PowerShell 命令或补全参数。 |
| 22 | <code>[int]$LocalBackendPort = 3000,</code> | 执行 PowerShell 命令或补全参数。 |
| 23 | <code>[int]$IntervalSec = 30,</code> | 执行 PowerShell 命令或补全参数。 |
| 24 | <code>[switch]$InstallTask,</code> | 执行 PowerShell 命令或补全参数。 |
| 25 | <code>[switch]$UninstallTask,</code> | 执行 PowerShell 命令或补全参数。 |
| 26 | <code>[switch]$Once</code> | 执行 PowerShell 命令或补全参数。 |
| 27 | <code>)</code> | 执行 PowerShell 命令或补全参数。 |
| 29 | <code>$ErrorActionPreference = 'Continue'</code> | 给变量 `$ErrorActionPreference` 赋值。 |
| 30 | <code>$TaskName = 'line-twin-tunnel'</code> | 给变量 `$TaskName` 赋值。 |
| 31 | <code>$ScriptPath = $PSCommandPath</code> | 给变量 `$ScriptPath` 赋值。 |
| 33 | <code>function Write-Log([string]$Msg) {</code> | 定义 PowerShell 函数 `Write-Log`。 |
| 34 | <code>Write-Host ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Msg)</code> | 执行 PowerShell 命令或补全参数。 |
| 35 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 37 | <code>function Test-SshAlive {</code> | 定义 PowerShell 函数 `Test-SshAlive`。 |
| 39 | <code>$procs = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue</code> | 给变量 `$procs` 赋值。 |
| 40 | <code>foreach ($p in $procs) {</code> | 控制执行流程或声明脚本参数。 |
| 41 | <code>if ($p.CommandLine -and $p.CommandLine -like "*$RemoteBind*") { return $p }</code> | 控制执行流程或声明脚本参数。 |
| 42 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 43 | <code>return $null</code> | 执行 PowerShell 命令或补全参数。 |
| 44 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 46 | <code>function Start-Tunnel {</code> | 定义 PowerShell 函数 `Start-Tunnel`。 |
| 47 | <code>if (-not (Test-Path $KeyPath)) {</code> | 控制执行流程或声明脚本参数。 |
| 48 | <code>Write-Log "[FAIL] 私钥不存在: $KeyPath(先 ssh-keygen 生成,或把公钥交给云端管理员)"</code> | 执行 PowerShell 命令或补全参数。 |
| 49 | <code>return $null</code> | 执行 PowerShell 命令或补全参数。 |
| 50 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 51 | <code>$args = @(</code> | 给变量 `$args` 赋值。 |
| 52 | <code>'-N', '-T',</code> | 执行 PowerShell 命令或补全参数。 |
| 53 | <code>'-o', 'ServerAliveInterval=15',</code> | 执行 PowerShell 命令或补全参数。 |
| 54 | <code>'-o', 'ServerAliveCountMax=3',</code> | 执行 PowerShell 命令或补全参数。 |
| 55 | <code>'-o', 'ExitOnForwardFailure=yes',</code> | 执行 PowerShell 命令或补全参数。 |
| 56 | <code>'-o', 'StrictHostKeyChecking=accept-new',</code> | 执行 PowerShell 命令或补全参数。 |
| 57 | <code>'-i', $KeyPath,</code> | 执行 PowerShell 命令或补全参数。 |
| 58 | <code>'-R', "${RemoteBind}:127.0.0.1:${LocalBackendPort}",</code> | 执行 PowerShell 命令或补全参数。 |
| 60 | <code>"${CloudUser}@${CloudHost}"</code> | 执行 PowerShell 命令或补全参数。 |
| 61 | <code>)</code> | 执行 PowerShell 命令或补全参数。 |
| 62 | <code>Write-Log "拉起隧道: ssh $($args -join ' ')"</code> | 执行 PowerShell 命令或补全参数。 |
| 63 | <code>$p = Start-Process -FilePath 'ssh.exe' -ArgumentList $args -PassThru -WindowStyle Hidden</code> | 给变量 `$p` 赋值。 |
| 64 | <code>Start-Sleep -Seconds 5</code> | 执行 PowerShell 命令或补全参数。 |
| 65 | <code>if ($p.HasExited) {</code> | 控制执行流程或声明脚本参数。 |
| 66 | <code>Write-Log "[FAIL] 隧道进程立刻退出(exit=$($p.ExitCode))。常见原因:-R 绑定地址在云端不存在 / 公钥没装 / 云端 PermitOpen 限制"</code> | 执行 PowerShell 命令或补全参数。 |
| 67 | <code>return $null</code> | 执行 PowerShell 命令或补全参数。 |
| 68 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 69 | <code>Write-Log "隧道已建立 (pid=$($p.Id))"</code> | 执行 PowerShell 命令或补全参数。 |
| 70 | <code>return $p</code> | 执行 PowerShell 命令或补全参数。 |
| 71 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 73 | <code>function Install-Task {</code> | 定义 PowerShell 函数 `Install-Task`。 |
| 74 | <code>$action = New-ScheduledTaskAction -Execute 'powershell.exe' `</code> | 给变量 `$action` 赋值。 |
| 75 | <code>-Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""</code> | 执行 PowerShell 命令或补全参数。 |
| 76 | <code>$trigger = New-ScheduledTaskTrigger -AtStartup</code> | 给变量 `$trigger` 赋值。 |
| 77 | <code>$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -RunLevel Highest -LogonType ServiceAccount</code> | 给变量 `$principal` 赋值。 |
| 78 | <code>$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `</code> | 给变量 `$settings` 赋值。 |
| 79 | <code>-ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable</code> | 执行 PowerShell 命令或补全参数。 |
| 80 | <code>Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `</code> | 执行 PowerShell 命令或补全参数。 |
| 81 | <code>-Principal $principal -Settings $settings -Force &#124; Out-Null</code> | 执行 PowerShell 命令或补全参数。 |
| 82 | <code>Write-Log "已注册计划任务 '$TaskName'(开机自启 + 异常自动重启)"</code> | 执行 PowerShell 命令或补全参数。 |
| 83 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 85 | <code>function Uninstall-Task {</code> | 定义 PowerShell 函数 `Uninstall-Task`。 |
| 86 | <code>Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue</code> | 执行 PowerShell 命令或补全参数。 |
| 87 | <code>Write-Log "已注销计划任务 '$TaskName'"</code> | 执行 PowerShell 命令或补全参数。 |
| 88 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 90 | <code>if ($InstallTask) { Install-Task; exit 0 }</code> | 控制执行流程或声明脚本参数。 |
| 91 | <code>if ($UninstallTask) { Uninstall-Task; exit 0 }</code> | 控制执行流程或声明脚本参数。 |
| 93 | <code>Write-Log "看门狗启动: 云端=$CloudHost 绑定=$RemoteBind 本地后端=$LocalBackendPort 间隔=${IntervalSec}s"</code> | 执行 PowerShell 命令或补全参数。 |
| 95 | <code>while ($true) {</code> | 控制执行流程或声明脚本参数。 |
| 96 | <code>$alive = Test-SshAlive</code> | 给变量 `$alive` 赋值。 |
| 97 | <code>if ($null -eq $alive) {</code> | 控制执行流程或声明脚本参数。 |
| 98 | <code>Write-Log "隧道进程不存在 → 重连"</code> | 执行 PowerShell 命令或补全参数。 |
| 99 | <code>[void](Start-Tunnel)</code> | 执行 PowerShell 命令或补全参数。 |
| 100 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 101 | <code>else {</code> | 执行 PowerShell 命令或补全参数。 |
| 102 | <code>Write-Log "隧道在线 (pid=$($alive.ProcessId))"</code> | 执行 PowerShell 命令或补全参数。 |
| 103 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 104 | <code>if ($Once) { break }</code> | 控制执行流程或声明脚本参数。 |
| 105 | <code>Start-Sleep -Seconds $IntervalSec</code> | 执行 PowerShell 命令或补全参数。 |
| 106 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
