#!/bin/bash
# daily-local-cold-backup.sh — R801 本地冷区备份（绕开 TCC：目标在系统盘，launchd 可写）
# 背景：外置盘 cron/launchd 全被 TCC 拒（17:44 实测 LAUNCHD-WRITE-DENIED），备份流 9/14 后断
# 策略：每日 git bundle 全项目 + KB 库 gzip；外置盘冷存同步由交互上下文定期推送
set -u
DEST="/Users/tom/.openclaw-autoclaw/backups/local-cold"
DATE=$(date +%Y-%m-%d)
LOG="$DEST/backup.log"
mkdir -p "$DEST/$DATE"
log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }
log "=== 开始本地冷备 ==="

# 1) 全项目 git bundle（有 .git 的项目）
BUNDLE_DIR="$DEST/$DATE/bundles"; mkdir -p "$BUNDLE_DIR"
for d in /Users/tom/.openclaw-autoclaw/workspace/projects/*/; do
  [ -d "$d/.git" ] || continue
  name=$(basename "$d")
  if git -C "$d" bundle create "$BUNDLE_DIR/${name}.bundle" --all >/dev/null 2>&1; then
    log "✅ bundle: $name"
  else
    log "⚠️ bundle 失败: $name"
  fi
done

# 2) KB 主库压缩（yidao.db 3.2G → gzip 约 700M）
KB_SRC="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/server/database/yidao.db"
if [ -f "$KB_SRC" ]; then
  if gzip -c "$KB_SRC" > "$DEST/$DATE/yidao-$DATE.db.gz" 2>/dev/null; then
    log "✅ KB 库: $(du -h "$DEST/$DATE/yidao-$DATE.db.gz" | cut -f1)"
  else
    log "⚠️ KB 库压缩失败"
  fi
fi

# 3) 滚动清理：保留 7 天
find "$DEST" -maxdepth 1 -type d -name "20*" -mtime +7 -exec rm -rf {} \; 2>/dev/null
log "=== 完成（滚动保留 7 天）==="
