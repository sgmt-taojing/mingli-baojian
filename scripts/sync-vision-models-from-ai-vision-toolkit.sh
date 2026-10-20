#!/usr/bin/env bash
# ============================================================================
# Sync TCM visual diagnosis models from ai-vision-toolkit to mingli-baojian
# ----------------------------------------------------------------------------
# 源：(ai-vision-toolkit)  ~/kimi/projects/ai-vision-toolkit/models/
# 目标：(mingli-baojian)    ~/kimi/projects/mingli-baojian/models/
# 同步：4 个 TCM 诊疗视觉算法
#   ALG-070 舌象识别   tcm-tongue-classifier.onnx
#   ALG-071 面色识别   tcm-face-color-classifier.onnx
#   ALG-072 眼诊识别   tcm-eye-diag-classifier.onnx
#   ALG-080 手诊识别   tcm-hand-palm-classifier.onnx
# 同步策略：
#   1. 比对 MD5，若相同 → skip
#   2. 若不同 → 备份原文件 → 复制新文件 → 记录元数据
#   3. 写入 sync_runs 表留痕
# 配套 cron:
#   com.mingli-baojian.vision-model-sync.plist（每日 04:30）
# ============================================================================

set -euo pipefail

SRC_BASE="/Users/tom/kimi/projects/ai-vision-toolkit"
DST_BASE="/Users/tom/kimi/projects/mingli-baojian"
SRC_MODELS="${SRC_BASE}/models"
DST_MODELS="${DST_BASE}/models"
META_LOG="${DST_BASE}/logs/vision-model-sync.log"
LOCK_FILE="${DST_BASE}/logs/.vision-model-sync.lock"
DB_PATH="${DST_BASE}/server/database/yidao.db"

mkdir -p "$(dirname "$META_LOG")"

# ── 分布式锁（防止上次未跑完）──────────────────────────────────────────
if [[ -f "$LOCK_FILE" ]]; then
  pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    echo "[$(date +'%F %T')] 上次同步仍在运行 (pid=$pid)，跳过" >> "$META_LOG"
    exit 0
  fi
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

log() {
  echo "[$(date +'%F %T')] $*" | tee -a "$META_LOG"
}

log "=== vision-model-sync 启动 ==="
log "源: $SRC_MODELS"
log "目标: $DST_MODELS"

# ── 算法清单 ────────────────────────────────────────────────────────────
declare -a ALGS=(
  "ALG-070|tcm-tongue-classifier.onnx|舌象识别"
  "ALG-071|tcm-face-color-classifier.onnx|面色识别"
  "ALG-072|tcm-eye-diag-classifier.onnx|眼诊识别"
  "ALG-080|tcm-hand-palm-classifier.onnx|手诊识别"
)

sync_count=0
skip_count=0
fail_count=0
sync_rows=()
sync_rows_count=0

for line in "${ALGS[@]}"; do
  IFS='|' read -r alg_id filename desc <<< "$line"
  src_path="${SRC_MODELS}/${filename}"
  dst_path="${DST_MODELS}/${filename}"

  if [[ ! -f "$src_path" ]]; then
    log "  ⚠️  $alg_id ($desc) 源文件不存在: $src_path"
    fail_count=$((fail_count + 1))
    continue
  fi

  # 计算校验
  src_md5=$(md5 -q "$src_path" 2>/dev/null || md5sum "$src_path" | awk '{print $1}')
  src_size=$(stat -f %z "$src_path" 2>/dev/null || stat -c %s "$src_path")

  if [[ -f "$dst_path" ]]; then
    dst_md5=$(md5 -q "$dst_path" 2>/dev/null || md5sum "$dst_path" | awk '{print $1}')
    if [[ "$src_md5" == "$dst_md5" ]]; then
      log "  ⊝ $alg_id ($desc) 无变化 (md5=$src_md5)，跳过"
      skip_count=$((skip_count + 1))
    else
      # 备份旧版本
      backup="${DST_MODELS}/${filename}.bak.$(date +%Y%m%d_%H%M%S)"
      cp "$dst_path" "$backup"
      log "  ↻ $alg_id ($desc) 旧版本已备份: $(basename $backup)"

      # 复制新模型
      if cp "$src_path" "$dst_path"; then
        log "  ✓ $alg_id ($desc) 已同步 ($src_size bytes, md5=$src_md5)"
        sync_count=$((sync_count + 1))
        sync_rows[${sync_rows_count}]="$alg_id|$filename|$desc|$src_md5|$src_size|$(date +%F\ %T)"
        sync_rows_count=$((sync_rows_count + 1))
      else
        log "  ✗ $alg_id ($desc) 复制失败"
        fail_count=$((fail_count + 1))
      fi
    fi
  else
    # 首次同步，无旧版本
    if cp "$src_path" "$dst_path"; then
      log "  ✓ $alg_id ($desc) 已同步 ($src_size bytes, md5=$src_md5)"
      sync_count=$((sync_count + 1))
      sync_rows[${sync_rows_count}]="$alg_id|$filename|$desc|$src_md5|$src_size|$(date +%F\ %T)"
      sync_rows_count=$((sync_rows_count + 1))
    else
      log "  ✗ $alg_id ($desc) 复制失败"
      fail_count=$((fail_count + 1))
    fi
  fi

  # ── 同步双命名版本（带下划线的别名）保证 8 个 onnx 文件都更新 ──
  alt_filename="${filename//-/_}"
  alt_dst="${DST_MODELS}/${alt_filename}"
  if [[ "$alt_filename" != "$filename" ]]; then
    if [[ ! -f "$alt_dst" ]] || \
       [[ "$(md5 -q "$alt_dst" 2>/dev/null)" != "$src_md5" ]]; then
      cp "$src_path" "$alt_dst"
      log "  ↳ 别名同步: $alt_filename"
    fi
  fi
done

# ── 写入 sync_runs 留痕 ────────────────────────────────────────────────
if [[ -f "$DB_PATH" ]] && command -v sqlite3 >/dev/null 2>&1; then
  # 1. 确保 sync_runs 表存在
  sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS vision_model_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_ts TEXT DEFAULT CURRENT_TIMESTAMP,
    src_path TEXT,
    dst_path TEXT,
    algorithm_id TEXT,
    filename TEXT,
    description TEXT,
    size_bytes INTEGER,
    md5 TEXT,
    action TEXT,
    status TEXT
  );" 2>/dev/null || log "  ⚠️  sqlite3 初始化表失败（继续）"

  for ((i=0; i<sync_rows_count; i++)); do
    row="${sync_rows[$i]}"
    IFS='|' read -r alg_id filename desc md5 size ts <<< "$row"
    sqlite3 "$DB_PATH" "INSERT INTO vision_model_sync_log
      (src_path, dst_path, algorithm_id, filename, description, size_bytes, md5, action, status)
      VALUES ('${SRC_MODELS}/${filename}', '${DST_MODELS}/${filename}',
              '${alg_id}', '${filename}', '${desc}', ${size}, '${md5}', 'sync', 'ok');" 2>/dev/null || true
  done
  log "  → 同步记录已写入 vision_model_sync_log"
else
  log "  ⚠️  DB 路径不存在或 sqlite3 不可用，仅记录日志"
fi

# ── 综合报告 ────────────────────────────────────────────────────────────
LOG_TOTAL_PROCESS=$((sync_count + skip_count + fail_count))
log "=== 同步完成: 同步 $sync_count / 跳过 $skip_count / 失败 $fail_count / 总计 $LOG_TOTAL_PROCESS ==="

# ── 重启 face-ocr-server（仅在有同步时）────────────────────────────────
if [[ $sync_count -gt 0 ]]; then
  PLIST="/Users/tom/Library/LaunchAgents/com.mingli-baojian.face-ocr.plist"
  if [[ -f "$PLIST" ]]; then
    log "  → 重启 face-ocr-server 加载新模型"
    launchctl kickstart -k "gui/$(id -u)/com.mingli-baojian.face-ocr" 2>&1 | tee -a "$META_LOG" || log "  ⚠️  restart 失败"
    sleep 3  # 等 server 起来
  fi
fi

# ── 同步完成 → 触发诊断审计（仅在有同步/或首跑时）────────────────────
log "── 同步阶段完成，启动诊断审计 ──"
AUDIT_SCRIPT="${DST_BASE}/scripts/vision-model-audit.sh"
if [[ -x "$AUDIT_SCRIPT" ]]; then
  if "$AUDIT_SCRIPT" >> "$META_LOG" 2>&1; then
    log "  ✓ 诊断审计通过"
  else
    log "  ⚠️  诊断审计有失败项，已自动回滚/记录，详情见 vision-model-audit.log"
  fi
else
  log "  ⚠️  诊断脚本不存在: $AUDIT_SCRIPT"
fi

log "=== vision-model-sync 结束 ==="
echo "" >> "$META_LOG"

# 退出码：失败数 > 0 则 1
[[ $fail_count -gt 0 ]] && exit 1 || exit 0
