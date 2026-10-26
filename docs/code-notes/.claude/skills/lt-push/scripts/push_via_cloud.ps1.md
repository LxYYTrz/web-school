# .claude/skills/lt-push/scripts/push_via_cloud.ps1 逐行注释

[打开源码](../../../../../../.claude/skills/lt-push/scripts/push_via_cloud.ps1) · 92 行 · 70 行代码说明

以下每个代码块先列原代码行，下一行紧跟解释。注释只用于阅读，不会写入可执行文件；行号对应当前源码。

**源码第 1 行**

```text
#!/usr/bin/env pwsh
# 注释：指定运行这个脚本时使用的解释器。
```

**源码第 2 行**

```text
<#
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 3 行**

```text
.SYNOPSIS
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 4 行**

```text
    在 github.com 直连不通的机器上,借云服务器中转把提交推上 GitHub。
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 6 行**

```text
.DESCRIPTION
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 7 行**

```text
    本机(如工控机)到 github.com:443 不通,但云服务器能直连。
# 注释：调用 本机，把括号中的值作为参数传入。
```

**源码第 8 行**

```text
    本脚本:体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送
# 注释：设置字段 本脚本，值为 体检 -> 打 bundle -> scp 到云服务器 -> 云服务器上核对并快进推送。
```

**源码第 9 行**

```text
            -> 通过 api.github.com 验证远端 SHA -> 清理所有临时文件与凭据。
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 11 行**

```text
.EXAMPLE
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 12 行**

```text
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 14 行**

```text
.EXAMPLE
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 15 行**

```text
    powershell -ExecutionPolicy Bypass -File push_via_cloud.ps1 -Branch main
# 注释：继续当前表达式；这一行的值由外层代码块或调用使用。
```

**源码第 17 行**

```text
[CmdletBinding()]
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 18 行**

```text
param(
# 注释：控制执行流程或声明脚本参数。
```

**源码第 19 行**

```text
    [string]$Branch  = 'line-twin',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 20 行**

```text
    [string]$Repo    = 'LxYYTrz/web-school',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 21 行**

```text
    [string]$Server  = 'root@119.91.145.27',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 22 行**

```text
    [string]$Key     = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 23 行**

```text
    [string]$TokenFile = "$env:USERPROFILE\.github_token",
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 24 行**

```text
    [string]$RepoPath = 'D:\line-twin',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 25 行**

```text
    [string]$GitExe  = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 26 行**

```text
    [string]$SshExe  = 'C:\Windows\System32\OpenSSH\ssh.exe',
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 27 行**

```text
    [string]$ScpExe  = 'C:\Windows\System32\OpenSSH\scp.exe'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 28 行**

```text
)
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 30 行**

```text
$ErrorActionPreference = 'Stop'
# 注释：给变量 `$ErrorActionPreference` 赋值。
```

**源码第 31 行**

```text
$skillDir = Split-Path -Parent $PSScriptRoot
# 注释：给变量 `$skillDir` 赋值。
```

**源码第 32 行**

```text
$serverScript = Join-Path $skillDir 'scripts\push_via_cloud.sh'
# 注释：给变量 `$serverScript` 赋值。
```

**源码第 33 行**

```text
$tmp = Join-Path $env:TEMP "lt-push-$PID"
# 注释：给变量 `$tmp` 赋值。
```

**源码第 34 行**

```text
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 36 行**

```text
function Say($m) { Write-Host "==> $m" }
# 注释：定义 PowerShell 函数 `Say`。 关键字：function＝定义函数。
```

**源码第 38 行**

```text
try {
# 注释：控制执行流程或声明脚本参数。 关键字：try＝开始异常捕获范围。
```

**源码第 40 行**

```text
    Say "前置体检"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 41 行**

```text
    $apiOk = Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
# 注释：给变量 `$apiOk` 赋值。
```

**源码第 42 行**

```text
    $ghOk  = Test-NetConnection github.com   -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
# 注释：给变量 `$ghOk` 赋值。
```

**源码第 43 行**

```text
    Say "  api.github.com = $apiOk ; github.com = $ghOk"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 44 行**

```text
    if (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 45 行**

```text
    if ($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断。
```

**源码第 46 行**

```text
    if (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 47 行**

```text
    if (-not (Test-Path $Key))       { throw "找不到 SSH 私钥: $Key" }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 49 行**

```text
    $head = (& $GitExe -C $RepoPath rev-parse HEAD).Trim()
# 注释：给变量 `$head` 赋值。
```

**源码第 50 行**

```text
    Say "本地 HEAD = $head"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 53 行**

```text
    Say '打 bundle'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 54 行**

```text
    $bundle = Join-Path $tmp 'lt-push.bundle'
# 注释：给变量 `$bundle` 赋值。
```

**源码第 55 行**

```text
    & $GitExe -C $RepoPath bundle create $bundle $Branch
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 56 行**

```text
    if ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 59 行**

```text
    Say "上传到 $Server"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 60 行**

```text
    & $ScpExe -q -i $Key $bundle "${Server}:/root/lt-push.bundle"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 61 行**

```text
    & $ScpExe -q -i $Key $serverScript "${Server}:/root/push_via_cloud.sh"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 62 行**

```text
    & $ScpExe -q -i $Key $TokenFile "${Server}:/root/.lt_push_token"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 63 行**

```text
    if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 66 行**

```text
    Say '云服务器执行推送'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 67 行**

```text
    & $SshExe -i $Key $Server "chmod 700 /root/push_via_cloud.sh; bash /root/push_via_cloud.sh $Branch"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 68 行**

```text
    if ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 71 行**

```text
    Say '验证远端'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 72 行**

```text
    $tok = (Get-Content $TokenFile -Raw).Trim()
# 注释：给变量 `$tok` 赋值。
```

**源码第 73 行**

```text
    $h = @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'lt-push' }
# 注释：给变量 `$h` 赋值。
```

**源码第 74 行**

```text
    $remote = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/branches/$Branch" -Headers $h -TimeoutSec 20
# 注释：给变量 `$remote` 赋值。
```

**源码第 75 行**

```text
    Say "  远端 $Branch = $($remote.commit.sha)"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 76 行**

```text
    if ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" }
# 注释：控制执行流程或声明脚本参数。 关键字：if＝条件判断；throw＝抛出异常。
```

**源码第 77 行**

```text
    Say '  SHA 一致 ✔'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 80 行**

```text
    & $GitExe -C $RepoPath update-ref "refs/remotes/origin/$Branch" $head
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 81 行**

```text
    Say "已更新本地 origin/$Branch 跟踪引用"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 84 行**

```text
    & $SshExe -i $Key $Server "rm -f /root/.lt_push_token /root/.lt_cred /root/lt-push.bundle /root/push_via_cloud.sh; rm -rf /tmp/lt-push" 2>$null
# 注释：执行 PowerShell 命令或补全参数。 关键字：null＝空值。
```

**源码第 85 行**

```text
    Say '云服务器临时文件已清理'
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 87 行**

```text
    Say "完成 ✔  $Repo@$Branch = $head"
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 88 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 89 行**

```text
finally {
# 注释：控制执行流程或声明脚本参数。
```

**源码第 90 行**

```text
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 91 行**

```text
}
# 注释：执行 PowerShell 命令或补全参数。
```

**源码第 92 行**

```text
exit 0
# 注释：执行 PowerShell 命令或补全参数。
```
