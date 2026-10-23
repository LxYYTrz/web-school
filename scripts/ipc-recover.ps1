<#
    ipc-recover.ps1 —— 工控机侧一键恢复(幂等)

    背景:2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起,
          公网站点实时数据全断(云端 nginx 502 connect() failed 111)。

    本脚本按依赖顺序拉起并自检(全部幂等,已在跑的不会重复起):
        1. Docker Desktop → docker compose -f deploy/docker-compose.ipc.yml up -d (EMQX/Redis)
        2. SSH 反向隧道(云端 -R 172.18.0.1:3300)—— 后端经云端转发访问,必须先有
        3. NestJS 后端(node dist\main.js)
        4. PLC 采集器(python edge/plc_collector.py)
        5. 调 scripts\verify-line.ps1 自检

    用法:
        .\scripts\ipc-recover.ps1
        .\scripts\ipc-recover.ps1 -CloudUser linetwin -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
#>
[CmdletBinding()]
param(
    [string]$CloudHost = '119.91.145.27',
    [string]$CloudUser = 'root',
    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$root = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $root
$logDir = Join-Path $root 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

function Write-Step([string]$Msg) { Write-Host "==> $Msg" -ForegroundColor Cyan }
function Test-Port([int]$Port) {
    $c = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)
    } catch { return $false } finally { $c.Close() }
}

# ---------- 1. Docker + 中间件 ----------
Write-Step '检查 Docker / 中间件'
$dockerOk = $false
try {
    $v = (docker info --format '{{.ServerVersion}}' 2>$null | Select-Object -First 1)
    $dockerOk = ($v -match '^\d+\.')
} catch { }
if (-not $dockerOk) {
    Write-Host 'Docker 未运行,尝试拉起 Docker Desktop ...' -ForegroundColor Yellow
    $dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
    if (Test-Path $dockerExe) {
        Start-Process -FilePath $dockerExe | Out-Null
        for ($i = 0; $i -lt 60; $i++) {
            Start-Sleep -Seconds 5
            try {
                $v = (docker info --format '{{.ServerVersion}}' 2>$null | Select-Object -First 1)
                if ($v -match '^\d+\.') { $dockerOk = $true; break }
            } catch { }
        }
    }
    if (-not $dockerOk) {
        Write-Host '[FAIL] Docker 起不来 —— 中间件改用原生 EMQX/Memurai(端口 1883/6379 保持一致)' -ForegroundColor Red
    }
}
if ($dockerOk) {
    Write-Step 'docker compose -f deploy/docker-compose.ipc.yml up -d'
    docker compose -f (Join-Path $root 'deploy\docker-compose.ipc.yml') up -d
    for ($i = 0; $i -lt 30; $i++) {
        if ((Test-Port 1883) -and (Test-Port 6379)) { break }
        Start-Sleep -Seconds 2
    }
    Write-Host ("MQTT 1883 = {0} / Redis 6379 = {1}" -f (Test-Port 1883), (Test-Port 6379))
}

# ---------- 2. SSH 隧道(先于后端:后端经云端转发访问) ----------
Write-Step '确保 SSH 反向隧道在线'
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*172.18.0.1:3300*' }
if ($sshProc) {
    Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"
} else {
    $keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'
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
            npm run build
            Pop-Location
        }
    }
    if (Test-Path $main) {
        Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `
            -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
            -RedirectStandardError (Join-Path $logDir 'backend.err.log') | Out-Null
        for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }
        Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))
    }
}

# ---------- 4. 采集器 ----------
$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }
if ($collector) {
    Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"
} else {
    Write-Step '启动 PLC 采集器'
    $py = (Get-Command python -ErrorAction SilentlyContinue)
    if ($py) {
        Start-Process -FilePath $py.Source -ArgumentList 'plc_collector.py' `
            -WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `
            -RedirectStandardError (Join-Path $logDir 'collector.err.log') | Out-Null
        Start-Sleep -Seconds 5
        Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
            Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)
    } else {
        Write-Host '[FAIL] 没找到 python,采集器起不来' -ForegroundColor Red
    }
}

# ---------- 5. 自检 ----------
Write-Step '体检'
& (Join-Path $root 'scripts\verify-line.ps1') -CloudHost $CloudHost
exit $LASTEXITCODE
