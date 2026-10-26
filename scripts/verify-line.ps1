<#
    # 这一段负责通过只读请求检查本机服务、后端快照和云端访问链路，为后续代码提供当前文件的处理入口。
    verify-line.ps1 —— line-twin 全链路只读体检(工控机侧)
    # 调用 全链路只读体检，把括号中的值作为参数传入，供当前处理流程继续使用。
    # verify-line 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    检查项(全部只读,不下发任何控制指令):
    # 调用 检查项，把括号中的值作为参数传入，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
      1. 本机服务端口(MQTT 1883、Redis 6379、PostgreSQL 5432)
      # 调用 本机服务端口，把括号中的值作为参数传入，供当前处理流程继续使用。
      # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
      2. SSH 隧道进程(云端 -R 127.0.0.1:3300)
      # 调用 隧道进程，把括号中的值作为参数传入，供当前处理流程继续使用。
      # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
      3. 本地后端 http://localhost:3000/api/lines/line-01/snapshot
      # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
      4. 云端公网 http://<云IP>:8081/api/lines/line-01/snapshot
      # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
      # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
      5. 从后端快照确认 PLC 数据持续更新(不与采集器争抢 Modbus 连接)
      # 调用 数据持续更新，把括号中的值作为参数传入，供当前处理流程继续使用。
      # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        .\scripts\verify-line.ps1
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # verify-line 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        .\scripts\verify-line.ps1 -CloudHost 119.91.145.27 -CloudPort 8081
        # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
        # verify-line 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    退出码:0=全部通过;1=有 FAIL
    # 设置字段 退出码，值为 0=全部通过;1=有 FAIL，供当前处理流程继续使用。
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
    [int]$CloudPort = 8081,
    # 根据 8081, 设置 [int]$CloudPort，供当前流程后续使用。
    # $CloudPort 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [switch]$SkipPlc
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $SkipPlc 是本脚本或当前函数前面定义的配置、命令结果或路径值
)
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 开始执行可能失败的操作，错误由后续异常分支处理。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
$results = New-Object System.Collections.ArrayList
# 给变量 $results 赋值。
# $results 是本脚本或当前函数前面定义的配置、命令结果或路径值；New-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {
# 定义 PowerShell 函数 Add-Result。
# $Name 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Ok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Detail 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    [void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })
    # 执行 Add 对应的本地处理，使用本行提供的数据。
    # $results 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Name 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Ok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Detail 是本脚本或当前函数前面定义的配置、命令结果或路径值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

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
        $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
        # 执行 WaitOne 对应的本地处理，使用本行提供的数据，将结果保存或写入 $ok。
        # $ok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$iar 是本脚本或当前函数前面定义的配置、命令结果或路径值；$false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$c 是本脚本或当前函数前面定义的配置、命令结果或路径值
        return $ok
        # 把$ok作为当前函数的结果返回。
        # $ok 是本脚本或当前函数前面定义的配置、命令结果或路径值
    } catch { return $false } finally { $c.Close() }
    # 接收并处理上一段操作产生的异常。
    # $false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$c 是本脚本或当前函数前面定义的配置、命令结果或路径值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

function Get-Json([string]$Url, [int]$TimeoutSec = 8) {
# 定义 PowerShell 函数 Get-Json。
# $Url 是本脚本或当前函数前面定义的配置、命令结果或路径值；$TimeoutSec 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Json 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    try {
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        # 根据 Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec 设置 $r，供当前流程后续使用。
        # $r 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Url 是本脚本或当前函数前面定义的配置、命令结果或路径值；$TimeoutSec 是本脚本或当前函数前面定义的配置、命令结果或路径值；Invoke-WebRequest 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        return @{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }
        # 把@{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }作为当前函数的结果返回。
        # $r 是本脚本或当前函数前面定义的配置、命令结果或路径值
    } catch {
    # 接收并处理上一段操作产生的异常。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        $code = 0
        # 根据 0 设置 $code，供当前流程后续使用。
        # $code 是本脚本或当前函数前面定义的配置、命令结果或路径值
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        # 检查($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }，按判断结果进入对应的处理分支。
        # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；$code 是本脚本或当前函数前面定义的配置、命令结果或路径值
        return @{ ok = $false; body = $_.Exception.Message; code = $code }
        # 把@{ ok = $false; body = $_.Exception.Message; code = $code }作为当前函数的结果返回。
        # $false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；$code 是本脚本或当前函数前面定义的配置、命令结果或路径值
    }
    # 结束当前函数、分支或对象配置，返回上一层处理流程。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

Write-Host "=== line-twin 全链路体检 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

# 1. 本机服务
Add-Result 'MQTT 1883' (Test-Port 1883) '消息代理'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
Add-Result 'PostgreSQL 5432' (Test-Port 5432) '历史与业务数据'
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

# 2. SSH 隧道
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
# $sshProc 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-CimInstance 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })
# 执行 if 对应的本地处理，使用本行提供的数据。
# $sshProc 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

# 3. 本地后端
$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'
# 根据 Get-Json 'http://localhost:3000/api/lines/line-01/snapshot' 设置 $local，供当前流程后续使用。
# $local 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Json 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $local 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if ($local.ok) {
# 检查($local.ok)，按判断结果进入对应的处理分支。
# $local 是本脚本或当前函数前面定义的配置、命令结果或路径值
    try {
    # 开始执行可能失败的操作，错误由后续异常分支处理。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
        $j = $local.body | ConvertFrom-Json
        # 根据 $local.body | ConvertFrom-Json 设置 $j，供当前流程后续使用。
        # $j 是本脚本或当前函数前面定义的配置、命令结果或路径值；$local 是本脚本或当前函数前面定义的配置、命令结果或路径值；ConvertFrom-Json 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        if ($j.error) {
        # 检查($j.error)，按判断结果进入对应的处理分支。
        # $j 是本脚本或当前函数前面定义的配置、命令结果或路径值
            Add-Result '快照状态' $false "后端读取 Redis 失败: $($j.error)"
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # $false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$j 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        } elseif (-not $SkipPlc) {
        # 结束当前函数、分支或对象配置，返回上一层处理流程。
        # $SkipPlc 是本脚本或当前函数前面定义的配置、命令结果或路径值
            $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
            # 执行 ToUnixTimeMilliseconds 对应的本地处理，使用本行提供的数据，将结果保存或写入 $nowMs。
            # $nowMs 是本脚本或当前函数前面定义的配置、命令结果或路径值
            $statusFresh = $j.status -and $j.status.ts -and (($nowMs - [int64]$j.status.ts) -le 15000)
            # 给变量 $statusFresh 赋值。
            # $statusFresh 是本脚本或当前函数前面定义的配置、命令结果或路径值；$j 是本脚本或当前函数前面定义的配置、命令结果或路径值；$nowMs 是本脚本或当前函数前面定义的配置、命令结果或路径值
            $robotFresh = @($j.robots.PSObject.Properties | Where-Object {
            # 给变量 $robotFresh 赋值。
            # $robotFresh 是本脚本或当前函数前面定义的配置、命令结果或路径值；$j 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
                $_.Value -and $_.Value.ts -and (($nowMs - [int64]$_.Value.ts) -le 15000)
                # 执行 and 对应的本地处理，使用本行提供的数据。
                # $_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；$nowMs 是本脚本或当前函数前面定义的配置、命令结果或路径值
            }).Count -gt 0
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
            $ok = $statusFresh -and $robotFresh -and ($j.edge.status -eq 'online')
            # 执行 and 对应的本地处理，使用本行提供的数据，将结果保存或写入 $ok。
            # $ok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$statusFresh 是本脚本或当前函数前面定义的配置、命令结果或路径值；$robotFresh 是本脚本或当前函数前面定义的配置、命令结果或路径值；$j 是本脚本或当前函数前面定义的配置、命令结果或路径值
            Add-Result 'PLC 采集数据' $ok "state=$($j.status.state) edge=$($j.edge.status) statusTs=$($j.status.ts) robotFresh=$robotFresh"
            # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
            # $ok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$j 是本脚本或当前函数前面定义的配置、命令结果或路径值；$robotFresh 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
        }
        # 结束当前函数、分支或对象配置，返回上一层处理流程。
        # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    } catch { Add-Result '快照解析' $false $_.Exception.Message }
    # 接收并处理上一段操作产生的异常。
    # $false 是本脚本或当前函数前面定义的配置、命令结果或路径值；$_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

# 4. 公网
$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"
# 根据 Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot" 设置 $cloud，供当前流程后续使用。
# $cloud 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Json 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $cloud 是本脚本或当前函数前面定义的配置、命令结果或路径值；Add-Result 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

Write-Host ""
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$results | Format-Table -AutoSize | Out-String | Write-Host
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $results 是本脚本或当前函数前面定义的配置、命令结果或路径值；Format-Table 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$failed = @($results | Where-Object { $_.结果 -eq 'FAIL' })
# 给变量 $failed 赋值。
# $failed 是本脚本或当前函数前面定义的配置、命令结果或路径值；$results 是本脚本或当前函数前面定义的配置、命令结果或路径值；$_ 是本脚本或当前函数前面定义的配置、命令结果或路径值；Where-Object 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
if ($failed.Count -gt 0) {
# 检查($failed.Count -gt 0)，按判断结果进入对应的处理分支。
# $failed 是本脚本或当前函数前面定义的配置、命令结果或路径值
    Write-Host "有 $($failed.Count) 项 FAIL —— 对照 CLAUDE.md §4.5 排查表" -ForegroundColor Red
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $failed 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    exit 1
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
Write-Host "全部通过 ✅" -ForegroundColor Green
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
exit 0
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
# 这一段提供了通过只读请求检查本机服务、后端快照和云端访问链路所需的定义和处理逻辑，结果交由调用方或运行环境使用。
