#!/bin/bash
# 指定运行这个脚本时使用的解释器。
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
set -e
# 开启 Bash 的失败即退出模式，避免前一步失败后继续推送。

REPO=https://github.com/LxYYTrz/web-school.git
# 设置 Shell 变量 REPO，供后续命令引用；等号是赋值符号。
BRANCH=${1:-line-twin}
# 设置 Shell 变量 BRANCH，供后续命令引用；等号是赋值符号。
BUNDLE=/root/lt-push.bundle
# 设置 Shell 变量 BUNDLE，供后续命令引用；等号是赋值符号。
TOKEN=/root/.lt_push_token
# 设置 Shell 变量 TOKEN，供后续命令引用；等号是赋值符号。
CRED=/root/.lt_cred
# 设置 Shell 变量 CRED，供后续命令引用；等号是赋值符号。
WORK=/tmp/lt-push
# 设置 Shell 变量 WORK，供后续命令引用；等号是赋值符号。

echo "=== 1) 解开 bundle ==="
# 把引号中的状态或结果输出到终端。
rm -rf "$WORK"
# 删除这一行指定的临时文件或工作目录。
# 从 bundle clone 时会提示 "remote HEAD refers to nonexistent ref" —— 正常,下面自己 checkout
git clone -q "$BUNDLE" "$WORK"
# 调用 Git 执行这一行的仓库或分支操作。
cd "$WORK"
# 切换到指定工作目录，再执行后续命令。
git checkout -q "$BRANCH"
# 调用 Git 执行这一行的仓库或分支操作。
echo "本地待推: $(git rev-parse HEAD)  $(git log -1 --pretty=format:%s)"
# 把引号中的状态或结果输出到终端。

echo "=== 2) 核对远端(必须是快进) ==="
# 把引号中的状态或结果输出到终端。
git remote set-url origin "$REPO" 2>/dev/null || git remote add origin "$REPO"
# 调用 Git 执行这一行的仓库或分支操作。
TOK=$(cat "$TOKEN")
# 设置 Shell 变量 TOK，供后续命令引用；等号是赋值符号。
printf 'https://LxYYTrz:%s@github.com\n' "$TOK" > "$CRED"
# 按格式输出字符串，用于写入凭据或提示。
chmod 600 "$CRED"
# 执行 Shell 命令 chmod，处理本行指定的参数。
git -c credential.helper="store --file $CRED" fetch -q origin "$BRANCH"
# 调用 Git 执行这一行的仓库或分支操作。
echo "远端: $(git rev-parse origin/$BRANCH)"
# 把引号中的状态或结果输出到终端。
echo "本地: $(git rev-parse HEAD)"
# 把引号中的状态或结果输出到终端。
if ! git merge-base --is-ancestor "origin/$BRANCH" HEAD; then
# 用 if 判断本行命令的退出状态，成立时执行后续分支。
  echo "!! 不是快进(远端有本地没有的提交),**不推**。请人工处理后再来。"
  # 把引号中的状态或结果输出到终端。
  rm -f "$CRED" "$TOKEN" "$BUNDLE"; rm -rf "$WORK"
  # 删除这一行指定的临时文件或工作目录。
  exit 2
  # 以指定状态码结束脚本；exit 是退出命令。
fi
# 结束当前 if 条件块。
echo "-> 可以快进推送"
# 把引号中的状态或结果输出到终端。

echo "=== 3) 推送 ==="
# 把引号中的状态或结果输出到终端。
git -c credential.helper="store --file $CRED" push origin "HEAD:refs/heads/$BRANCH"
# 调用 Git 执行这一行的仓库或分支操作。

echo "=== 4) 清理(凭据/token/bundle/临时克隆)==="
# 把引号中的状态或结果输出到终端。
rm -f "$CRED" "$TOKEN" "$BUNDLE"
# 删除这一行指定的临时文件或工作目录。
rm -rf "$WORK"
# 删除这一行指定的临时文件或工作目录。
echo "已清理"
# 把引号中的状态或结果输出到终端。
