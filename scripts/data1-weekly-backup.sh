#!/bin/bash
# data1-weekly-backup.sh — 每周全量代码备份到 data1
# 调度：launchd com.mingli-baojian.data1-backup（每周日 02:00）
# 说明：只备份源码 + 核心数据，排除 node_modules/venv/DB 变体/训练权重
# 用法：bash scripts/data1-weekly-backup.sh

set -u
LOG=/tmp/mingli-data1-backup.log
TS=$(date +%Y-%m-%d)
# 修真 2026-09-02（cron 巡检）：数据卷已从 /Volumes/data1 迁移到 /Volumes/模型训练数据/cold-storage/
# （8/30 18:42 manifest 显示，9/1 monitor-collect.py 已修真但漏了本脚本）——改为双路径自动探测
CANDIDATES=("/Volumes/模型训练数据/cold-storage" "/Volumes/data1")
DATA1=""
for c in "${CANDIDATES[@]}"; do
  if [ -d "$c" ]; then DATA1="$c"; break; fi
done
SNAP="$DATA1/code-snapshots/$TS"
WORKSPACE=/Users/tom/kimi/projects

log() { echo "[$(date '+%F %T')] $*" >> "$LOG"; }

log "=== 开始备份 ==="

# 1. 双路径都未挂载则跳过
if [ -z "$DATA1" ]; then
  log "❌ data1/cold-storage 均未挂载，跳过本次备份"
  exit 1
fi

# 1.5 TCC 权限探针（修真 2026-09-14：定时上下文可能对外置卷无写权限 Operation not permitted，失败留痕到 backup-guard.log）
GUARD="$(cd "$(dirname "$0")" && pwd)/backup-guard.sh"
if [ -f "$GUARD" ]; then
  bash "$GUARD" || { log "❌ backup-guard 探针失败（详见 workspace/memory/backup-guard.log）"; exit $?; }
fi

mkdir -p "$SNAP"

# 2. git bundle 备份（有 .git 的项目）
mkdir -p "$DATA1/code-archive"
for d in "$WORKSPACE"/*/; do
  if [ -d "$d/.git" ]; then
    name=$(basename "$d")
    git -C "$d" bundle create "$DATA1/code-archive/${name}.bundle" --all >/dev/null 2>&1 \
      && log "✅ bundle: $name" || log "⚠️ bundle 失败: $name"
  fi
done

# 3. 源码快照（rsync 排除大文件/密钥）
for d in "$WORKSPACE"/*/; do
  name=$(basename "$d")
  [ -d "$d" ] || continue
  rsync -a --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv*' \
    --exclude='server/venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='yidao.db*' \
    --exclude='ratelimit.db*' \
    --exclude='*.db-shm' \
    --exclude='*.db-wal' \
    --exclude='*.bak' \
    --exclude='*.bundle' \
    --exclude='.cache' \
    --exclude='training/models' \
    --exclude='training/mlx-models' \
    --exclude='training/mlx-checkpoints' \
    --exclude='training/logs' \
    --exclude='mlx-models' \
    --exclude='checkpoints' \
    --exclude='*.safetensors' \
    --exclude='*.gguf' \
    --exclude='*.pt' \
    --exclude='*.ckpt' \
    --exclude='/backups' \
    --exclude='/training-data' \
    --exclude='/models' \
    --exclude='*.db' \
    --exclude='server/logs' \
    --exclude='knowledge/ocr_cache' \
    --exclude='data/images' \
    --exclude='data/pdfs' \
    --exclude='data/backups' \
    --exclude='data/runtime' \
    --exclude='.lighthouseci' \
    --exclude='.backup' \
    --exclude='reports' \
    --exclude='.openclaw/secrets' \
    --exclude='.openclaw/tmp' \
    "$d/" "$SNAP/$name/" >/dev/null 2>&1 \
    && log "✅ 快照: $name" || log "⚠️ 快照失败: $name"
done

# 3.5 yidao.db 在线热备（R-WALF 教训：09-07 freelist 损坏时全库无任何周期备份，零丢失纯靠 VACUUM INTO 侥幸成功）
# sqlite3 .backup 走官方在线备份 API，对 WAL 活体库安全；排除项里的 *.db 只影响源码快照，不影响本段
DB_SRC="$WORKSPACE/mingli-baojian/server/database/yidao.db"
DB_DEST_DIR="$DATA1/db-backups"
if [ -f "$DB_SRC" ]; then
  mkdir -p "$DB_DEST_DIR"
  DB_DEST="$DB_DEST_DIR/yidao-$TS.db"
  if sqlite3 "$DB_SRC" ".backup '$DB_DEST'" 2>>"$LOG"; then
    # 备份件完整性自检，不合格即删（不留坏备份误导恢复）
    if [ "$(sqlite3 "$DB_DEST" 'PRAGMA integrity_check;' 2>/dev/null | head -1)" = "ok" ]; then
      log "✅ yidao.db 热备: $(du -h "$DB_DEST" | cut -f1) integrity=ok"
    else
      rm -f "$DB_DEST"; log "❌ yidao.db 热备 integrity 不合格，已删除"
    fi
  else
    log "⚠️ yidao.db 热备失败（.backup 非零退出）"
  fi
  # 保留最近 4 份周备（约 1 个月），BSD 兼容
  _total=$(ls "$DB_DEST_DIR"/yidao-*.db 2>/dev/null | wc -l | tr -d ' ')
  _i=0
  ls "$DB_DEST_DIR"/yidao-*.db 2>/dev/null | sort | while read old; do
    _i=$((_i+1))
    if [ "$_i" -le $((_total-4)) ]; then rm -f "$old"; log "🧹 清理过期库备: $(basename "$old")"; fi
  done
fi

# 4. workspace 根文件
rsync -a \
  --exclude='projects' --exclude='.cluster' --exclude='.openclaw' --exclude='node_modules' \
  /Users/tom/kimi/shared/legacy/AGENTS.md \
  /Users/tom/kimi/shared/legacy/SOUL.md \
  /Users/tom/kimi/shared/legacy/USER.md \
  /Users/tom/kimi/shared/legacy/TOOLS.md \
  /Users/tom/kimi/shared/legacy/MEMORY.md \
  /Users/tom/kimi/shared/legacy/IDENTITY.md \
  "$SNAP/workspace-root/" 2>/dev/null && log "✅ workspace 根文件"

# 5. 清理：保留最近 8 周快照（约 2 个月），删除更早的（BSD 兼容写法）
cd "$DATA1/code-snapshots" 2>/dev/null || exit 0
_total=$(ls -d 20* 2>/dev/null | wc -l | tr -d ' ')
_i=0
ls -d 20* 2>/dev/null | sort | while read old; do
  _i=$((_i+1))
  if [ "$_i" -le $((_total-8)) ]; then
    rm -rf "$DATA1/code-snapshots/$old"
    log "🧹 清理过期快照: $old"
  fi
done

log "=== 备份完成（$(du -sh "$SNAP" 2>/dev/null | cut -f1)）==="
