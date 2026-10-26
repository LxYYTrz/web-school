#!/bin/bash
# ============================================================================
# 在云服务器上代推 git commit(本机到 github.com 不通,这里通)。
# 由 lt-push skill 调用;也可以手动跑。
#
# 前置(都已由调用方准备好):
#   /root/lt-push.bundle    git bundle(含要推的分支完整历史)
#   /root/.lt_push_token    GitHub PAT 文件
#   /root/push_via_cloud.sh 本脚本
#
# 做完一定清理:token / 凭据文件 / bundle / 临时克隆
# ============================================================================
# 这一段负责打包当前分支，经云服务器快进推送并验证提交与清理临时凭据，为后续代码提供当前文件的处理入口。
set -e
# 做完一定清理:token / 凭据文件 / bundle / 临时克隆。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

REPO=https://github.com/LxYYTrz/web-school.git
# 根据 https://github.com/LxYYTrz/web-school.git 设置 REPO，供当前流程后续使用。
# REPO 是本脚本设置并供后续 Shell 命令引用的变量
BRANCH=${1:-line-twin}
# 根据 ${1:-line-twin} 设置 BRANCH，供当前流程后续使用。
# BRANCH 是本脚本设置并供后续 Shell 命令引用的变量
BUNDLE=/root/lt-push.bundle
# 根据 /root/lt-push.bundle 设置 BUNDLE，供当前流程后续使用。
# BUNDLE 是本脚本设置并供后续 Shell 命令引用的变量
TOKEN=/root/.lt_push_token
# 根据 /root/.lt_push_token 设置 TOKEN，供当前流程后续使用。
# TOKEN 是本脚本设置并供后续 Shell 命令引用的变量
CRED=/root/.lt_cred
# 根据 /root/.lt_cred 设置 CRED，供当前流程后续使用。
# CRED 是本脚本设置并供后续 Shell 命令引用的变量
WORK=/tmp/lt-push
# 根据 /tmp/lt-push 设置 WORK，供当前流程后续使用。
# WORK 是本脚本设置并供后续 Shell 命令引用的变量

echo "=== 1) 解开 bundle ==="
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
rm -rf "$WORK"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# WORK 是脚本之前设置的路径、分支或执行状态变量
# 从 bundle clone 时会提示 "remote HEAD refers to nonexistent ref" —— 正常,下面自己 checkout
git clone -q "$BUNDLE" "$WORK"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# BUNDLE 是脚本之前设置的路径、分支或执行状态变量；WORK 是脚本之前设置的路径、分支或执行状态变量
cd "$WORK"
# 从 bundle clone 时会提示 "remote HEAD refers to nonexistent ref" —— 正常,下面自己 checkout。
# WORK 是脚本之前设置的路径、分支或执行状态变量
git checkout -q "$BRANCH"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# BRANCH 是脚本之前设置的路径、分支或执行状态变量
echo "本地待推: $(git rev-parse HEAD)  $(git log -1 --pretty=format:%s)"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

echo "=== 2) 核对远端(必须是快进) ==="
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
git remote set-url origin "$REPO" 2>/dev/null || git remote add origin "$REPO"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# REPO 是脚本之前设置的路径、分支或执行状态变量
TOK=$(cat "$TOKEN")
# 根据 $(cat "$TOKEN") 设置 TOK，供当前流程后续使用。
# TOKEN 是脚本之前设置的路径、分支或执行状态变量；TOK 是本脚本设置并供后续 Shell 命令引用的变量
printf 'https://LxYYTrz:%s@github.com\n' "$TOK" > "$CRED"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# TOK 是脚本之前设置的路径、分支或执行状态变量；CRED 是脚本之前设置的路径、分支或执行状态变量
chmod 600 "$CRED"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# CRED 是脚本之前设置的路径、分支或执行状态变量
git -c credential.helper="store --file $CRED" fetch -q origin "$BRANCH"
# 向指定 HTTP 接口发送请求。
# CRED 是脚本之前设置的路径、分支或执行状态变量；BRANCH 是脚本之前设置的路径、分支或执行状态变量
echo "远端: $(git rev-parse origin/$BRANCH)"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# BRANCH 是脚本之前设置的路径、分支或执行状态变量
echo "本地: $(git rev-parse HEAD)"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
if ! git merge-base --is-ancestor "origin/$BRANCH" HEAD; then
# 检查! git merge-base --is-ancestor "origin/$BRANCH" HEAD; then，按判断结果进入对应的处理分支。
# BRANCH 是脚本之前设置的路径、分支或执行状态变量
  echo "!! 不是快进(远端有本地没有的提交),**不推**。请人工处理后再来。"
  # 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
  # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
  rm -f "$CRED" "$TOKEN" "$BUNDLE"; rm -rf "$WORK"
  # 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
  # CRED 是脚本之前设置的路径、分支或执行状态变量；TOKEN 是脚本之前设置的路径、分支或执行状态变量；BUNDLE 是脚本之前设置的路径、分支或执行状态变量；WORK 是脚本之前设置的路径、分支或执行状态变量
  exit 2
  # 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
  # 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
fi
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
echo "-> 可以快进推送"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境

echo "=== 3) 推送 ==="
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
git -c credential.helper="store --file $CRED" push origin "HEAD:refs/heads/$BRANCH"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# CRED 是脚本之前设置的路径、分支或执行状态变量；BRANCH 是脚本之前设置的路径、分支或执行状态变量

echo "=== 4) 清理(凭据/token/bundle/临时克隆)==="
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
rm -f "$CRED" "$TOKEN" "$BUNDLE"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# CRED 是脚本之前设置的路径、分支或执行状态变量；TOKEN 是脚本之前设置的路径、分支或执行状态变量；BUNDLE 是脚本之前设置的路径、分支或执行状态变量
rm -rf "$WORK"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# WORK 是脚本之前设置的路径、分支或执行状态变量
echo "已清理"
# 执行脚本命令、设置变量或控制执行流程，供当前处理流程继续使用。
# 这一行使用的名称来自当前脚本的参数、前面设置的变量或运行环境
# 这一段提供了打包当前分支，经云服务器快进推送并验证提交与清理临时凭据所需的定义和处理逻辑，结果交由调用方或运行环境使用。
