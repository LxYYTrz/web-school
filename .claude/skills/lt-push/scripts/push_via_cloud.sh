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
set -e

REPO=https://github.com/LxYYTrz/web-school.git
BRANCH=${1:-line-twin}
BUNDLE=/root/lt-push.bundle
TOKEN=/root/.lt_push_token
CRED=/root/.lt_cred
WORK=/tmp/lt-push

echo "=== 1) 解开 bundle ==="
rm -rf "$WORK"
# 从 bundle clone 时会提示 "remote HEAD refers to nonexistent ref" —— 正常,下面自己 checkout
git clone -q "$BUNDLE" "$WORK"
cd "$WORK"
git checkout -q "$BRANCH"
echo "本地待推: $(git rev-parse HEAD)  $(git log -1 --pretty=format:%s)"

echo "=== 2) 核对远端(必须是快进) ==="
git remote set-url origin "$REPO" 2>/dev/null || git remote add origin "$REPO"
TOK=$(cat "$TOKEN")
printf 'https://LxYYTrz:%s@github.com\n' "$TOK" > "$CRED"
chmod 600 "$CRED"
git -c credential.helper="store --file $CRED" fetch -q origin "$BRANCH"
echo "远端: $(git rev-parse origin/$BRANCH)"
echo "本地: $(git rev-parse HEAD)"
if ! git merge-base --is-ancestor "origin/$BRANCH" HEAD; then
  echo "!! 不是快进(远端有本地没有的提交),**不推**。请人工处理后再来。"
  rm -f "$CRED" "$TOKEN" "$BUNDLE"; rm -rf "$WORK"
  exit 2
fi
echo "-> 可以快进推送"

echo "=== 3) 推送 ==="
git -c credential.helper="store --file $CRED" push origin "HEAD:refs/heads/$BRANCH"

echo "=== 4) 清理(凭据/token/bundle/临时克隆)==="
rm -f "$CRED" "$TOKEN" "$BUNDLE"
rm -rf "$WORK"
echo "已清理"
