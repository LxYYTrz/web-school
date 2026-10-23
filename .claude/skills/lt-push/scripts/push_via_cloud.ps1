#!/usr/bin/env pwsh
<#
.SYNOPSIS
    在 github.com 直连不通的机器上,借云服务器中转把提交推上 GitHub。

.DESCRIPTION
    本机(如工控机)到 github.com:443 不通,但云服务器能直连。
    本脚本:体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送
            -> 通过 api.github.com 验证远端 SHA -> 清理所有临时文件与凭据。

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1 -Branch main
#>
[CmdletBinding()]
param(
    [string]$Branch  = 'line-twin',
    [string]$Repo    = 'LxYYTrz/web-school',
    [string]$Server  = 'root@119.91.145.27',
    [string]$Key     = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev',
    [string]$TokenFile = "$env:USERPROFILE\.github_token",
    [string]$RepoPath = 'D:\line-twin',
    [string]$GitExe  = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe',
    [string]$SshExe  = 'C:\Windows\System32\OpenSSH\ssh.exe',
    [string]$ScpExe  = 'C:\Windows\System32\OpenSSH\scp.exe'
)

$ErrorActionPreference = 'Stop'
$skillDir = Split-Path -Parent $PSScriptRoot
$serverScript = Join-Path $skillDir 'scripts\push_via_cloud.sh'
$tmp = Join-Path $env:TEMP "lt-push-$PID"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

function Say($m) { Write-Host "==> $m" }

try {
    # ---------- 1) 前置体检 ----------
    Say "前置体检"
    $apiOk = Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    $ghOk  = Test-NetConnection github.com   -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    Say "  api.github.com = $apiOk ; github.com = $ghOk"
    if (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' }
    if ($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }
    if (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" }
    if (-not (Test-Path $Key))       { throw "找不到 SSH 私钥: $Key" }

    $head = (& $GitExe -C $RepoPath rev-parse HEAD).Trim()
    Say "本地 HEAD = $head"

    # ---------- 2) 打 bundle ----------
    Say '打 bundle'
    $bundle = Join-Path $tmp 'lt-push.bundle'
    & $GitExe -C $RepoPath bundle create $bundle $Branch
    if ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' }

    # ---------- 3) 传到云服务器 ----------
    Say "上传到 $Server"
    & $ScpExe -q -i $Key $bundle "${Server}:/root/lt-push.bundle"
    & $ScpExe -q -i $Key $serverScript "${Server}:/root/push_via_cloud.sh"
    & $ScpExe -q -i $Key $TokenFile "${Server}:/root/.lt_push_token"
    if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }

    # ---------- 4) 云服务器上推 ----------
    Say '云服务器执行推送'
    & $SshExe -i $Key $Server "chmod 700 /root/push_via_cloud.sh; bash /root/push_via_cloud.sh $Branch"
    if ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" }

    # ---------- 5) 用 API 验证远端 ----------
    Say '验证远端'
    $tok = (Get-Content $TokenFile -Raw).Trim()
    $h = @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'lt-push' }
    $remote = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/branches/$Branch" -Headers $h -TimeoutSec 20
    Say "  远端 $Branch = $($remote.commit.sha)"
    if ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" }
    Say '  SHA 一致 ✔'

    # ---------- 6) 本地跟踪引用对齐(本机 fetch 不了 github.com) ----------
    & $GitExe -C $RepoPath update-ref "refs/remotes/origin/$Branch" $head
    Say "已更新本地 origin/$Branch 跟踪引用"

    # ---------- 7) 云服务器上的残留清理(脚本里清过一次,这里兜底) ----------
    & $SshExe -i $Key $Server "rm -f /root/.lt_push_token /root/.lt_cred /root/lt-push.bundle /root/push_via_cloud.sh; rm -rf /tmp/lt-push" 2>$null
    Say '云服务器临时文件已清理'

    Say "完成 ✔  $Repo@$Branch = $head"
}
finally {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}
