# 工控机恢复脚本，检查基础服务并处理隧道、后端、采集器与网页构建产物的启动关系。
# 先看参数和探测/进程辅助函数，再顺着主流程看端口检查、按需启动及输出状态。
# 这些检查验证配置、进程和连接的一部分；不能只由端口可达推断历史完整或物理动作完成。

<#
    ipc-recover.ps1 —— 工控机侧一键恢复(幂等)

    背景:2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起,
          公网站点实时数据全断(云端 nginx 502 connect() failed 111)。
          # 尝试建立网络连接。

    本脚本按依赖顺序拉起并自检(全部幂等,已在跑的不会重复起):
        1. 检查本机 MQTT、Redis、PostgreSQL 服务端口
        2. SSH 反向隧道(云端 -R 127.0.0.1:3300)
        3. NestJS 后端(node dist\main.js)
        4. PLC 采集器(python edge/plc_collector.py)
        5. 调 scripts\test\verify-line.ps1 自检

    用法:
        .\scripts\ipc-recover.ps1
        .\scripts\ipc-recover.ps1 -CloudUser linetwin -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
#>
[CmdletBinding()]
param(
    [string]$CloudHost = '119.91.145.27',
    [string]$CloudUser = 'root',
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$root = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $root
$logDir = Join-Path $root 'logs'
# 给变量 $logDir 赋值。
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

function Write-Step([string]$Msg) { Write-Host "==> $Msg" -ForegroundColor Cyan }

# 检查本机指定 TCP 端口是否能建立连接，供后续基础服务和后端恢复判断。
# 端口成功仅表示连接层面可达，不校验消息新鲜度、数据库内容或物理动作。
function Test-Port([int]$Port) {
# 定义 PowerShell 函数 Test-Port。
    $c = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)
    } catch { return $false } finally { $c.Close() }
}

# ---------- 1. 本机服务 ----------

# 恢复脚本从本机基础服务端口检查开始，随后继续处理隧道、后端与采集器进程。
# ports 列出的 MQTT、Redis、PostgreSQL 端口用于探测服务是否可连接；这是仓库里的预期端口配置。
# 端口可达与程序存在只覆盖启动检查的一部分，不能单独证明消息新鲜、历史写入或现场动作完成。

Write-Step '检查本机 MQTT / Redis / PostgreSQL'
$ports = @(1883, 6379, 5432)
foreach ($port in $ports) {
# 循环处理each ($port in $ports)，按判断结果进入对应的处理分支。
    if (-not (Test-Port $port)) {
        Write-Host "[FAIL] 本机端口 $port 未就绪,请检查对应的 Windows 服务" -ForegroundColor Red
        exit 1
    }
}

# ---------- 2. SSH 隧道(先于后端:后端经云端转发访问) ----------
Write-Step '确保 SSH 反向隧道在线'
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
if ($sshProc) {
    Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"
} else {
    $keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'
    # 给变量 $keepAlive 赋值。
    $kArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive,
        '-CloudHost', $CloudHost, '-CloudUser', $CloudUser, '-KeyPath', $KeyPath, '-Once')
    & powershell @kArgs
}

# ---------- 3. 后端 ----------
if (Test-Port 3000) {
    Write-Step '后端已在跑 (3000)'
} else {
    Write-Step '启动后端 node dist\main.js'
    $main = Join-Path $root 'server\dist\main.js'
    if (-not (Test-Path $main)) {
        if ($SkipBuild) {
            Write-Host '[FAIL] server\dist\main.js 不存在(且 -SkipBuild 已指定)' -ForegroundColor Red
        } else {
            Write-Host 'dist 缺失,先 npm run build ...' -ForegroundColor Yellow
            Push-Location (Join-Path $root 'server')
            npm.cmd run build
            Pop-Location
        }
    }
    if (Test-Path $main) {
        Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `
            -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
            -RedirectStandardError (Join-Path $logDir 'backend.err.log') | Out-Null
        for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }
        # 循环处理($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }，按判断结果进入对应的处理分支。
        Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))
    }
}

# ---------- 4. 采集器 ----------
$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
# 给变量 $collector 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }
if ($collector) {
    Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"
} else {
    Write-Step '启动 PLC 采集器'
    # 优先用 Python Launcher 选择最新 3.x；PATH 上的 python 可能仍是 3.9。
    $py = $null
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    # 给变量 $launcher 赋值。
    if ($launcher) {
        $candidate = & $launcher.Source -3 -c 'import sys; assert sys.version_info >= (3, 11); print(sys.executable)' 2>$null
        # 给变量 $candidate 赋值。
        if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }
    }
    if (-not $py) {
        $candidate = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        # 给变量 $candidate 赋值。
        if ($candidate) {
            $supported = & $candidate -c 'import sys; print(sys.version_info >= (3, 11))' 2>$null
            # 给变量 $supported 赋值。
            if ($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }
        }
    }
    if ($py) {
        Start-Process -FilePath $py -ArgumentList 'plc_collector.py' `
            -WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `
            -RedirectStandardError (Join-Path $logDir 'collector.err.log') | Out-Null
        Start-Sleep -Seconds 5
        Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
            Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)
    } else {
        Write-Host '[FAIL] 没找到 Python 3.11+,采集器起不来' -ForegroundColor Red
    }
}

# ---------- 5. 自检 ----------
Write-Step '体检'
& (Join-Path $root 'scripts\test\verify-line.ps1') -CloudHost $CloudHost
exit $LASTEXITCODE
# $LASTEXITCODE 是上一条外部命令的退出状态码
