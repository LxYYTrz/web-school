# scripts/verify-line.ps1 逐行说明

[打开源码](../../../scripts/verify-line.ps1) · 95 行 · 66 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 16 | <code>[CmdletBinding()]</code> | 执行 PowerShell 命令或补全参数。 |
| 17 | <code>param(</code> | 控制执行流程或声明脚本参数。 |
| 18 | <code>[string]$CloudHost = '119.91.145.27',</code> | 执行 PowerShell 命令或补全参数。 |
| 19 | <code>[int]$CloudPort = 8081,</code> | 执行 PowerShell 命令或补全参数。 |
| 20 | <code>[switch]$SkipPlc</code> | 执行 PowerShell 命令或补全参数。 |
| 21 | <code>)</code> | 执行 PowerShell 命令或补全参数。 |
| 23 | <code>$ErrorActionPreference = 'Continue'</code> | 给变量 `$ErrorActionPreference` 赋值。 |
| 24 | <code>try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }</code> | 控制执行流程或声明脚本参数。 |
| 25 | <code>$results = New-Object System.Collections.ArrayList</code> | 给变量 `$results` 赋值。 |
| 27 | <code>function Add-Result([string]$Name, [bool]$Ok, [string]$Detail) {</code> | 定义 PowerShell 函数 `Add-Result`。 |
| 28 | <code>[void]$results.Add([pscustomobject]@{ 检查项 = $Name; 结果 = $(if ($Ok) { 'OK' } else { 'FAIL' }); 说明 = $Detail })</code> | 执行 PowerShell 命令或补全参数。 |
| 29 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 31 | <code>function Test-Port([int]$Port) {</code> | 定义 PowerShell 函数 `Test-Port`。 |
| 32 | <code>$c = New-Object System.Net.Sockets.TcpClient</code> | 给变量 `$c` 赋值。 |
| 33 | <code>try {</code> | 控制执行流程或声明脚本参数。 |
| 34 | <code>$iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)</code> | 给变量 `$iar` 赋值。 |
| 35 | <code>$ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected</code> | 给变量 `$ok` 赋值。 |
| 36 | <code>return $ok</code> | 执行 PowerShell 命令或补全参数。 |
| 37 | <code>} catch { return $false } finally { $c.Close() }</code> | 执行 PowerShell 命令或补全参数。 |
| 38 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 40 | <code>function Get-Json([string]$Url, [int]$TimeoutSec = 8) {</code> | 定义 PowerShell 函数 `Get-Json`。 |
| 41 | <code>try {</code> | 控制执行流程或声明脚本参数。 |
| 42 | <code>$r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec</code> | 给变量 `$r` 赋值。 |
| 43 | <code>return @{ ok = ($r.StatusCode -eq 200); body = $r.Content; code = $r.StatusCode }</code> | 执行 PowerShell 命令或补全参数。 |
| 44 | <code>} catch {</code> | 执行 PowerShell 命令或补全参数。 |
| 45 | <code>$code = 0</code> | 给变量 `$code` 赋值。 |
| 46 | <code>if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }</code> | 控制执行流程或声明脚本参数。 |
| 47 | <code>return @{ ok = $false; body = $_.Exception.Message; code = $code }</code> | 执行 PowerShell 命令或补全参数。 |
| 48 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 49 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 51 | <code>Write-Host "=== line-twin 全链路体检 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan</code> | 执行 PowerShell 命令或补全参数。 |
| 54 | <code>Add-Result 'MQTT 1883' (Test-Port 1883) '消息代理'</code> | 执行 PowerShell 命令或补全参数。 |
| 55 | <code>Add-Result 'Redis 6379' (Test-Port 6379) '快照存储'</code> | 执行 PowerShell 命令或补全参数。 |
| 56 | <code>Add-Result 'PostgreSQL 5432' (Test-Port 5432) '历史与业务数据'</code> | 执行 PowerShell 命令或补全参数。 |
| 59 | <code>$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue &#124;</code> | 给变量 `$sshProc` 赋值。 |
| 60 | <code>Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }</code> | 执行 PowerShell 命令或补全参数。 |
| 61 | <code>Add-Result 'SSH 反向隧道进程' ([bool]$sshProc) $(if ($sshProc) { "pid=$($sshProc.ProcessId -join ',')" } else { '没在跑 —— 公网 API 必然 502' })</code> | 执行 PowerShell 命令或补全参数。 |
| 64 | <code>$local = Get-Json 'http://localhost:3000/api/lines/line-01/snapshot'</code> | 给变量 `$local` 赋值。 |
| 65 | <code>Add-Result '本地后端 /api' $local.ok "HTTP $($local.code)"</code> | 执行 PowerShell 命令或补全参数。 |
| 66 | <code>if ($local.ok) {</code> | 控制执行流程或声明脚本参数。 |
| 67 | <code>try {</code> | 控制执行流程或声明脚本参数。 |
| 68 | <code>$j = $local.body &#124; ConvertFrom-Json</code> | 给变量 `$j` 赋值。 |
| 69 | <code>if ($j.error) {</code> | 控制执行流程或声明脚本参数。 |
| 70 | <code>Add-Result '快照状态' $false "后端读取 Redis 失败: $($j.error)"</code> | 执行 PowerShell 命令或补全参数。 |
| 71 | <code>} elseif (-not $SkipPlc) {</code> | 执行 PowerShell 命令或补全参数。 |
| 72 | <code>$nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()</code> | 给变量 `$nowMs` 赋值。 |
| 73 | <code>$statusFresh = $j.status -and $j.status.ts -and (($nowMs - [int64]$j.status.ts) -le 15000)</code> | 给变量 `$statusFresh` 赋值。 |
| 74 | <code>$robotFresh = @($j.robots.PSObject.Properties &#124; Where-Object {</code> | 给变量 `$robotFresh` 赋值。 |
| 75 | <code>$_.Value -and $_.Value.ts -and (($nowMs - [int64]$_.Value.ts) -le 15000)</code> | 执行 PowerShell 命令或补全参数。 |
| 76 | <code>}).Count -gt 0</code> | 执行 PowerShell 命令或补全参数。 |
| 77 | <code>$ok = $statusFresh -and $robotFresh -and ($j.edge.status -eq 'online')</code> | 给变量 `$ok` 赋值。 |
| 78 | <code>Add-Result 'PLC 采集数据' $ok "state=$($j.status.state) edge=$($j.edge.status) statusTs=$($j.status.ts) robotFresh=$robotFresh"</code> | 执行 PowerShell 命令或补全参数。 |
| 79 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 80 | <code>} catch { Add-Result '快照解析' $false $_.Exception.Message }</code> | 执行 PowerShell 命令或补全参数。 |
| 81 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 84 | <code>$cloud = Get-Json "http://${CloudHost}:${CloudPort}/api/lines/line-01/snapshot"</code> | 给变量 `$cloud` 赋值。 |
| 85 | <code>Add-Result '公网 API' $cloud.ok "HTTP $($cloud.code) $(if (-not $cloud.ok) { '(502 = 隧道断)' } else { '' })"</code> | 执行 PowerShell 命令或补全参数。 |
| 87 | <code>Write-Host ""</code> | 执行 PowerShell 命令或补全参数。 |
| 88 | <code>$results &#124; Format-Table -AutoSize &#124; Out-String &#124; Write-Host</code> | 执行 PowerShell 命令或补全参数。 |
| 89 | <code>$failed = @($results &#124; Where-Object { $_.结果 -eq 'FAIL' })</code> | 给变量 `$failed` 赋值。 |
| 90 | <code>if ($failed.Count -gt 0) {</code> | 控制执行流程或声明脚本参数。 |
| 91 | <code>Write-Host "有 $($failed.Count) 项 FAIL —— 对照 CLAUDE.md §4.5 排查表" -ForegroundColor Red</code> | 执行 PowerShell 命令或补全参数。 |
| 92 | <code>exit 1</code> | 执行 PowerShell 命令或补全参数。 |
| 93 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 94 | <code>Write-Host "全部通过 ✅" -ForegroundColor Green</code> | 执行 PowerShell 命令或补全参数。 |
| 95 | <code>exit 0</code> | 执行 PowerShell 命令或补全参数。 |
