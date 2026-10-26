<#
    ipc-recover.ps1 —— 工控机侧一键恢复(幂等)
    # 调用 工控机侧一键恢复，把括号中的值作为参数传入。

    背景:2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起,
    # 设置字段 背景，值为 2026-10-23 工控机重启后,中间件/后端/采集器/隧道全部没自动拉起。
          公网站点实时数据全断(云端 nginx 502 connect() failed 111)。
          # 调用 公网站点实时数据全断，把括号中的值作为参数传入。

    本脚本按依赖顺序拉起并自检(全部幂等,已在跑的不会重复起):
    # 调用 本脚本按依赖顺序拉起并自检，把括号中的值作为参数传入。
        1. 检查本机 MQTT、Redis、PostgreSQL 服务端口
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        2. SSH 反向隧道(云端 -R 127.0.0.1:3300)
        # 调用 反向隧道，把括号中的值作为参数传入。
        3. NestJS 后端(node dist\main.js)
        # 调用 后端，把括号中的值作为参数传入。
        4. PLC 采集器(python edge/plc_collector.py)
        # 调用 采集器，把括号中的值作为参数传入。
        5. 调 scripts\verify-line.ps1 自检
        # 继续当前表达式；这一行的值由外层代码块或调用使用。

    用法:
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\ipc-recover.ps1
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
        .\scripts\ipc-recover.ps1 -CloudUser linetwin -KeyPath "$env:USERPROFILE\.ssh\id_ed25519"
        # 继续当前表达式；这一行的值由外层代码块或调用使用。
#>
[CmdletBinding()]
# 调用 [CmdletBinding()]，按照本行参数处理或检查对应资源。
param(
# 开始声明该脚本的输入参数；param 是 PowerShell 参数块。
    [string]$CloudHost = '119.91.145.27',
    # 声明参数 $CloudHost，类型为 string，等号右边是默认值（若有）。
    [string]$CloudUser = 'root',
    # 声明参数 $CloudUser，类型为 string，等号右边是默认值（若有）。
    [string]$KeyPath = 'C:\ProgramData\line-twin\tunnel_ed25519',
    # 声明参数 $KeyPath，类型为 string，等号右边是默认值（若有）。
    [switch]$SkipBuild
    # 声明参数 $SkipBuild，类型为 switch，等号右边是默认值（若有）。
)
# 结束当前参数列表或脚本代码块。

$ErrorActionPreference = 'Continue'
# 给变量 $ErrorActionPreference 赋值。
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
# 开始可能失败的操作块；try 表示尝试执行。
$root = Split-Path -Parent $PSCommandPath
# 给变量 $root 赋值。
$root = Split-Path -Parent $root
# 给变量 $root 赋值。
$logDir = Join-Path $root 'logs'
# 给变量 $logDir 赋值。
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
# 用 if 检查括号内的条件；成立时执行花括号中的操作。

function Write-Step([string]$Msg) { Write-Host "==> $Msg" -ForegroundColor Cyan }
# 定义 PowerShell 函数 Write-Step。 关键字：function＝定义函数。
function Test-Port([int]$Port) {
# 定义 PowerShell 函数 Test-Port。 关键字：function＝定义函数。
    $c = New-Object System.Net.Sockets.TcpClient
    # 给变量 $c 赋值。
    try {
    # 开始可能失败的操作块；try 表示尝试执行。
        $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
        # 给变量 $iar 赋值。 关键字：null＝空值。
        return ($iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected)
        # 返回本行表达式的值并结束当前函数；return 表示返回。
    } catch { return $false } finally { $c.Close() }
    # 结束 try 块并捕获执行异常；catch 表示处理异常。
}
# 结束当前参数列表或脚本代码块。

# ---------- 1. 本机服务 ----------
Write-Step '检查本机 MQTT / Redis / PostgreSQL'
# 调用提示函数显示当前执行步骤。
$ports = @(1883, 6379, 5432)
# 给变量 $ports 赋值。
foreach ($port in $ports) {
# 用 foreach 遍历括号中的集合，每次处理一个元素。
    if (-not (Test-Port $port)) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Write-Host "[FAIL] 本机端口 $port 未就绪,请检查对应的 Windows 服务" -ForegroundColor Red
        # 用 Write-Host 把本行的状态消息输出到终端。
        exit 1
        # 用指定退出码结束脚本；exit 表示退出。
    }
    # 结束当前参数列表或脚本代码块。
}
# 结束当前参数列表或脚本代码块。

# ---------- 2. SSH 隧道(先于后端:后端经云端转发访问) ----------
Write-Step '确保 SSH 反向隧道在线'
# 调用提示函数显示当前执行步骤。
$sshProc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe'" -ErrorAction SilentlyContinue |
# 给变量 $sshProc 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*127.0.0.1:3300*' }
    # 用 Where-Object 过滤管道对象，只保留满足花括号条件的项目。
if ($sshProc) {
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Write-Host "隧道已在跑 (pid=$($sshProc.ProcessId -join ','))"
    # 用 Write-Host 把本行的状态消息输出到终端。
} else {
# 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
    $keepAlive = Join-Path $root 'scripts\tunnel-keepalive.ps1'
    # 给变量 $keepAlive 赋值。
    $kArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $keepAlive,
    # 给变量 $kArgs 赋值。
        '-CloudHost', $CloudHost, '-CloudUser', $CloudUser, '-KeyPath', $KeyPath, '-Once')
        # 调用 '-CloudHost',，按照本行参数处理或检查对应资源。
    & powershell @kArgs
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
}
# 结束当前参数列表或脚本代码块。

# ---------- 3. 后端 ----------
if (Test-Port 3000) {
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Write-Step '后端已在跑 (3000)'
    # 调用提示函数显示当前执行步骤。
} else {
# 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
    Write-Step '启动后端 node dist\main.js'
    # 调用提示函数显示当前执行步骤。
    $main = Join-Path $root 'server\dist\main.js'
    # 给变量 $main 赋值。
    if (-not (Test-Path $main)) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        if ($SkipBuild) {
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
            Write-Host '[FAIL] server\dist\main.js 不存在(且 -SkipBuild 已指定)' -ForegroundColor Red
            # 用 Write-Host 把本行的状态消息输出到终端。
        } else {
        # 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
            Write-Host 'dist 缺失,先 npm run build ...' -ForegroundColor Yellow
            # 用 Write-Host 把本行的状态消息输出到终端。
            Push-Location (Join-Path $root 'server')
            # 调用 Push-Location，按照本行参数处理或检查对应资源。
            npm.cmd run build
            # 调用 npm.cmd，按照本行参数处理或检查对应资源。
            Pop-Location
            # 调用 Pop-Location，按照本行参数处理或检查对应资源。
        }
        # 结束当前参数列表或脚本代码块。
    }
    # 结束当前参数列表或脚本代码块。
    if (Test-Path $main) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Start-Process -FilePath 'node.exe' -ArgumentList 'dist/main.js' `
            -WorkingDirectory (Join-Path $root 'server') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'backend.out.log') `
            -RedirectStandardError (Join-Path $logDir 'backend.err.log') | Out-Null
            # 向上一行的 PowerShell 命令传入 -RedirectStandardError 参数及其取值。
        for ($i = 0; $i -lt 30; $i++) { if (Test-Port 3000) { break }; Start-Sleep -Seconds 2 }
        # 调用 for，按照本行参数处理或检查对应资源。
        Write-Host ("后端 3000 = {0}" -f (Test-Port 3000))
        # 用 Write-Host 把本行的状态消息输出到终端。
    }
    # 结束当前参数列表或脚本代码块。
}
# 结束当前参数列表或脚本代码块。

# ---------- 4. 采集器 ----------
$collector = Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
# 给变量 $collector 赋值。
    Where-Object { $_.CommandLine -and $_.CommandLine -like '*plc_collector.py*' }
    # 用 Where-Object 过滤管道对象，只保留满足花括号条件的项目。
if ($collector) {
# 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Write-Step "采集器已在跑 (pid=$($collector.ProcessId -join ','))"
    # 调用提示函数显示当前执行步骤。
} else {
# 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
    Write-Step '启动 PLC 采集器'
    # 调用提示函数显示当前执行步骤。
    # 优先用 Python Launcher 选择最新 3.x；PATH 上的 python 可能仍是 3.9。
    $py = $null
    # 给变量 $py 赋值。 关键字：null＝空值。
    $launcher = Get-Command py.exe -ErrorAction SilentlyContinue
    # 给变量 $launcher 赋值。
    if ($launcher) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        $candidate = & $launcher.Source -3 -c 'import sys; assert sys.version_info >= (3, 11); print(sys.executable)' 2>$null
        # 给变量 $candidate 赋值。 关键字：null＝空值；import＝导入模块。
        if ($LASTEXITCODE -eq 0 -and $candidate) { $py = $candidate.Trim() }
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    }
    # 结束当前参数列表或脚本代码块。
    if (-not $py) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        $candidate = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        # 给变量 $candidate 赋值。
        if ($candidate) {
        # 用 if 检查括号内的条件；成立时执行花括号中的操作。
            $supported = & $candidate -c 'import sys; print(sys.version_info >= (3, 11))' 2>$null
            # 给变量 $supported 赋值。 关键字：null＝空值；import＝导入模块。
            if ($LASTEXITCODE -eq 0 -and $supported -eq 'True') { $py = $candidate }
            # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        }
        # 结束当前参数列表或脚本代码块。
    }
    # 结束当前参数列表或脚本代码块。
    if ($py) {
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
        Start-Process -FilePath $py -ArgumentList 'plc_collector.py' `
            -WorkingDirectory (Join-Path $root 'edge') -WindowStyle Hidden `
            -RedirectStandardOutput (Join-Path $logDir 'collector.out.log') `
            -RedirectStandardError (Join-Path $logDir 'collector.err.log') | Out-Null
            # 向上一行的 PowerShell 命令传入 -RedirectStandardError 参数及其取值。
        Start-Sleep -Seconds 5
        # 暂停指定时间，等待外部服务完成启动。
        Write-Host ("采集器进程数 = {0}" -f @(Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
        # 用 Write-Host 把本行的状态消息输出到终端。
            Where-Object { $_.CommandLine -like '*plc_collector.py*' }).Count)
            # 用 Where-Object 过滤管道对象，只保留满足花括号条件的项目。
    } else {
    # 结束条件成立分支，进入 else 条件不成立分支；else 表示否则。
        Write-Host '[FAIL] 没找到 Python 3.11+,采集器起不来' -ForegroundColor Red
        # 用 Write-Host 把本行的状态消息输出到终端。
    }
    # 结束当前参数列表或脚本代码块。
}
# 结束当前参数列表或脚本代码块。

# ---------- 5. 自检 ----------
Write-Step '体检'
# 调用提示函数显示当前执行步骤。
& (Join-Path $root 'scripts\verify-line.ps1') -CloudHost $CloudHost
# 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
exit $LASTEXITCODE
# 用指定退出码结束脚本；exit 表示退出。
