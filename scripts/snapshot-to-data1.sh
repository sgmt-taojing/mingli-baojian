#!/bin/bash
# 每日源码快照到 data1（防 GitHub 无后端源码风险）
# 用法：bash scripts/snapshot-to-data1.sh [项目路径] [目标目录]
set -e
PROJECT="${1:-/Users/tom/kimi/projects/mingli-baojian}"
DEST="${2:-/Volumes/模型训练数据/cold-storage/code-snapshots}"
DATE=$(date +%Y-%m-%d)
TARGET="$DEST/$DATE/mingli-baojian"

# 检查 data1 挂载（修真 2026-09-14：cron/launchd 上下文可能 TCC 无写权限，失败必须留痕，禁止静默跳过）
GUARD="$(cd "$(dirname "$0")" && pwd)/backup-guard.sh"
if [ -f "$GUARD" ]; then
  bash "$GUARD" || exit $?
fi
if [ ! -d "$DEST" ]; then
  echo "❌ data1 未挂载，跳过快照（已记录 backup-guard.log）"
  exit 1
fi

mkdir -p "$TARGET"
echo "📸 快照到 $TARGET ..."

# 源码文件（排除大文件/运行时）
rsync -a --delete \
  --include="*/" \
  --include="*.js" --include="*.py" --include="*.sh" --include="*.json" --include="*.yaml" --include="*.yml" \
  --include="*.md" --include="*.html" --include="*.css" --include="*.plist" \
  --exclude="*" \
  "$PROJECT/server/" "$TARGET/server/" 2>/dev/null || true
rsync -a --delete \
  --include="*/" \
  --include="*.js" --include="*.py" --include="*.sh" --include="*.json" --include="*.yaml" --include="*.yml" \
  --include="*.md" --include="*.plist" \
  --exclude="*" \
  "$PROJECT/scripts/" "$TARGET/scripts/" 2>/dev/null || true
rsync -a \
  --include="*/" \
  --include="*.js" --include="*.json" --include="*.html" --include="*.css" \
  --exclude="*" \
  "$PROJECT/app/i18n/" "$TARGET/app-i18n/" 2>/dev/null || true
rsync -a --include="*/" --include="*.yaml" --include="*.json" --exclude="*" "$PROJECT/training/" "$TARGET/training/" 2>/dev/null || true

# git bundle（完整历史）
cd "$PROJECT"
git bundle create "$TARGET/../mingli-baojian-$(date +%H%M).bundle" --all 2>/dev/null || true
cd "$PROJECT/server" && git bundle create "$TARGET/../server-$(date +%H%M).bundle" --all 2>/dev/null || true
cd "$PROJECT/scripts" && git bundle create "$TARGET/../scripts-$(date +%H%M).bundle" --all 2>/dev/null || true

echo "✅ 快照完成: $(ls "$TARGET" | wc -l) 目录"
