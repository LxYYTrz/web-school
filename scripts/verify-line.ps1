<#
    verify-line.ps1 —— line-twin 全链路只读体检(工控机侧)

    检查项(全部只读,不下发任何控制指令):
      1. Docker / 中间件容器(EMQX 1883、Redis 6379)
      2. SSH 隧道进程(云端 -R 172.18.0.1:3300)
      3. 本地后端 http://localhost:3000/api/lines/line-01/snapshot
      4. 云端公网 http://<云IP>:8081/api/lines/line-01/snapshot
      5. PLC 实时状态(只读,见 edge/plc_read_state.py)

    用法:
        .\scripts\verify-line.ps1
        .\scripts\verify-line.ps1 -CloudHost 119.91.145.27 -CloudPort 8081
    退出码:0=全部通过;1=有 FAIL
#>
[CmdletBinding()]
param(
    [string]$CloudHost = '119.91.145.27',
    [int]$CloudPort = 8081,
    [switch]$SkipPlc
)

$ErrorActionPreference = 'Continue'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$root = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent $root   # 仓库根
$results = New-Object System.Collections.ArrayList

function Test-DockerRunning {
    $v = (docker info --format '{{.ServerVersion}}' 2>$null | Select-Object -First 1)
    return ($v -match '^\d+\.')
}

function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
    [void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })
}

function Test-Port([int]$Port) {
    $c = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
        return $ok
    } catch { return $false } finally { $c.Close() }
}

function Get-Json([string]$Url, [int]$TimeoutSec = 8) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        return @{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return @{ ok = $false; body = $_.Exception.Message; code = $code }
    }
}

Write-Host "=== line-twin 全链路体检 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan

# 1. Docker / 中间件
$dockerOk = Test-DockerRunning
Add-Result 'Docker 守护进程' $dockerOk $(if ($dockerOk) { 'running' } else { '未运行 —— docker compose 起不来' })
if ($dockerOk) {
    $ems = docker ps --filter 'name=lt-ipc-emqx' --format '{{.Status}}'
    $rds = docker ps --filter 'name=lt-ipc-redis' --format '{{.Status}}'
    Add-Result '容器 lt-ipc-emqx' ([bool]$ems) ($ems -join ' ')
    Add-Result '容器 lt-ipc-redis' ([bool]$rds) ($rds -join ' ')
}
Add-Result 'MQTT 1883' (Test-Port 1883) 'EMQX(容器或原生)'
Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'

# 2. SSH 隧道
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*172.18.0.1:3300*' }
Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })

# 3. 本地后端
$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'
Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"
if ($local.ok) {
    try {
        $j = $local.body | ConvertFrom-Json
        Add-Result '快照状态' $true "state=$($j.status.state) edge=$($j.edge.status) 数据时间=$([DateTimeOffset]::FromUnixTimeMilliseconds([int64]$j.ts).ToLocalTime().ToString('yyyy-MM-dd HH:mm:ss'))"
    } catch { Add-Result '快照解析' $false $_.Exception.Message }
}

# 4. 公网
$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"
Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"

# 5. PLC 只读
if (-not $SkipPlc) {
    $py = $null
    foreach ($c in @('python', 'py -3')) {
        $cmd = Get-Command $c -ErrorAction SilentlyContinue
        if ($cmd) { $py = $c; break }
    }
    if ($py) {
        $out = & $py (Join-Path $root 'edge\plc_read_state.py') 2>&1 | Out-String
        $plcOk = $out -match '\[OK\]'
        Add-Result 'PLC 只读状态' $plcOk (($out -split "`n" | Where-Object { $_ -match '产线状态|FAIL' }) -join ' | ').Trim()
        Write-Host $out -ForegroundColor DarkGray
    } else {
        Add-Result 'PLC 只读状态' $false '没找到 python'
    }
}

Write-Host ""
$results | Format-Table -AutoSize | Out-String | Write-Host
$failed = @($results | Where-Object { $_.结果 -eq 'FAIL' })
if ($failed.Count -gt 0) {
    Write-Host "有 $($failed.Count) 项 FAIL —— 对照 docs/deploy-guide.md §4 排查表" -ForegroundColor Red
    exit 1
}
Write-Host "全部通过 ✅" -ForegroundColor Green
exit 0
