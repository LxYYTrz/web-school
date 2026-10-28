# 辅助诊断入口，按脚本中的目标检查产线链路与服务状态。
# 先看参数和每项请求，再看输出汇总；它属于 scripts/test，不是正式采集或后端启动入口。
# 诊断结果只覆盖相应检查条件，不能替代真实现场动作和安全状态确认。

<#
    verify-line.ps1 —— line-twin 全链路只读体检(工控机侧)

    检查项(全部只读,不下发任何控制指令):
      1. 本机服务端口(MQTT 1883、Redis 6379、PostgreSQL 5432)
      2. SSH 隧道进程(云端 -R 127.0.0.1:3300)
      3. 本地后端 http://localhost:3000/api/lines/line-01/snapshot
      4. 云端公网 http://<云IP>:8081/api/lines/line-01/snapshot
      5. 从后端快照确认 PLC 数据持续更新(不与采集器争抢 Modbus 连接)

    用法:
        .\scripts\test\verify-line.ps1
        .\scripts\test\verify-line.ps1 -CloudHost 119.91.145.27 -CloudPort 8081
    退出码:0=全部通过;1=有 FAIL
#>
[CmdletBinding()]
param(
    [string]$CloudHost = '119.91.145.27',
    [int]$CloudPort = 8081,
    [switch]$SkipPlc
)

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$results = New-Object System.Collections.ArrayList

# 把单项诊断名称、布尔结果与细节收进结果列表，供最后统一输出。
function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
# 定义 PowerShell 函数 Add-Result。
    [void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })
}

function Test-Port([int]$Port) {
# 定义 PowerShell 函数 Test-Port。
    $c = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
        return $ok
    } catch { return $false } finally { $c.Close() }
}

# 为当前检查请求指定 URL，并把成功响应解析成对象，超时或失败按函数分支处理。
# 这是诊断请求封装；结果只代表该接口此次响应，不直接证明整条现场链路。
function Get-Json([string]$Url, [int]$TimeoutSec = 8) {
# 定义 PowerShell 函数 Get-Json。
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

# 1. 本机服务
Add-Result 'MQTT 1883' (Test-Port 1883) '消息代理'
Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'
Add-Result 'PostgreSQL 5432' (Test-Port 5432) '历史与业务数据'

# 2. SSH 隧道
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })

# 3. 本地后端
$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'
Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"
if ($local.ok) {
    try {
        $j = $local.body | ConvertFrom-Json
        if ($j.error) {
            Add-Result '快照状态' $false "后端读取 Redis 失败: $($j.error)"
        } elseif (-not $SkipPlc) {
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            $statusFresh = $j.status -and $j.status.ts -and (($nowMs - [int64]$j.status.ts) -le 15000)
            # 给变量 $statusFresh 赋值。
            $robotFresh = @($j.robots.PSObject.Properties | Where-Object {
            # 给变量 $robotFresh 赋值。
                $_.Value -and $_.Value.ts -and (($nowMs - [int64]$_.Value.ts) -le 15000)
            }).Count -gt 0
            $ok = $statusFresh -and $robotFresh -and ($j.edge.status -eq 'online')
            Add-Result 'PLC 采集数据' $ok "state=$($j.status.state) edge=$($j.edge.status) statusTs=$($j.status.ts) robotFresh=$robotFresh"
        }
    } catch { Add-Result '快照解析' $false $_.Exception.Message }
}

# 4. 公网
$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"
Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"

Write-Host ""
$results | Format-Table -AutoSize | Out-String | Write-Host
$failed = @($results | Where-Object { $_.结果 -eq 'FAIL' })
# 给变量 $failed 赋值。
if ($failed.Count -gt 0) {
    Write-Host "有 $($failed.Count) 项 FAIL —— 对照 CLAUDE.md §4.5 排查表" -ForegroundColor Red
    exit 1
}
Write-Host "全部通过 ✅" -ForegroundColor Green
exit 0
