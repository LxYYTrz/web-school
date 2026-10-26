<#
    verify-line.ps1 —— line-twin 全链路只读体检(工控机侧)
    # 调用 全链路只读体检，把括号中的值作为参数传入。

    检查项(全部只读,不下发任何控制指令):
    # 调用 检查项，把括号中的值作为参数传入。
      1. 本机服务端口(MQTT 1883、Redis 6379、PostgreSQL 5432)
      # 调用 本机服务端口，把括号中的值作为参数传入。
      2. SSH 隧道进程(云端 -R 127.0.0.1:3300)
      # 调用 隧道进程，把括号中的值作为参数传入。
      3. 本地后端 http://localhost:3000/api/lines/line-01/snapshot
      # 继续当前表达式；这一行的值由外层代码块或调用使用。
      4. 云端公网 http://<云IP>:8081/api/lines/line-01/snapshot
      # 继续当前表达式；这一行的值由外层代码块或调用使用。
      5. 从后端快照确认 PLC 数据持续更新(不与采集器争抢 Modbus 连接)
      # 调用 数据持续更新，把括号中的值作为参数传入。

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\verify-line.ps1
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\verify-line.ps1 -CloudHost 119.91.145.27 -CloudPort 8081
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
    退出码:0=全部通过;1=有 FAIL
    # 设置字段 退出码，值为 0=全部通过;1=有 FAIL。
#>
[CmdletBinding()]
# 调用 [CmdletBinding()]，按照本行参数处理或检查对应资源。
param(
# 开始声明该脚本的输入参数；param 是 PowerShell 参数块。
    [string]$CloudHost = '119.91.145.27',
    # 声明参数 $CloudHost，类型为 string，等号右边是默认值（若有）。
    [int]$CloudPort = 8081,
    # 声明参数 $CloudPort，类型为 int，等号右边是默认值（若有）。
    [switch]$SkipPlc
    # 声明参数 $SkipPlc，类型为 switch，等号右边是默认值（若有）。
)
# 结束当前参数列表或脚本代码块。

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 开始可能失败的操作块；try 表示尝试执行。
$results = New-Object System.Collections.ArrayList
# 给变量 $results 赋值。

function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
# 定义 PowerShell 函数 Add-Result。 关键字：function＝定义函数。
    [void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })
    # 声明参数 $results，类型为 void，等号右边是默认值（若有）。
}
# 结束当前参数列表或脚本代码块。

function Test-Port([int]$Port) {
# 定义 PowerShell 函数 Test-Port。 关键字：function＝定义函数。
    $c = New-Object System.Net.Sockets.TcpClient
    # 给变量 $c 赋值。
    try {
    # 开始可能失败的操作块；try 表示尝试执行。
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        # 给变量 $iar 赋值。 关键字：null＝空值。
        $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
        # 给变量 $ok 赋值。 关键字：false＝布尔假值。
        return $ok
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    } catch { return $false } finally { $c.Close() }
    # 结束 try 块并捕获执行异常；catch 表示处理异常。
}
# 结束当前参数列表或脚本代码块。

function Get-Json([string]$Url, [int]$TimeoutSec = 8) {
# 定义 PowerShell 函数 Get-Json。 关键字：function＝定义函数。
    try {
    # 开始可能失败的操作块；try 表示尝试执行。
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        # 给变量 $r 赋值。
        return @{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    } catch {
    # 结束 try 块并捕获执行异常；catch 表示处理异常。
        $code = 0
        # 给变量 $code 赋值。
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        return @{ ok = $false; body = $_.Exception.Message; code = $code }
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    }
    # 结束当前参数列表或脚本代码块。
}
# 结束当前参数列表或脚本代码块。

Write-Host "=== line-twin 全链路体检 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan
# 用 Write-Host 把本行的状态消息输出到终端。

# 1. 本机服务
Add-Result 'MQTT 1883' (Test-Port 1883) '消息代理'
# 调用 Add-Result，按照本行参数处理或检查对应资源。
Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'
# 调用 Add-Result，按照本行参数处理或检查对应资源。
Add-Result 'PostgreSQL 5432' (Test-Port 5432) '历史与业务数据'
# 调用 Add-Result，按照本行参数处理或检查对应资源。

# 2. SSH 隧道
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
    # 用 Where-Object 过滤管道对象，只保留满足花括号条件的项目。
Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })
# 调用 Add-Result，按照本行参数处理或检查对应资源。

# 3. 本地后端
$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'
# 给变量 $local 赋值。
Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"
# 调用 Add-Result，按照本行参数处理或检查对应资源。
if ($local.ok) {
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
    try {
    # 开始可能失败的操作块；try 表示尝试执行。
        $j = $local.body | ConvertFrom-Json
        # 给变量 $j 赋值。
        if ($j.error) {
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
            Add-Result '快照状态' $false "后端读取 Redis 失败: $($j.error)"
            # 调用 Add-Result，按照本行参数处理或检查对应资源。
        } elseif (-not $SkipPlc) {
        # 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            # 给变量 $nowMs 赋值。
            $statusFresh = $j.status -and $j.status.ts -and (($nowMs - [int64]$j.status.ts) -le 15000)
            # 给变量 $statusFresh 赋值。
            $robotFresh = @($j.robots.PSObject.Properties | Where-Object {
            # 给变量 $robotFresh 赋值。
                $_.Value -and $_.Value.ts -and (($nowMs - [int64]$_.Value.ts) -le 15000)
                # 调用 $_.Value，按照本行参数处理或检查对应资源。
            }).Count -gt 0
            # 调用 }).Count，按照本行参数处理或检查对应资源。
            $ok = $statusFresh -and $robotFresh -and ($j.edge.status -eq 'online')
            # 给变量 $ok 赋值。
            Add-Result 'PLC 采集数据' $ok "state=$($j.status.state) edge=$($j.edge.status) statusTs=$($j.status.ts) robotFresh=$robotFresh"
            # 调用 Add-Result，按照本行参数处理或检查对应资源。
        }
        # 结束当前参数列表或脚本代码块。
    } catch { Add-Result '快照解析' $false $_.Exception.Message }
    # 结束 try 块并捕获执行异常；catch 表示处理异常。
}
# 结束当前参数列表或脚本代码块。

# 4. 公网
$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"
# 给变量 $cloud 赋值。
Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"
# 调用 Add-Result，按照本行参数处理或检查对应资源。

Write-Host ""
# 用 Write-Host 把本行的状态消息输出到终端。
$results | Format-Table -AutoSize | Out-String | Write-Host
# 调用 $results，按照本行参数处理或检查对应资源。
$failed = @($results | Where-Object { $_.结果 -eq 'FAIL' })
# 给变量 $failed 赋值。
if ($failed.Count -gt 0) {
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Write-Host "有 $($failed.Count) 项 FAIL —— 对照 CLAUDE.md §4.5 排查表" -ForegroundColor Red
    # 用 Write-Host 把本行的状态消息输出到终端。
    exit 1
    # 用指定退出码结束脚本；exit 表示退出。
}
# 结束当前参数列表或脚本代码块。
Write-Host "全部通过 ✅" -ForegroundColor Green
# 用 Write-Host 把本行的状态消息输出到终端。
exit 0
# 用指定退出码结束脚本；exit 表示退出。
