#!/bin/bash
# push-to-github.sh — 命理宝鉴推送到 GitHub
# 使用方式：
#   1. 在 GitHub 创建空仓库：https://github.com/new 仓库名 mingli-baojian
#   2. 在 https://github.com/settings/tokens 创建 Personal Access Token (classic)，勾选 repo 权限
#   3. 运行此脚本：bash push-to-github.sh <你的GitHub用户名> <你的Token>

set -e

USERNAME=${1:?"用法: bash push-to-github.sh <GitHub用户名> <Token>"}
TOKEN=${2:?"请提供 GitHub Personal Access Token"}

REPO_NAME="mingli-baojian"
REMOTE_URL="https://${USERNAME}:${TOKEN}@github.com/${USERNAME}/${REPO_NAME}.git"

cd "$(dirname "$0")"

echo "🔗 添加远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

echo "📤 推送到 GitHub..."
git push -u origin main

echo ""
echo "✅ 推送成功！"
echo "📦 仓库地址: https://github.com/${USERNAME}/${REPO_NAME}"
echo ""
echo "⚠️  安全提示：推送完成后建议移除带 token 的 remote URL："
echo "   git remote set-url origin https://github.com/${USERNAME}/${REPO_NAME}.git"
