---
name: lt-push
description: '在 github.com 直连不通的机器上,借云服务器中转把提交推上 GitHub(工控机/内网场景)。当用户说"提交并推送""推到远程""push"而 git push 卡在 "Failed to connect to github.com port 443" 时使用。也涵盖本项目的提交规范:commit message 用 UTF-8 无 BOM、推送后清理服务器上的 token。'
license: MIT
allowed-tools: Bash
---

# 借云服务器中转推送 GitHub

## 什么时候用

在这台机器上 `git push` 会卡住:

```
fatal: unable to access 'https://github.com/.../': Failed to connect to github.com port 443
```

**先确认是不是这个情况**(`api.github.com` 通常是通的,只有 `github.com` 被挡):

```powershell
foreach($h in 'api.github.com','github.com'){
  "$h : " + (Test-NetConnection $h -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue)
}
```

| api.github.com | github.com | 结论 |
|---|---|---|
| True | True | 直接 `git push` 就行,不用本 skill |
| True | **False** | ★ 就是本 skill 适用的场景 |
| False | False | 网络整体不通,换别的路(比如走代理) |

## 为什么这么绕

git 的智能 HTTP 端点只挂在 `github.com` 上,`api.github.com` 只能调 REST API
(用 API 重建提交会得到**不同的 commit SHA**,和本地对不上,还会让分支分叉)。
所以要保住 SHA 一致,就只能在**能连通 github.com 的机器上**推一次。

本项目的条件:

| 项 | 值 |
|---|---|
| 中转机 | `root@119.91.145.27`(云服务器,能直连 github.com) |
| 用的密钥 | `C:\Users\Administrator\.ssh\agent-claude-line-twin-dev` |
| 仓库 / 分支 | `LxYYTrz/web-school` / `line-twin` |
| PAT | `~\.github_token`(文件里有,不用进命令行) |

> ⚠ **别用 `C:\ProgramData\line-twin\tunnel_ed25519`** —— 那把钥匙属主是 SYSTEM,
> Administrator 身份用不了(OpenSSH 要求私钥属主 == 运行身份)。

## 一条命令跑完

```powershell
powershell -ExecutionPolicy Bypass -File .claude\skills\lt-push\scripts\push_via_cloud.ps1
```

参数(都有默认值,一般不用改):

```powershell
-Branch line-twin -Repo LxYYTrz/web-school -Server root@119.91.145.27
```

脚本做的事:

1. **前置体检** —— `api.github.com` 通不通、`github.com` 通不通、云服务器能不能连 github.com
2. **打 bundle** —— `git bundle create`,把当前分支的完整历史打包(0.7MB 左右)
3. **传** —— scp 三个文件到云服务器:bundle、服务器端脚本、token 文件
4. **推** —— 云服务器上解包 → `fetch` 核对远端 → **确认是快进** → push
5. **验证** —— 通过 `api.github.com` 查远端分支的 SHA,和本地 HEAD 比对
6. **清理** —— 云服务器上的 token / 凭据文件 / bundle / 临时克隆全删;本地临时文件也删

## 手动版(想看清每一步时)

```powershell
$git = 'C:\Users\Administrator\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\cmd\git.exe'
$key = 'C:\Users\Administrator\.ssh\agent-claude-line-twin-dev'
$ssh = 'C:\Windows\System32\OpenSSH\ssh.exe'
$scp = 'C:\Windows\System32\OpenSSH\scp.exe'

# 1. bundle
& $git -C D:\line-twin bundle create C:\Users\Administrator\deploy_work\lt.bundle line-twin
# 2. 传(bundle + 服务器脚本 + token)
& $scp -i $key C:\Users\Administrator\deploy_work\lt.bundle root@119.91.145.27:/root/lt-push.bundle
& $scp -i $key .claude\skills\lt-push\scripts\push_via_cloud.sh root@119.91.145.27:/root/push_via_cloud.sh
& $scp -i $key C:\Users\Administrator\.github_token root@119.91.145.27:/root/.lt_push_token
# 3. 推
& $ssh -i $key root@119.91.145.27 "bash /root/push_via_cloud.sh"
```

## 坑(都踩过)

1. **非快进必须先拦住** —— 远端可能比你本地新(本地 `origin/xxx` 是旧的跟踪引用)。
   脚本里 `git merge-base --is-ancestor origin/$BRANCH HEAD` 判断,不是快进就**直接退出不推**,
   由人决定 rebase 还是别的。**绝不要 force push。**

2. **commit message 的 BOM** —— PowerShell 5.1 的 `Out-File -Encoding utf8` 会写 BOM,
   git 会把 BOM 当成标题的第一个字符(提交标题变成 `﻿feat(...)`)。
   用 `[IO.File]::WriteAllText($path, $msg, (New-Object Text.UTF8Encoding($false)))`。

3. **token 用完必须删** —— 云服务器上落地过的 token / `.lt_cred` 凭据文件 / bundle /
   临时克隆,推完立刻删干净(脚本第 4 步做的就是这件事,别跳过)。

4. **别用仓库文件覆盖服务器上"打过补丁"的文件** —— 2026-10-23 踩过:
   仓库里的 `docker-compose.cloud.yml` 写的是 `80:80`,而线上那台机器的 80 被 DSH caddy 占着,
   实际跑的是 `8081:80`。用仓库版覆盖 → nginx 起不来 → **网站中断**。
   上传前先 `ssh` 看一下服务器上那份长什么样,或者先把仓库改对再传。

5. **服务器上没有 `.git` 就用 bundle,别用 clone** —— 云服务器上只有 `deploy/`、`dist/` 这些
   部署文件,不是 git 仓库。`git clone <bundle>` 会报 "remote HEAD refers to nonexistent ref",
   **这是正常的**,后面 `git checkout <分支>` 就行。

6. **`git credential reject` 的语法** —— 是 `git credential reject <url>`,
   但配合 `credential.helper=store --file` 时它报的错可以忽略(`|| true`)。

7. **push 完把本地跟踪引用对齐** —— `git update-ref refs/remotes/origin/$BRANCH <sha>`,
   否则 `git status` 一直显示落后 33 个 commit(因为本机根本 fetch 不了 github.com)。

## 配套:提交规范

- commit message **UTF-8 无 BOM**,标题 ≤ 72 字符,`type(scope): 摘要`
- 一次 commit 只做一件事
- **`.env` 绝不入库**(`.gitignore` 已经挡了);要写模板就提交 `.env.example`
- 推之前先跑一遍该跑的测试(后端 `npm run build`、前端 `vue-tsc --noEmit`、edge 的 `_*_test.py`)

## 别忘了

推完之后:

- 云服务器上的 `push_via_cloud.sh`、`lt-push.bundle`、`.lt_push_token`、`.lt_cred`、`/tmp/lt-push` 全部删掉
- 本机的临时 bundle / 脚本也删掉
- `~/.github_token` 是长期 PAT,别打印到日志、别进仓库
