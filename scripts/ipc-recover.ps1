<#
    # 这一段负责检查本机服务并恢复隧道、后端和采集器，为后续代码提供当前文件的处理入口。
    ipc-recover.ps1 —— 工控机侧一键恢复(幂等)
    # 调用 工控机侧一键恢复，把括号中的值作为参数传入，供当前处理流程继续使用。
    # ipc-recover 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    背景:2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起,
    # 设置字段 背景，值为 2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
          公网站点实时数据全断(云端 nginx 502 connect() failed 111)。
          # 尝试建立网络连接。
          # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    本脚本按依赖顺序拉起并自检(全部幂等,已在跑的不会重复起):
    # 调用 本脚本按依赖顺序拉起并自检，把括号中的值作为参数传入，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        1. 检查本机 MQTT、Redis、PostgreSQL 服务端口
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        2. SSH 反向隧道(云端 -R 127.0.0.1:3300)
        # 调用 反向隧道，把括号中的值作为参数传入，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        3. NestJS 后端(node dist\main.js)
        # 调用 后端，把括号中的值作为参数传入，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        4. PLC 采集器(python edge/plc_collector.py)
        # 调用 采集器，把括号中的值作为参数传入，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        5. 调 scripts\test\verify-line.ps1 自检
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # verify-line 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        .\scripts\ipc-recover.ps1
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # ipc-recover 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        .\scripts\ipc-recover.ps1 -CloudUser linetwin -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # $env:USERPROFILE 是进程环境变量中的配置值；ipc-recover 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
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
    [switch]$SkipBuild
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $SkipBuild 是本脚本或当前函数前面定义的配置、命令结果或路径值
)
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 开始执行可能失败的操作，错误由后续异常分支处理。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
$root = Split-Path -Parent $PSCommandPath
# 根据 Split-Path -Parent $PSCommandPath 设置 $root，供当前流程后续使用。
# $root 是本脚本或当前函数前面定义的配置、命令结果或路径值；$PSCommandPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；Split-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$root = Split-Path -Parent $root
# 根据 Split-Path -Parent $root 设置 $root，供当前流程后续使用。
# $root 是本脚本或当前函数前面定义的配置、命令结果或路径值；Split-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$logDir = Join-Path $root 'logs'
# 给变量 $logDir 赋值。
# $logDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；$root 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
# 检查(-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }，按判断结果进入对应的处理分支。
# $logDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

function Write-Step([string]$Msg) { Write-Host "==> $Msg" -ForegroundColor Cyan }
# 定义 PowerShell 函数 Write-Step。
# $Msg 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
function Test-Port([int]$Port) {
# 定义 PowerShell 函数 Test-Port。
# $Port 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Port 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $c = New-Object System.Net.Sockets.TcpClient
    # 根据 New-Object System.Net.Sockets.TcpClient 设置 $c，供当前流程后续使用。
    # $c 是本脚本或当前函数前面定义的配置、命令结果或路径值；New-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    try {
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        # 执行 BeginConnect 对应的本地处理，使用本行提供的数据，将结果保存或写入 $iar。
        # $iar 是本脚本或当前函数前面定义的配置、命令结果或路径值；$c 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Port 是本脚本或当前函数前面定义的配置、命令结果或路径值
        return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)
        # 把($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)作为当前函数的结果返回。
        # $iar 是本脚本或当前函数前面定义的配置、命令结果或路径值；$false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$c 是本脚本或当前函数前面定义的配置、命令结果或路径值
    } catch { return $false } finally { $c.Close() }
    # 接收并处理上一段操作产生的异常。
    # $false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$c 是本脚本或当前函数前面定义的配置、命令结果或路径值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# ---------- 1. 本机服务 ----------

# 恢复脚本从本机基础服务端口检查开始，随后继续处理隧道、后端与采集器进程。
# ports 列出的 MQTT、Redis、PostgreSQL 端口用于探测服务是否可连接；这是仓库里的预期端口配置。
# 端口可达与程序存在只覆盖启动检查的一部分，不能单独证明消息新鲜、历史写入或现场动作完成。

Write-Step '检查本机 MQTT / Redis / PostgreSQL'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$ports = @(1883, 6379, 5432)
# 根据 @(1883, 6379, 5432) 设置 $ports，供当前流程后续使用。
# $ports 是本脚本或当前函数前面定义的配置、命令结果或路径值
foreach ($port in $ports) {
# 循环处理each ($port in $ports)，按判断结果进入对应的处理分支。
# $port 是本脚本或当前函数前面定义的配置、命令结果或路径值；$ports 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if (-not (Test-Port $port)) {
    # 检查(-not (Test-Port $port))，按判断结果进入对应的处理分支。
    # $port 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Port 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Write-Host "[FAIL] 本机端口 $port 未就绪,请检查对应的 Windows 服务" -ForegroundColor Red
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $port 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        exit 1
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# ---------- 2. SSH 隧道(先于后端:后端经云端转发访问) ----------
Write-Step '确保 SSH 反向隧道在线'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
# $sshProc 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-CimInstance 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if ($sshProc) {
# 检查($sshProc)，按判断结果进入对应的处理分支。
# $sshProc 是本脚本或当前函数前面定义的配置、命令结果或路径值
    Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $sshProc 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
} else {
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    $keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'
    # 给变量 $keepAlive 赋值。
    # $keepAlive 是本脚本或当前函数前面定义的配置、命令结果或路径值；$root 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $kArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive,
    # 根据 @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive, 设置 $kArgs，供当前流程后续使用。
    # $kArgs 是本脚本或当前函数前面定义的配置、命令结果或路径值；$keepAlive 是本脚本或当前函数前面定义的配置、命令结果或路径值
        '-CloudHost', $CloudHost, '-CloudUser', $CloudUser, '-KeyPath', $KeyPath, '-Once')
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # $CloudHost 是本脚本或当前函数前面定义的配置、命令结果或路径值；$CloudUser 是本脚本或当前函数前面定义的配置、命令结果或路径值；$KeyPath 是本脚本或当前函数前面定义的配置、命令结果或路径值
    & powershell @kArgs
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# ---------- 3. 后端 ----------
if (Test-Port 3000) {
# 检查(Test-Port 3000)，按判断结果进入对应的处理分支。
# Test-Port 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Write-Step '后端已在跑 (3000)'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
} else {
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Write-Step '启动后端 node dist\main.js'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $main = Join-Path $root 'server\dist\main.js'
    # 根据 Join-Path $root 'server\dist\main.js' 设置 $main，供当前流程后续使用。
    # $main 是本脚本或当前函数前面定义的配置、命令结果或路径值；$root 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if (-not (Test-Path $main)) {
    # 检查(-not (Test-Path $main))，按判断结果进入对应的处理分支。
    # $main 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        if ($SkipBuild) {
        # 检查($SkipBuild)，按判断结果进入对应的处理分支。
        # $SkipBuild 是本脚本或当前函数前面定义的配置、命令结果或路径值
            Write-Host '[FAIL] server\dist\main.js 不存在(且 -SkipBuild 已指定)' -ForegroundColor Red
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        } else {
        # 结束当前函数、分支或对象配置，返回上一层处理流程。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
            Write-Host 'dist 缺失,先 npm run build ...' -ForegroundColor Yellow
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
            Push-Location (Join-Path $root 'server')
            # 执行 Location 对应的本地处理，使用本行提供的数据。
            # $root 是本脚本或当前函数前面定义的配置、命令结果或路径值；Push-Location 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
            npm.cmd run build
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
            Pop-Location
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # Pop-Location 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        }
        # 结束当前函数、分支或对象配置，返回上一层处理流程。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    if (Test-Path $main) {
    # 检查(Test-Path $main)，按判断结果进入对应的处理分支。
    # $main 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `
            -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
            -RedirectStandardError (Join-Path $logDir 'backend.err.log') | Out-Null
            # 执行 RedirectStandardError 对应的本地处理，使用本行提供的数据。
            # $logDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }
        # 循环处理($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }，按判断结果进入对应的处理分支。
        # $i 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Port 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))
        # 执行 Host 对应的本地处理，使用本行提供的数据。
        # Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# ---------- 4. 采集器 ----------
$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
# 给变量 $collector 赋值。
# $collector 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-CimInstance 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if ($collector) {
# 检查($collector)，按判断结果进入对应的处理分支。
# $collector 是本脚本或当前函数前面定义的配置、命令结果或路径值
    Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $collector 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
} else {
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Write-Step '启动 PLC 采集器'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    # 优先用 Python Launcher 选择最新 3.x；PATH 上的 python 可能仍是 3.9。
    $py = $null
    # 根据 $null 设置 $py，供当前流程后续使用。
    # $py 是本脚本或当前函数前面定义的配置、命令结果或路径值
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    # 给变量 $launcher 赋值。
    # $launcher 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Command 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if ($launcher) {
    # 检查($launcher)，按判断结果进入对应的处理分支。
    # $launcher 是本脚本或当前函数前面定义的配置、命令结果或路径值
        $candidate = & $launcher.Source -3 -c 'import sys; assert sys.version_info >= (3, 11); print(sys.executable)' 2>$null
        # 给变量 $candidate 赋值。
        # $candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值；$launcher 是本脚本或当前函数前面定义的配置、命令结果或路径值
        if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }
        # 检查($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }，按判断结果进入对应的处理分支。
        # $LASTEXITCODE 是上一条外部命令的退出状态码；$candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值；$py 是本脚本或当前函数前面定义的配置、命令结果或路径值
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    if (-not $py) {
    # 检查(-not $py)，按判断结果进入对应的处理分支。
    # $py 是本脚本或当前函数前面定义的配置、命令结果或路径值
        $candidate = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        # 给变量 $candidate 赋值。
        # $candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Command 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        if ($candidate) {
        # 检查($candidate)，按判断结果进入对应的处理分支。
        # $candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值
            $supported = & $candidate -c 'import sys; print(sys.version_info >= (3, 11))' 2>$null
            # 给变量 $supported 赋值。
            # $supported 是本脚本或当前函数前面定义的配置、命令结果或路径值；$candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值
            if ($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }
            # 检查($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }，按判断结果进入对应的处理分支。
            # $LASTEXITCODE 是上一条外部命令的退出状态码；$supported 是本脚本或当前函数前面定义的配置、命令结果或路径值；$py 是本脚本或当前函数前面定义的配置、命令结果或路径值；$candidate 是本脚本或当前函数前面定义的配置、命令结果或路径值
        }
        # 结束当前函数、分支或对象配置，返回上一层处理流程。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    if ($py) {
    # 检查($py)，按判断结果进入对应的处理分支。
    # $py 是本脚本或当前函数前面定义的配置、命令结果或路径值
        Start-Process -FilePath $py -ArgumentList 'plc_collector.py' `
            -WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `
            -RedirectStandardError (Join-Path $logDir 'collector.err.log') | Out-Null
            # 执行 RedirectStandardError 对应的本地处理，使用本行提供的数据。
            # $logDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Start-Sleep -Seconds 5
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # Start-Sleep 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        # 执行 Host 对应的本地处理，使用本行提供的数据。
        # Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
            Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    } else {
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        Write-Host '[FAIL] 没找到 Python 3.11+,采集器起不来' -ForegroundColor Red
        # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
        # Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# ---------- 5. 自检 ----------
Write-Step '体检'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Step 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
& (Join-Path $root 'scripts\test\verify-line.ps1') -CloudHost $CloudHost
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $root 是本脚本或当前函数前面定义的配置、命令结果或路径值；$CloudHost 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
exit $LASTEXITCODE
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $LASTEXITCODE 是上一条外部命令的退出状态码
# 这一段提供了检查本机服务并恢复隧道、后端和采集器所需的定义和处理逻辑，结果交由调用方或运行环境使用。
