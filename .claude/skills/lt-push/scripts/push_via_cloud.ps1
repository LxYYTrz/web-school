#!/usr/bin/env pwsh
<#
.SYNOPSIS
# 继续当前表达式；这一行的值由外层代码块或调用使用。
    在 github.com 直连不通的机器上,借云服务器中转把提交推上 GitHub。
    # 继续当前表达式；这一行的值由外层代码块或调用使用。

.DESCRIPTION
# 继续当前表达式；这一行的值由外层代码块或调用使用。
    本机(如工控机)到 github.com:443 不通,但云服务器能直连。
    # 调用 本机，把括号中的值作为参数传入。
    本脚本:体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送
    # 设置字段 本脚本，值为 体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送。
            -> 通过 api.github.com 验证远端 SHA -> 清理所有临时文件与凭据。
            # 继续当前表达式；这一行的值由外层代码块或调用使用。

.EXAMPLE
# 继续当前表达式；这一行的值由外层代码块或调用使用。
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1
    # 继续当前表达式；这一行的值由外层代码块或调用使用。

.EXAMPLE
# 继续当前表达式；这一行的值由外层代码块或调用使用。
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1 -Branch main
    # 继续当前表达式；这一行的值由外层代码块或调用使用。
#>
[CmdletBinding()]
# 调用 [CmdletBinding()]，按照本行参数处理或检查对应资源。
param(
# 开始声明该脚本的输入参数；param 是 PowerShell 参数块。
    [string]$Branch  = 'line-twin',
    # 声明参数 $Branch，类型为 string，等号右边是默认值（若有）。
    [string]$Repo    = 'LxYYTrz/web-school',
    # 声明参数 $Repo，类型为 string，等号右边是默认值（若有）。
    [string]$Server  = 'root@119.91.145.27',
    # 声明参数 $Server，类型为 string，等号右边是默认值（若有）。
    [string]$Key     = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev',
    # 声明参数 $Key，类型为 string，等号右边是默认值（若有）。
    [string]$TokenFile = "$env:USERPROFILE\.github_token",
    # 声明参数 $TokenFile，类型为 string，等号右边是默认值（若有）。
    [string]$RepoPath = 'D:\line-twin',
    # 声明参数 $RepoPath，类型为 string，等号右边是默认值（若有）。
    [string]$GitExe  = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe',
    # 声明参数 $GitExe，类型为 string，等号右边是默认值（若有）。
    [string]$SshExe  = 'C:\Windows\System32\OpenSSH\ssh.exe',
    # 声明参数 $SshExe，类型为 string，等号右边是默认值（若有）。
    [string]$ScpExe  = 'C:\Windows\System32\OpenSSH\scp.exe'
    # 声明参数 $ScpExe，类型为 string，等号右边是默认值（若有）。
)
# 结束当前参数列表或脚本代码块。

$ErrorActionPreference = 'Stop'
# 给变量 $ErrorActionPreference 赋值。
$skillDir = Split-Path -Parent $PSScriptRoot
# 给变量 $skillDir 赋值。
$serverScript = Join-Path $skillDir 'scripts\push_via_cloud.sh'
# 给变量 $serverScript 赋值。
$tmp = Join-Path $env:TEMP "lt-push-$PID"
# 给变量 $tmp 赋值。
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
# 用 New-Item 创建本行指定的目录或文件。

function Say($m) { Write-Host "==> $m" }
# 定义 PowerShell 函数 Say。 关键字：function＝定义函数。

try {
# 开始可能失败的操作块；try 表示尝试执行。
    # ---------- 1) 前置体检 ----------
    Say "前置体检"
    # 调用提示函数显示当前执行步骤。
    $apiOk = Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    # 给变量 $apiOk 赋值。
    $ghOk  = Test-NetConnection github.com   -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    # 给变量 $ghOk 赋值。
    Say "  api.github.com = $apiOk ; github.com = $ghOk"
    # 调用提示函数显示当前执行步骤。
    if (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    if ($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    if (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    if (-not (Test-Path $Key))       { throw "找不到 SSH 私钥: $Key" }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。

    $head = (& $GitExe -C $RepoPath rev-parse HEAD).Trim()
    # 给变量 $head 赋值。
    Say "本地 HEAD = $head"
    # 调用提示函数显示当前执行步骤。

    # ---------- 2) 打 bundle ----------
    Say '打 bundle'
    # 调用提示函数显示当前执行步骤。
    $bundle = Join-Path $tmp 'lt-push.bundle'
    # 给变量 $bundle 赋值。
    & $GitExe -C $RepoPath bundle create $bundle $Branch
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    if ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。

    # ---------- 3) 传到云服务器 ----------
    Say "上传到 $Server"
    # 调用提示函数显示当前执行步骤。
    & $ScpExe -q -i $Key $bundle "${Server}:/root/lt-push.bundle"
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    & $ScpExe -q -i $Key $serverScript "${Server}:/root/push_via_cloud.sh"
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    & $ScpExe -q -i $Key $TokenFile "${Server}:/root/.lt_push_token"
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。

    # ---------- 4) 云服务器上推 ----------
    Say '云服务器执行推送'
    # 调用提示函数显示当前执行步骤。
    & $SshExe -i $Key $Server "chmod 700 /root/push_via_cloud.sh; bash /root/push_via_cloud.sh $Branch"
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    if ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。

    # ---------- 5) 用 API 验证远端 ----------
    Say '验证远端'
    # 调用提示函数显示当前执行步骤。
    $tok = (Get-Content $TokenFile -Raw).Trim()
    # 给变量 $tok 赋值。
    $h = @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'lt-push' }
    # 给变量 $h 赋值。
    $remote = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/branches/$Branch" -Headers $h -TimeoutSec 20
    # 给变量 $remote 赋值。
    Say "  远端 $Branch = $($remote.commit.sha)"
    # 调用提示函数显示当前执行步骤。
    if ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" }
    # 用 if 检查括号内的条件；成立时执行花括号中的操作。
    Say '  SHA 一致 ✔'
    # 调用提示函数显示当前执行步骤。

    # ---------- 6) 本地跟踪引用对齐(本机 fetch 不了 github.com) ----------
    & $GitExe -C $RepoPath update-ref "refs/remotes/origin/$Branch" $head
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    Say "已更新本地 origin/$Branch 跟踪引用"
    # 调用提示函数显示当前执行步骤。

    # ---------- 7) 云服务器上的残留清理(脚本里清过一次,这里兜底) ----------
    & $SshExe -i $Key $Server "rm -f /root/.lt_push_token /root/.lt_cred /root/lt-push.bundle /root/push_via_cloud.sh; rm -rf /tmp/lt-push" 2>$null
    # 用调用运算符 & 执行本行指定的外部程序或脚本，并传递后续参数。
    Say '云服务器临时文件已清理'
    # 调用提示函数显示当前执行步骤。

    Say "完成 ✔  $Repo@$Branch = $head"
    # 调用提示函数显示当前执行步骤。
}
# 结束当前参数列表或脚本代码块。
finally {
# 执行无论成功或失败都必须运行的清理步骤。
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    # 用 Remove-Item 清除本行指定的临时项目。
}
# 结束当前参数列表或脚本代码块。
exit 0
# 用指定退出码结束脚本；exit 表示退出。
