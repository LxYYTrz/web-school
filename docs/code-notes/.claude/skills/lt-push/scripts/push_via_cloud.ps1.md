# .claude/skills/lt-push/scripts/push_via_cloud.ps1 逐行说明

[打开源码](../../../../../../.claude/skills/lt-push/scripts/push_via_cloud.ps1) · 92 行 · 59 行待说明代码

只列出非空、非纯注释行；原有注释请直接看源码。

行号以当前源码为准。修改源码后应重新核对这份说明。

| 源码行 | 原语句 | 作用与关键字 |
|---:|---|---|
| 1 | <code>#!/usr/bin/env pwsh</code> | 指定运行这个脚本时使用的解释器。 |
| 17 | <code>[CmdletBinding()]</code> | 执行 PowerShell 命令或补全参数。 |
| 18 | <code>param(</code> | 控制执行流程或声明脚本参数。 |
| 19 | <code>[string]$Branch  = 'line-twin',</code> | 执行 PowerShell 命令或补全参数。 |
| 20 | <code>[string]$Repo    = 'LxYYTrz/web-school',</code> | 执行 PowerShell 命令或补全参数。 |
| 21 | <code>[string]$Server  = 'root@119.91.145.27',</code> | 执行 PowerShell 命令或补全参数。 |
| 22 | <code>[string]$Key     = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev',</code> | 执行 PowerShell 命令或补全参数。 |
| 23 | <code>[string]$TokenFile = "$env:USERPROFILE\.github_token",</code> | 执行 PowerShell 命令或补全参数。 |
| 24 | <code>[string]$RepoPath = 'D:\line-twin',</code> | 执行 PowerShell 命令或补全参数。 |
| 25 | <code>[string]$GitExe  = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe',</code> | 执行 PowerShell 命令或补全参数。 |
| 26 | <code>[string]$SshExe  = 'C:\Windows\System32\OpenSSH\ssh.exe',</code> | 执行 PowerShell 命令或补全参数。 |
| 27 | <code>[string]$ScpExe  = 'C:\Windows\System32\OpenSSH\scp.exe'</code> | 执行 PowerShell 命令或补全参数。 |
| 28 | <code>)</code> | 执行 PowerShell 命令或补全参数。 |
| 30 | <code>$ErrorActionPreference = 'Stop'</code> | 给变量 `$ErrorActionPreference` 赋值。 |
| 31 | <code>$skillDir = Split-Path -Parent $PSScriptRoot</code> | 给变量 `$skillDir` 赋值。 |
| 32 | <code>$serverScript = Join-Path $skillDir 'scripts\push_via_cloud.sh'</code> | 给变量 `$serverScript` 赋值。 |
| 33 | <code>$tmp = Join-Path $env:TEMP "lt-push-$PID"</code> | 给变量 `$tmp` 赋值。 |
| 34 | <code>New-Item -ItemType Directory -Force -Path $tmp &#124; Out-Null</code> | 执行 PowerShell 命令或补全参数。 |
| 36 | <code>function Say($m) { Write-Host "==&gt; $m" }</code> | 定义 PowerShell 函数 `Say`。 |
| 38 | <code>try {</code> | 控制执行流程或声明脚本参数。 |
| 40 | <code>Say "前置体检"</code> | 执行 PowerShell 命令或补全参数。 |
| 41 | <code>$apiOk = Test-NetConnection api.github.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue</code> | 给变量 `$apiOk` 赋值。 |
| 42 | <code>$ghOk  = Test-NetConnection github.com   -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue</code> | 给变量 `$ghOk` 赋值。 |
| 43 | <code>Say "  api.github.com = $apiOk ; github.com = $ghOk"</code> | 执行 PowerShell 命令或补全参数。 |
| 44 | <code>if (-not $apiOk) { throw 'api.github.com 也不通 —— 这不是本 skill 解决的情况(先解决网络)' }</code> | 控制执行流程或声明脚本参数。 |
| 45 | <code>if ($ghOk) { Say 'github.com 其实通,直接 git push 就行,不用绕这一圈' }</code> | 控制执行流程或声明脚本参数。 |
| 46 | <code>if (-not (Test-Path $TokenFile)) { throw "找不到 token 文件: $TokenFile" }</code> | 控制执行流程或声明脚本参数。 |
| 47 | <code>if (-not (Test-Path $Key))       { throw "找不到 SSH 私钥: $Key" }</code> | 控制执行流程或声明脚本参数。 |
| 49 | <code>$head = (&amp; $GitExe -C $RepoPath rev-parse HEAD).Trim()</code> | 给变量 `$head` 赋值。 |
| 50 | <code>Say "本地 HEAD = $head"</code> | 执行 PowerShell 命令或补全参数。 |
| 53 | <code>Say '打 bundle'</code> | 执行 PowerShell 命令或补全参数。 |
| 54 | <code>$bundle = Join-Path $tmp 'lt-push.bundle'</code> | 给变量 `$bundle` 赋值。 |
| 55 | <code>&amp; $GitExe -C $RepoPath bundle create $bundle $Branch</code> | 执行 PowerShell 命令或补全参数。 |
| 56 | <code>if ($LASTEXITCODE -ne 0) { throw 'git bundle 失败' }</code> | 控制执行流程或声明脚本参数。 |
| 59 | <code>Say "上传到 $Server"</code> | 执行 PowerShell 命令或补全参数。 |
| 60 | <code>&amp; $ScpExe -q -i $Key $bundle "${Server}:/root/lt-push.bundle"</code> | 执行 PowerShell 命令或补全参数。 |
| 61 | <code>&amp; $ScpExe -q -i $Key $serverScript "${Server}:/root/push_via_cloud.sh"</code> | 执行 PowerShell 命令或补全参数。 |
| 62 | <code>&amp; $ScpExe -q -i $Key $TokenFile "${Server}:/root/.lt_push_token"</code> | 执行 PowerShell 命令或补全参数。 |
| 63 | <code>if ($LASTEXITCODE -ne 0) { throw 'scp 失败' }</code> | 控制执行流程或声明脚本参数。 |
| 66 | <code>Say '云服务器执行推送'</code> | 执行 PowerShell 命令或补全参数。 |
| 67 | <code>&amp; $SshExe -i $Key $Server "chmod 700 /root/push_via_cloud.sh; bash /root/push_via_cloud.sh $Branch"</code> | 执行 PowerShell 命令或补全参数。 |
| 68 | <code>if ($LASTEXITCODE -ne 0) { throw "推送失败(退出码 $LASTEXITCODE)" }</code> | 控制执行流程或声明脚本参数。 |
| 71 | <code>Say '验证远端'</code> | 执行 PowerShell 命令或补全参数。 |
| 72 | <code>$tok = (Get-Content $TokenFile -Raw).Trim()</code> | 给变量 `$tok` 赋值。 |
| 73 | <code>$h = @{ Authorization = "token $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'lt-push' }</code> | 给变量 `$h` 赋值。 |
| 74 | <code>$remote = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/branches/$Branch" -Headers $h -TimeoutSec 20</code> | 给变量 `$remote` 赋值。 |
| 75 | <code>Say "  远端 $Branch = $($remote.commit.sha)"</code> | 执行 PowerShell 命令或补全参数。 |
| 76 | <code>if ($remote.commit.sha -ne $head) { throw "远端 SHA 与本地不一致(本地 $head / 远端 $($remote.commit.sha))" }</code> | 控制执行流程或声明脚本参数。 |
| 77 | <code>Say '  SHA 一致 ✔'</code> | 执行 PowerShell 命令或补全参数。 |
| 80 | <code>&amp; $GitExe -C $RepoPath update-ref "refs/remotes/origin/$Branch" $head</code> | 执行 PowerShell 命令或补全参数。 |
| 81 | <code>Say "已更新本地 origin/$Branch 跟踪引用"</code> | 执行 PowerShell 命令或补全参数。 |
| 84 | <code>&amp; $SshExe -i $Key $Server "rm -f /root/.lt_push_token /root/.lt_cred /root/lt-push.bundle /root/push_via_cloud.sh; rm -rf /tmp/lt-push" 2&gt;$null</code> | 执行 PowerShell 命令或补全参数。 |
| 85 | <code>Say '云服务器临时文件已清理'</code> | 执行 PowerShell 命令或补全参数。 |
| 87 | <code>Say "完成 ✔  $Repo@$Branch = $head"</code> | 执行 PowerShell 命令或补全参数。 |
| 88 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 89 | <code>finally {</code> | 控制执行流程或声明脚本参数。 |
| 90 | <code>Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue</code> | 执行 PowerShell 命令或补全参数。 |
| 91 | <code>}</code> | 执行 PowerShell 命令或补全参数。 |
| 92 | <code>exit 0</code> | 执行 PowerShell 命令或补全参数。 |
