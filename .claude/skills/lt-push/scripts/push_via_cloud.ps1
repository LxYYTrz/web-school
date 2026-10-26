#!/usr/bin/env pwsh
<#
# 这一段负责打包当前分支，经云服务器快进推送并验证提交与清理临时凭据，为后续代码提供当前文件的处理入口。
.SYNOPSIS
# !/usr/bin/env pwsh。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    在 github.com 直连不通的机器上,借云服务器中转把提交推上 GitHub。
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

.DESCRIPTION
# 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    本机(如工控机)到 github.com:443 不通,但云服务器能直连。
    # 调用 本机，把括号中的值作为参数传入，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    本脚本:体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送
    # 设置字段 本脚本，值为 体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
            -> 通过 api.github.com 验证远端 SHA -> 清理所有临时文件与凭据。
            # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
            # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

.EXAMPLE
# 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

.EXAMPLE
# 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1 -Branch main
    # 继续当前表达式；这一行的值由外层代码块或调用使用，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
#>
[CmdletBinding()]
# 执行 CmdletBinding 对应的本地处理，使用本行提供的数据。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
param(
# 执行 param 对应的本地处理，使用本行提供的数据。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    [string]$Branch  = 'line-twin',
    # 根据 'line-twin', 设置 [string]$Branch，供当前流程后续使用。
    # $Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值；line-twin 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    [string]$Repo    = 'LxYYTrz/web-school',
    # 根据 'LxYYTrz/web-school', 设置 [string]$Repo，供当前流程后续使用。
    # $Repo 是本脚本或当前函数前面定义的配置、命令结果或路径值；web-school 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    [string]$Server  = 'root@119.91.145.27',
    # 根据 'root@119.91.145.27', 设置 [string]$Server，供当前流程后续使用。
    # $Server 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [string]$Key     = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev',
    # 根据 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev', 设置 [string]$Key，供当前流程后续使用。
    # $Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；agent-claude 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    [string]$TokenFile = "$env:USERPROFILE\.github_token",
    # 根据 "$env:USERPROFILE\.github_token", 设置 [string]$TokenFile，供当前流程后续使用。
    # $TokenFile 是本脚本或当前函数前面定义的配置、命令结果或路径值；$env:USERPROFILE 是进程环境变量中的配置值
    [string]$RepoPath = 'D:\line-twin',
    # 根据 'D:\line-twin', 设置 [string]$RepoPath，供当前流程后续使用。
    # $RepoPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；line-twin 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    [string]$GitExe  = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe',
    # 根据 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe… 设置 [string]$GitExe，供当前流程后续使用。
    # $GitExe 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [string]$SshExe  = 'C:\Windows\System32\OpenSSH\ssh.exe',
    # 根据 'C:\Windows\System32\OpenSSH\ssh.exe', 设置 [string]$SshExe，供当前流程后续使用。
    # $SshExe 是本脚本或当前函数前面定义的配置、命令结果或路径值
    [string]$ScpExe  = 'C:\Windows\System32\OpenSSH\scp.exe'
    # 根据 'C:\Windows\System32\OpenSSH\scp.exe' 设置 [string]$ScpExe，供当前流程后续使用。
    # $ScpExe 是本脚本或当前函数前面定义的配置、命令结果或路径值
)
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

$ErrorActionPreference = 'Stop'
# 给变量 $ErrorActionPreference 赋值。
# $ErrorActionPreference 控制命令报错时的处理方式
$skillDir = Split-Path -Parent $PSScriptRoot
# 给变量 $skillDir 赋值。
# $skillDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；$PSScriptRoot 是本脚本或当前函数前面定义的配置、命令结果或路径值；Split-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$serverScript = Join-Path $skillDir 'scripts\push_via_cloud.sh'
# 给变量 $serverScript 赋值。
# $serverScript 是本脚本或当前函数前面定义的配置、命令结果或路径值；$skillDir 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
$tmp = Join-Path $env:TEMP "lt-push-$PID"
# 根据 Join-Path $env:TEMP "lt-push-$PID" 设置 $tmp，供当前流程后续使用。
# $tmp 是本脚本或当前函数前面定义的配置、命令结果或路径值；$env:TEMP 是进程环境变量中的配置值；$PID 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# $tmp 是本脚本或当前函数前面定义的配置、命令结果或路径值；New-Item 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

function Say($m) { Write-Host "==> $m" }
# 定义 PowerShell 函数 Say。
# $m 是本脚本或当前函数前面定义的配置、命令结果或路径值；Write-Host 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

try {
# 开始执行可能失败的操作，错误由后续异常分支处理。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    # ---------- 1) 前置体检 ----------
    Say "前置体检"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    $apiOk = Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    # 根据 Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction Si… 设置 $apiOk，供当前流程后续使用。
    # $apiOk 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-NetConnection 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $ghOk  = Test-NetConnection github.com   -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    # 根据 Test-NetConnection github.com -Port 443 -InformationLevel Quiet -WarningAction Silent… 设置 $ghOk，供当前流程后续使用。
    # $ghOk 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-NetConnection 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Say "  api.github.com = $apiOk ; github.com = $ghOk"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $apiOk 是本脚本或当前函数前面定义的配置、命令结果或路径值；$ghOk 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' }
    # 条件 (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' } 成立时按本行给出的错误终止处理。
    # $apiOk 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if ($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }
    # 检查($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }，按判断结果进入对应的处理分支。
    # $ghOk 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" }
    # 条件 (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" } 成立时按本行给出的错误终止处理。
    # $TokenFile 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    if (-not (Test-Path $Key))       { throw "找不到 SSH 私钥: $Key" }
    # 条件 (-not (Test-Path $Key)) { throw "找不到 SSH 私钥: $Key" } 成立时按本行给出的错误终止处理。
    # $Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；Test-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作

    $head = (& $GitExe -C $RepoPath rev-parse HEAD).Trim()
    # 执行 Trim 对应的本地处理，使用本行提供的数据，将结果保存或写入 $head。
    # $head 是本脚本或当前函数前面定义的配置、命令结果或路径值；$GitExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$RepoPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；rev-parse 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Say "本地 HEAD = $head"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $head 是本脚本或当前函数前面定义的配置、命令结果或路径值

    # ---------- 2) 打 bundle ----------
    Say '打 bundle'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    $bundle = Join-Path $tmp 'lt-push.bundle'
    # 给变量 $bundle 赋值。
    # $bundle 是本脚本或当前函数前面定义的配置、命令结果或路径值；$tmp 是本脚本或当前函数前面定义的配置、命令结果或路径值；Join-Path 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    & $GitExe -C $RepoPath bundle create $bundle $Branch
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $GitExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$RepoPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；$bundle 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' }
    # 条件 ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' } 成立时按本行给出的错误终止处理。
    # $LASTEXITCODE 是上一条外部命令的退出状态码

    # ---------- 3) 传到云服务器 ----------
    Say "上传到 $Server"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $Server 是本脚本或当前函数前面定义的配置、命令结果或路径值
    & $ScpExe -q -i $Key $bundle "${Server}:/root/lt-push.bundle"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $ScpExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；$bundle 是本脚本或当前函数前面定义的配置、命令结果或路径值；lt-push 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    & $ScpExe -q -i $Key $serverScript "${Server}:/root/push_via_cloud.sh"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $ScpExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；$serverScript 是本脚本或当前函数前面定义的配置、命令结果或路径值
    & $ScpExe -q -i $Key $TokenFile "${Server}:/root/.lt_push_token"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $ScpExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；$TokenFile 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }
    # 条件 ($LASTEXITCODE -ne 0) { throw 'scp 失败' } 成立时按本行给出的错误终止处理。
    # $LASTEXITCODE 是上一条外部命令的退出状态码

    # ---------- 4) 云服务器上推 ----------
    Say '云服务器执行推送'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    & $SshExe -i $Key $Server "chmod 700 /root/push_via_cloud.sh; bash /root/push_via_cloud.sh $Branch"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $SshExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Server 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" }
    # 条件 ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" } 成立时按本行给出的错误终止处理。
    # $LASTEXITCODE 是上一条外部命令的退出状态码

    # ---------- 5) 用 API 验证远端 ----------
    Say '验证远端'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    $tok = (Get-Content $TokenFile -Raw).Trim()
    # 执行 Trim 对应的本地处理，使用本行提供的数据，将结果保存或写入 $tok。
    # $tok 是本脚本或当前函数前面定义的配置、命令结果或路径值；$TokenFile 是本脚本或当前函数前面定义的配置、命令结果或路径值；Get-Content 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $h = @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'lt-push' }
    # 根据 @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent'… 设置 $h，供当前流程后续使用。
    # $h 是本脚本或当前函数前面定义的配置、命令结果或路径值；$tok 是本脚本或当前函数前面定义的配置、命令结果或路径值；User-Agent 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    $remote = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/branches/$Branch" -Headers $h -TimeoutSec 20
    # 给变量 $remote 赋值。
    # $remote 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Repo 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值；$h 是本脚本或当前函数前面定义的配置、命令结果或路径值；Invoke-RestMethod 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Say "  远端 $Branch = $($remote.commit.sha)"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值；$remote 是本脚本或当前函数前面定义的配置、命令结果或路径值
    if ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" }
    # 条件 ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" } 成立时按本行给出的错误终止处理。
    # $remote 是本脚本或当前函数前面定义的配置、命令结果或路径值；$head 是本脚本或当前函数前面定义的配置、命令结果或路径值
    Say '  SHA 一致 ✔'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    # ---------- 6) 本地跟踪引用对齐(本机 fetch 不了 github.com) ----------
    & $GitExe -C $RepoPath update-ref "refs/remotes/origin/$Branch" $head
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $GitExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$RepoPath 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值；$head 是本脚本或当前函数前面定义的配置、命令结果或路径值；update-ref 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Say "已更新本地 origin/$Branch 跟踪引用"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值

    # ---------- 7) 云服务器上的残留清理(脚本里清过一次,这里兜底) ----------
    & $SshExe -i $Key $Server "rm -f /root/.lt_push_token /root/.lt_cred /root/lt-push.bundle /root/push_via_cloud.sh; rm -rf /tmp/lt-push" 2>$null
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $SshExe 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Key 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Server 是本脚本或当前函数前面定义的配置、命令结果或路径值；lt-push 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
    Say '云服务器临时文件已清理'
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

    Say "完成 ✔  $Repo@$Branch = $head"
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $Repo 是本脚本或当前函数前面定义的配置、命令结果或路径值；$Branch 是本脚本或当前函数前面定义的配置、命令结果或路径值；$head 是本脚本或当前函数前面定义的配置、命令结果或路径值
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
finally {
# 执行无论上面操作成功还是失败都需要的清理步骤。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    # 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
    # $tmp 是本脚本或当前函数前面定义的配置、命令结果或路径值；Remove-Item 是 PowerShell 提供或本脚本定义的命令，用于执行本行指定的动作
}
# 结束当前函数、分支或对象配置，返回上一层处理流程。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
exit 0
# 执行 PowerShell 命令或补全参数，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
# 这一段提供了打包当前分支，经云服务器快进推送并验证提交与清理临时凭据所需的定义和处理逻辑，结果交由调用方或运行环境使用。
