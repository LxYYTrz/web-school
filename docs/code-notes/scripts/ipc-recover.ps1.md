# scripts/ipc-recover.ps1 逐行说明

[打开源码](../../../scripts/ipc-recover.ps1) · 128 行 · 98 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 18 | <code>[CmdletBinding()]</code> | 执行 PowerShell 命令或补全参数。 |
| 19 | <code>param(</code> | 控制执行流程或声明脚本参数。 |
| 20 | <code>[string]$CloudHost = '119.91.145.27',</code> | 执行 PowerShell 命令或补全参数。 |
| 21 | <code>[string]$CloudUser = 'root',</code> | 执行 PowerShell 命令或补全参数。 |
| 22 | <code>[string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',</code> | 执行 PowerShell 命令或补全参数。 |
| 23 | <code>[switch]$SkipBuild</code> | 执行 PowerShell 命令或补全参数。 |
| 24 | <code>)</code> | 执行 PowerShell 命令或补全参数。 |
| 26 | <code>$ErrorActionPreference = 'Continue'</code> | 给变量 `$ErrorActionPreference` 赋值。 |
| 27 | <code>try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }</code> | 控制执行流程或声明脚本参数。 |
| 28 | <code>$root = Split-Path -Parent $PSCommandPath</code> | 给变量 `$root` 赋值。 |
| 29 | <code>$root = Split-Path -Parent $root</code> | 给变量 `$root` 赋值。 |
| 30 | <code>$logDir = Join-Path $root 'logs'</code> | 给变量 `$logDir` 赋值。 |
| 31 | <code>if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir &#124; Out-Null }</code> | 控制执行流程或声明脚本参数。 |
| 33 | <code>function Write-Step([string]$Msg) { Write-Host "==&gt; $Msg" -ForegroundColor Cyan }</code> | 定义 PowerShell 函数 `Write-Step`。 |
| 34 | <code>function Test-Port([int]$Port) {</code> | 定义 PowerShell 函数 `Test-Port`。 |
| 35 | <code>$c = New-Object System.Net.Sockets.TcpClient</code> | 给变量 `$c` 赋值。 |
| 36 | <code>try {</code> | 控制执行流程或声明脚本参数。 |
| 37 | <code>$iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)</code> | 给变量 `$iar` 赋值。 |
| 38 | <code>return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)</code> | 执行 PowerShell 命令或补全参数。 |
| 39 | <code>} catch { return $false } finally { $c.Close() }</code> | 执行 PowerShell 命令或补全参数。 |
| 40 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 43 | <code>Write-Step '检查本机 MQTT / Redis / PostgreSQL'</code> | 执行 PowerShell 命令或补全参数。 |
| 44 | <code>$ports = @(1883, 6379, 5432)</code> | 给变量 `$ports` 赋值。 |
| 45 | <code>foreach ($port in $ports) {</code> | 控制执行流程或声明脚本参数。 |
| 46 | <code>if (-not (Test-Port $port)) {</code> | 控制执行流程或声明脚本参数。 |
| 47 | <code>Write-Host "[FAIL] 本机端口 $port 未就绪,请检查对应的 Windows 服务" -ForegroundColor Red</code> | 执行 PowerShell 命令或补全参数。 |
| 48 | <code>exit 1</code> | 执行 PowerShell 命令或补全参数。 |
| 49 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 50 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 53 | <code>Write-Step '确保 SSH 反向隧道在线'</code> | 执行 PowerShell 命令或补全参数。 |
| 54 | <code>$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue &#124;</code> | 给变量 `$sshProc` 赋值。 |
| 55 | <code>Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }</code> | 执行 PowerShell 命令或补全参数。 |
| 56 | <code>if ($sshProc) {</code> | 控制执行流程或声明脚本参数。 |
| 57 | <code>Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"</code> | 执行 PowerShell 命令或补全参数。 |
| 58 | <code>} else {</code> | 执行 PowerShell 命令或补全参数。 |
| 59 | <code>$keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'</code> | 给变量 `$keepAlive` 赋值。 |
| 60 | <code>$kArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive,</code> | 给变量 `$kArgs` 赋值。 |
| 61 | <code>'-CloudHost', $CloudHost, '-CloudUser', $CloudUser, '-KeyPath', $KeyPath, '-Once')</code> | 执行 PowerShell 命令或补全参数。 |
| 62 | <code>&amp; powershell @kArgs</code> | 执行 PowerShell 命令或补全参数。 |
| 63 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 66 | <code>if (Test-Port 3000) {</code> | 控制执行流程或声明脚本参数。 |
| 67 | <code>Write-Step '后端已在跑 (3000)'</code> | 执行 PowerShell 命令或补全参数。 |
| 68 | <code>} else {</code> | 执行 PowerShell 命令或补全参数。 |
| 69 | <code>Write-Step '启动后端 node dist\main.js'</code> | 执行 PowerShell 命令或补全参数。 |
| 70 | <code>$main = Join-Path $root 'server\dist\main.js'</code> | 给变量 `$main` 赋值。 |
| 71 | <code>if (-not (Test-Path $main)) {</code> | 控制执行流程或声明脚本参数。 |
| 72 | <code>if ($SkipBuild) {</code> | 控制执行流程或声明脚本参数。 |
| 73 | <code>Write-Host '[FAIL] server\dist\main.js 不存在(且 -SkipBuild 已指定)' -ForegroundColor Red</code> | 执行 PowerShell 命令或补全参数。 |
| 74 | <code>} else {</code> | 执行 PowerShell 命令或补全参数。 |
| 75 | <code>Write-Host 'dist 缺失,先 npm run build ...' -ForegroundColor Yellow</code> | 执行 PowerShell 命令或补全参数。 |
| 76 | <code>Push-Location (Join-Path $root 'server')</code> | 执行 PowerShell 命令或补全参数。 |
| 77 | <code>npm.cmd run build</code> | 执行 PowerShell 命令或补全参数。 |
| 78 | <code>Pop-Location</code> | 执行 PowerShell 命令或补全参数。 |
| 79 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 80 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 81 | <code>if (Test-Path $main) {</code> | 控制执行流程或声明脚本参数。 |
| 82 | <code>Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `</code> | 执行 PowerShell 命令或补全参数。 |
| 83 | <code>-WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `</code> | 执行 PowerShell 命令或补全参数。 |
| 84 | <code>-RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `</code> | 执行 PowerShell 命令或补全参数。 |
| 85 | <code>-RedirectStandardError (Join-Path $logDir 'backend.err.log') &#124; Out-Null</code> | 执行 PowerShell 命令或补全参数。 |
| 86 | <code>for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }</code> | 执行 PowerShell 命令或补全参数。 |
| 87 | <code>Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))</code> | 执行 PowerShell 命令或补全参数。 |
| 88 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 89 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 92 | <code>$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue &#124;</code> | 给变量 `$collector` 赋值。 |
| 93 | <code>Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }</code> | 执行 PowerShell 命令或补全参数。 |
| 94 | <code>if ($collector) {</code> | 控制执行流程或声明脚本参数。 |
| 95 | <code>Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"</code> | 执行 PowerShell 命令或补全参数。 |
| 96 | <code>} else {</code> | 执行 PowerShell 命令或补全参数。 |
| 97 | <code>Write-Step '启动 PLC 采集器'</code> | 执行 PowerShell 命令或补全参数。 |
| 99 | <code>$py = $null</code> | 给变量 `$py` 赋值。 |
| 100 | <code>$launcher = Get-Command py.exe -ErrorAction SilentlyContinue</code> | 给变量 `$launcher` 赋值。 |
| 101 | <code>if ($launcher) {</code> | 控制执行流程或声明脚本参数。 |
| 102 | <code>$candidate = &amp; $launcher.Source -3 -c 'import sys; assert sys.version_info &gt;= (3, 11); print(sys.executable)' 2&gt;$null</code> | 给变量 `$candidate` 赋值。 |
| 103 | <code>if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }</code> | 控制执行流程或声明脚本参数。 |
| 104 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 105 | <code>if (-not $py) {</code> | 控制执行流程或声明脚本参数。 |
| 106 | <code>$candidate = (Get-Command python.exe -ErrorAction SilentlyContinue).Source</code> | 给变量 `$candidate` 赋值。 |
| 107 | <code>if ($candidate) {</code> | 控制执行流程或声明脚本参数。 |
| 108 | <code>$supported = &amp; $candidate -c 'import sys; print(sys.version_info &gt;= (3, 11))' 2&gt;$null</code> | 给变量 `$supported` 赋值。 |
| 109 | <code>if ($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }</code> | 控制执行流程或声明脚本参数。 |
| 110 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 111 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 112 | <code>if ($py) {</code> | 控制执行流程或声明脚本参数。 |
| 113 | <code>Start-Process -FilePath $py -ArgumentList 'plc_collector.py' `</code> | 执行 PowerShell 命令或补全参数。 |
| 114 | <code>-WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `</code> | 执行 PowerShell 命令或补全参数。 |
| 115 | <code>-RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `</code> | 执行 PowerShell 命令或补全参数。 |
| 116 | <code>-RedirectStandardError (Join-Path $logDir 'collector.err.log') &#124; Out-Null</code> | 执行 PowerShell 命令或补全参数。 |
| 117 | <code>Start-Sleep -Seconds 5</code> | 执行 PowerShell 命令或补全参数。 |
| 118 | <code>Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" &#124;</code> | 执行 PowerShell 命令或补全参数。 |
| 119 | <code>Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)</code> | 执行 PowerShell 命令或补全参数。 |
| 120 | <code>} else {</code> | 执行 PowerShell 命令或补全参数。 |
| 121 | <code>Write-Host '[FAIL] 没找到 Python 3.11+,采集器起不来' -ForegroundColor Red</code> | 执行 PowerShell 命令或补全参数。 |
| 122 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 123 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 126 | <code>Write-Step '体检'</code> | 执行 PowerShell 命令或补全参数。 |
| 127 | <code>&amp; (Join-Path $root 'scripts\verify-line.ps1') -CloudHost $CloudHost</code> | 执行 PowerShell 命令或补全参数。 |
| 128 | <code>exit $LASTEXITCODE</code> | 执行 PowerShell 命令或补全参数。 |
