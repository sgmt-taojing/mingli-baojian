#!/bin/bash
# daily-local-cold-backup.sh — R801 本地冷区备份（绕开 TCC：目标在系统盘，launchd 可写）
# 背景：外置盘 cron/launchd 全被 TCC 拒（17:44 实测 LAUNCHD-WRITE-DENIED），备份流 9/14 后断
# 策略：每日 git bundle 全项目 + KB 库 gzip；外置盘冷存同步由交互上下文定期推送
set -u
DEST="/Volumes/模型训练数据/cold-storage/local-cold"
DATE=$(date +%Y-%m-%d)
LOG="$DEST/backup.log"
mkdir -p "$DEST/$DATE"
log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }
log "=== 开始本地冷备 ==="

# 1) 全项目 git bundle（有 .git 的项目）
BUNDLE_DIR="$DEST/$DATE/bundles"; mkdir -p "$BUNDLE_DIR"
for d in /Users/tom/kimi/projects/*/; do
  [ -d "$d/.git" ] || continue
  name=$(basename "$d")
  if git -C "$d" bundle create "$BUNDLE_DIR/${name}.bundle" --all >/dev/null 2>&1; then
    log "✅ bundle: $name"
  else
    log "⚠️ bundle 失败: $name"
  fi
done

# 2) KB 主库压缩（yidao.db 3.2G → gzip 约 700M）
KB_SRC="/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db"
if [ -f "$KB_SRC" ]; then
  if gzip -c "$KB_SRC" > "$DEST/$DATE/yidao-$DATE.db.gz" 2>/dev/null; then
    log "✅ KB 库: $(du -h "$DEST/$DATE/yidao-$DATE.db.gz" | cut -f1)"
  else
    log "⚠️ KB 库压缩失败"
  fi
fi

# 3) 日清纪律（2026-09-26 用户指令「每天用完后要么删除要么迁移，别无限增加」）：
#    本地只留今天+昨天（约 10G 封顶）；TCC 禁止 launchd 写外置盘（09-26 两次实测，含符号链接穿透），
#    更老档由 Kimi Work 每周迁移任务推外置盘「归档/autoclaw-cold」后清源。
#    ⚠️ 禁止把 DEST 符号链接到外置盘——launchd 写不进去，备份会全败（09-26 已演习）。
KEEP_FROM=$(date -v-1d +%Y-%m-%d)  # 昨天 00:00 起保留
for d in "$DEST"/20*; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  [[ "$name" < "$KEEP_FROM" ]] && rm -rf "$d" && log "🧹 日清删除老档: $name"
done
log "=== 完成（本地只留今天+昨天）==="
