#!/usr/bin/env bash
# ============================================================================
# Vision 模型诊断审计 + 自动回滚 + 优化建议
# ----------------------------------------------------------------------------
# 触发：sync-vision-models-from-ai-vision-toolkit.sh 同步完成后
#       或单独 cron（每日 05:30）独立审计
# 流程：
#   1. 加载 4 个 ONNX 模型（face/tongue/eye/hand）
#   2. 合成 4 类测试图（不同色相/亮度）→ POST /api/vision/diagnose
#   3. 比对：syndrome 非空 / confidence > 阈值 / engine == 'onnx'
#   4. 写入 vision_model_audit_log（DB）
#   5. 失败 → 自动回滚到上一次成功的 backup → 报警到本地日志
#   6. 优化建议 → vision_model_audit_log.optimization_notes
# ============================================================================

set -uo pipefail

BASE="/Users/tom/kimi/projects/mingli-baojian"
MODELS_DIR="${BASE}/models"
LOG_DIR="${BASE}/logs"
AUDIT_LOG="${LOG_DIR}/vision-model-audit.log"
DB_PATH="${BASE}/server/database/yidao.db"
FACE_OCR="${FACE_OCR_BASE:-http://127.0.0.1:8913}"
API_V2="${API_V2_BASE:-http://127.0.0.1:8920}"

mkdir -p "$LOG_DIR"

log() { echo "[$(date +'%F %T')] $*" | tee -a "$AUDIT_LOG"; }
log "=== vision-model-audit 启动 ==="

# ── 0. 准备：4 类测试图生成（不同色调 → 触发不同辨证）────────────────
TEST_DIR=$(mktemp -d)
trap "rm -rf $TEST_DIR" EXIT

gen_test_images() {
  python3 - <<'PY'
import os, base64, io
from PIL import Image
d = os.environ['TEST_DIR']

cases = [
    # 舌象：红舌/黄厚苔（湿热）
    ('tongue_damp_heat', 'tongue', (175, 80, 75), (215, 215, 75)),
    # 舌象：淡白舌（阳虚）
    ('tongue_yang_def', 'tongue', (220, 215, 210), (235, 235, 230)),
    # 面诊：面色晦暗（肾虚/瘀血）
    ('face_dark',       'face',   (110, 100, 95), (130, 120, 110)),
    # 面诊：面色红赤（实热）
    ('face_red',        'face',   (200, 110, 105), (215, 130, 125)),
    # 眼诊：白睛黄染（黄疸）
    ('eye_yellow',      'eye',    (210, 195, 130), (235, 215, 155)),
    # 眼诊：眼睑浮肿（脾虚）
    ('eye_puffy',       'eye',    (220, 200, 180), (235, 220, 205)),
    # 手诊：掌色潮红（心火）
    ('hand_red',        'hand',   (210, 130, 125), (225, 150, 145)),
    # 手诊：掌色苍白（血虚）
    ('hand_pale',       'hand',   (195, 185, 175), (215, 205, 195)),
]

for name, mode, bg, fg in cases:
    img = Image.new('RGB', (320, 320), bg)
    px = img.load()
    for y in range(80, 240):
        for x in range(80, 240):
            px[x, y] = (bg[0]//2 + fg[0]//2, bg[1]//2 + fg[1]//2, bg[2]//2 + fg[2]//2)
    buf = io.BytesIO()
    img.save(buf, 'PNG')
    b64 = base64.b64encode(buf.getvalue()).decode()
    with open(os.path.join(d, f'{name}.b64'), 'w') as f:
        f.write(b64)
print(f'generated {len(cases)} test images')
PY
}

export TEST_DIR
gen_test_images || { log "❌ 测试图生成失败"; exit 1; }

# ── 1. 模型加载健康检查（vision-onnx-integration.py 的 load_model 走一遍）──
log "── 1. ONNX 模型加载健康检查 ──"
MODEL_OK=()
MODEL_FAIL=()
for mode in face tongue eye hand; do
  resp=$(curl -s --max-time 5 -X POST "${FACE_OCR}/api/${mode}/analyze" \
    -H "Content-Type: application/json" \
    -d "{\"image\":\"$(cat ${TEST_DIR}/tongue_damp_heat.b64)\",\"mode\":\"${mode}\"}" \
    2>/dev/null)
  engine=$(echo "$resp" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('engine','none'))" 2>/dev/null || echo "none")
  if [[ "$engine" == "onnx" ]]; then
    log "  ✓ ${mode} ONNX 加载成功 (engine=$engine)"
    MODEL_OK+=("$mode")
  else
    log "  ⚠️  ${mode} ONNX 未启用 (engine=$engine，可能 onnxruntime 未装)"
    MODEL_FAIL+=("$mode")
  fi
done

# ── 2. 端到端 ONNX 推理 + KB 联动审计 ─────────────────────────────────
log "── 2. 端到端诊断审计 (vision-rule-engine) ──"
declare -a AUDIT_ROWS
audit_count=0
pass_count=0
fail_count=0
syndrome_threshold=0.5   # 置信度阈值，低于此视为未识别

for case in "${TEST_DIR}"/*.b64; do
  case_name=$(basename "$case" .b64)
  mode=$(echo "$case_name" | cut -d_ -f1)  # tongue/face/eye/hand
  [[ "$mode" == "tongue" ]] && endpoint="tongue" || endpoint="face"

  b64=$(cat "$case")
  req="{\"mode\":\"$mode\",\"image_b64\":\"$b64\",\"image_quality\":{\"brightness\":1,\"sharpness\":1}}"

  resp=$(curl -s --max-time 10 -X POST "${API_V2}/api/vision/diagnose" \
    -H "Content-Type: application/json" -d "$req" 2>/dev/null)

  syndrome=$(echo "$resp" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print((d.get('diagnosis') or {}).get('syndrome',''))" 2>/dev/null || echo "")
  confidence=$(echo "$resp" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print((d.get('diagnosis') or {}).get('confidence',0))" 2>/dev/null || echo "0")
  enhanced=$(echo "$resp" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('enhanced_extracted',False))" 2>/dev/null || echo "False")

  # 判定：syndrome 非空 AND confidence ≥ 0.5
  if [[ -n "$syndrome" && "$syndrome" != "无明显异常" ]] && \
     python3 -c "import sys; sys.exit(0 if float('$confidence') >= $syndrome_threshold else 1)" 2>/dev/null; then
    status="pass"
    pass_count=$((pass_count + 1))
    log "  ✓ ${case_name} → syndrome='${syndrome}' confidence=${confidence} enhanced=${enhanced}"
  else
    status="fail"
    fail_count=$((fail_count + 1))
    log "  ✗ ${case_name} → syndrome='${syndrome}' confidence=${confidence} (低于阈值)"
  fi

  AUDIT_ROWS[$audit_count]="${case_name}|${mode}|${syndrome}|${confidence}|${enhanced}|${status}|$(date +%F\ %T)"
  audit_count=$((audit_count + 1))
done

# ── 3. 写入 vision_model_audit_log ─────────────────────────────────────
if [[ -f "$DB_PATH" ]] && command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS vision_model_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_ts TEXT DEFAULT CURRENT_TIMESTAMP,
    case_name TEXT,
    mode TEXT,
    syndrome TEXT,
    confidence REAL,
    enhanced_extracted INTEGER,
    status TEXT,
    optimization_notes TEXT
  );" 2>/dev/null

  for ((i=0; i<audit_count; i++)); do
    IFS='|' read -r cn m s c e st ts <<< "${AUDIT_ROWS[$i]}"
    sqlite3 "$DB_PATH" "INSERT INTO vision_model_audit_log
      (case_name, mode, syndrome, confidence, enhanced_extracted, status)
      VALUES ('$cn', '$m', '$s', $c, $e, '$st');" 2>/dev/null || true
  done
fi

# ── 4. 失败自动回滚 ────────────────────────────────────────────────────
if [[ $fail_count -gt 0 ]] && [[ $pass_count -lt $((audit_count * 80 / 100)) ]]; then
  log "── 4. 失败率过高 (${fail_count}/${audit_count}) → 自动回滚 ──"
  backup_dir=$(ls -td "${MODELS_DIR}/.backup_"* 2>/dev/null | head -1)
  if [[ -n "$backup_dir" && -d "$backup_dir" ]]; then
    for f in "$MODELS_DIR"/*.onnx; do
      bname=$(basename "$f")
      if [[ -f "$backup_dir/$bname" ]]; then
        cp "$backup_dir/$bname" "$f"
        log "  ↻ 已回滚 $bname"
      fi
    done
    log "  → 重启 face-ocr-server 加载回滚版本"
    launchctl kickstart -k "gui/$(id -u)/com.mingli-baojian.face-ocr" 2>&1 | tee -a "$AUDIT_LOG" || true
  else
    log "  ⚠️  无 backup 可回滚"
  fi
fi

# ── 5. 优化建议 ────────────────────────────────────────────────────────
log "── 5. 优化建议 ──"
optimization=""
if [[ ${#MODEL_FAIL[@]} -gt 0 ]]; then
  optimization="${optimization}• ONNX 模型加载失败: ${MODEL_FAIL[*]} → 安装 onnxruntime: pip install onnxruntime; "
fi
if [[ $pass_count -lt $((audit_count * 60 / 100)) ]]; then
  optimization="${optimization}• 端到端通过率 ${pass_count}/${audit_count} < 60% → 检查 vision_hsv_lbp.py 预处理与 vision-rule-engine.js 规则匹配阈值; "
fi
if [[ $audit_count -gt 0 ]]; then
  avg_conf=$(python3 -c "
import json
rows = [r.split('|') for r in '''${AUDIT_ROWS[@]}'''.strip().split('\n') if r]
confs = [float(r[3]) for r in rows if r[3].replace('.','').isdigit()]
print(round(sum(confs)/len(confs), 3) if confs else 0)
")
  if python3 -c "import sys; sys.exit(0 if float('$avg_conf') < 0.6 else 1)" 2>/dev/null; then
    optimization="${optimization}• 平均置信度 ${avg_conf} < 0.6 → 调整 vision-rule-engine.js 规则 confidence 基线或增加训练样本; "
  fi
fi
if [[ -z "$optimization" ]]; then
  optimization="• 所有模型健康，无需优化"
fi
log "  $optimization"

# 写入优化建议到最新 audit 行
if [[ -f "$DB_PATH" ]] && command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" "UPDATE vision_model_audit_log SET optimization_notes='$optimization'
    WHERE id IN (SELECT id FROM vision_model_audit_log ORDER BY id DESC LIMIT $audit_count);" 2>/dev/null || true
fi

log "=== 审计完成: pass=${pass_count} fail=${fail_count} total=${audit_count} ==="
log "=== vision-model-audit 结束 ==="

# 退出码：失败率 ≥ 20% 则非零
if [[ $((fail_count * 100 / audit_count)) -ge 20 ]]; then
  exit 1
fi
exit 0