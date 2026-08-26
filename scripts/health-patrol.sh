#!/bin/bash
PROJECT_ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG="$PROJECT_ROOT/.openclaw/tmp/health.log"
ALERTS_DIR="$PROJECT_ROOT/data/alerts"
ALERTS_FILE="$ALERTS_DIR/health-alerts.jsonl"
TS=$(date "+%Y-%m-%d %H:%M:%S")
MEM_MAX=96
ALERTS=()

# 1. 核心服务端口
for p in "8900:静态" "8911:排盘" "8912:TTS" "8913:face-ocr" "8920:api-v2" "8960:MLX-v5" "8941:face-diag" "8942:tongue-diag" "8943:eye-diag" "8944:hand-diag" "8945:vision-gw" "8932:tcm-agent" "8930:tcm-diagnosis"; do
    PORT=${p%%:*}
    NAME=${p##*:}
    lsof -i :$PORT >/dev/null 2>&1 || ALERTS+=("$NAME(:$PORT) 未在监听")
done

# 1a. 医学权威库在线（R119：8932 搜索端点存活验证）
if lsof -i :8932 >/dev/null 2>&1; then
    AUTH_CHECK=$(curl -s -m 5 "http://127.0.0.1:8932/api/tcm/kb/search?q=%E4%B8%AD%E5%8C%BB&limit=1" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ok','') and d.get('total_hits',0))" 2>/dev/null)
    [ -z "$AUTH_CHECK" ] || [ "$AUTH_CHECK" = "0" ] && ALERTS+=("医学权威库 8932 搜索异常（total_hits=0）")
fi

# 1b. 端口绑定安全扫描（R-2026-08-15：修真 8941-8945/8787/8931-8933 共 9 服务 0.0.0.0→127.0.0.1）
# scan-bind-exposure.sh 检测：监听 *:port 服务 + PORTS 字典漏列的 Python/Node 进程
BIND_EXPOSURE=$(bash /Users/tom/.openclaw-autoclaw/workspace/projects/_shared/scripts/scan-bind-exposure.sh 2>&1)
BIND_EXPOSURE_RC=$?
if [ $BIND_EXPOSURE_RC -ne 0 ]; then
    while IFS= read -r line; do
        echo "$line" | grep -q 'P0!' && ALERTS+=("端口暴露: $(echo "$line" | sed 's/.*P0!//;s/^ //')")
    done <<< "$BIND_EXPOSURE"
fi

# 2. launchd 异常状态
LAUNCHD_BAD=$(launchctl list 2>/dev/null | grep "mingli-baojian" | awk '$1 ~ /^-[0-9]+/' | awk '{print $3}')
[ -n "$LAUNCHD_BAD" ] && ALERTS+=("launchd 异常: $LAUNCHD_BAD")

# 3. MLX v6 训练
V6_PID=$(ps aux | grep "mlx_lm lora" | grep "mingli-sft-v6" | grep -v grep | awk '{print $2}')
V6_STAT=""
if [ -n "$V6_PID" ]; then
    V6_STAT=$(ps -o stat= -p $V6_PID 2>/dev/null | tr -d ' ')
    case "$V6_STAT" in
        SN|R|R+|RN|S|UN|U) ;;  # 正常状态
        *) ALERTS+=("v6 训练状态异常: $V6_STAT") ;;
    esac
fi

# 4. 内存
MEM_USED=$(vm_stat | awk '/Pages active/ {a=$3} /Pages wired/ {w=$3} /Pages occupied by compressor/ {c=$3} /Pages free/ {f=$3} /Pages inactive/ {i=$3} /Pages speculative/ {s=$3} END {gsub(/\./,"",a); gsub(/\./,"",w); gsub(/\./,"",c); gsub(/\./,"",f); gsub(/\./,"",i); gsub(/\./,"",s); total=a+w+c+f+i+s; if(total==0){print 0;exit}; printf "%d", (a+w+c)*100/total}')
[ "$MEM_USED" -gt "$MEM_MAX" ] && ALERTS+=("内存 ${MEM_USED}% > ${MEM_MAX}%")

# 5. MLX 推理响应
# R713: 超时 5s→15s + 重试（模型冷启动/compile 首次可达 20s，避免启动窗口误报）
MLX_RC=$(curl -s -o /dev/null -w "%{http_code}" -m 15 --retry 1 --retry-delay 2 http://localhost:8960/health)
[ "$MLX_RC" != "200" ] && ALERTS+=("MLX v5 HTTP $MLX_RC")

# 5b. 视觉推理微服务详情（face-ocr-server 8913）
# R713: 超时 3s→8s（重启后 Spotlight 索引 I/O 风暴下偶发 >3s，误报离线）
FACE_HEALTH=$(curl -s -m 8 --retry 1 --retry-delay 1 http://localhost:8913/health 2>/dev/null)
if echo "$FACE_HEALTH" | grep -q '"ok": true'; then
    ONNX_LOADED=$(echo "$FACE_HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('pillow','?'))" 2>/dev/null)
    VIS_STATUS="✓ ONNX 微服务 + PIL=$ONNX_LOADED"
else
    ALERTS+=("视觉推理 8913 离线")
    VIS_STATUS="❌ 离线"
fi

# 5c. cron 蒸馏管线日志 mtime 监控（日频 48h / 周频 8d）
# R111 更新：distill-mingli-outbound.log 已废弃（旧 cron），现行权威产出是
# mingli-tcm-daily-distill（每日 03:00）写的 server/kb/mingli-log.jsonl —— 改监控它
for LOG_PATH in \
    "/tmp/distill-tcm-outbound.log" \
    "/tmp/vision-distill.log" \
    "$PROJECT_ROOT/server/kb/mingli-log.jsonl"; do
    if [ -f "$LOG_PATH" ]; then
        LOG_AGE_HR=$(( ( $(date +%s) - $(stat -f %m "$LOG_PATH") ) / 3600 ))
        if [ "$LOG_AGE_HR" -gt 48 ]; then
            ALERTS+=("cron 日志静默 ${LOG_AGE_HR}h: $(basename "$LOG_PATH")")
        fi
    fi
done
# 周频任务单独处理（8d = 192h）
for LOG_PATH in "$PROJECT_ROOT/.openclaw/tmp/distill-feedback-loop.log"; do
    if [ -f "$LOG_PATH" ]; then
        LOG_AGE_HR=$(( ( $(date +%s) - $(stat -f %m "$LOG_PATH") ) / 3600 ))
        if [ "$LOG_AGE_HR" -gt 192 ]; then
            ALERTS+=("周频 cron 静默 ${LOG_AGE_HR}h: $(basename "$LOG_PATH")")
        fi
    fi
done

# 6. 内联 script 语法校验（R108 P1-5）
# 提取 4 项目 app/*.html 中无 src 的 <script>...</script> 块，逐个 node --check 验证
# 容错：node 不存在时跳过并提示；目录缺失/提取失败的文件跳过不误报
SCRIPT_STATUS="跳过（node 不存在）"
SCRIPT_BAD=0
SCRIPT_TOTAL=0
if command -v node >/dev/null 2>&1; then
    SCRIPTS_DIR="$PROJECT_ROOT/.openclaw/tmp/script-checks"
    mkdir -p "$SCRIPTS_DIR" 2>/dev/null || SCRIPTS_DIR="/tmp/script-checks-$$"
    # 清理上次残留（失败不留脏）
    find "$SCRIPTS_DIR" -name 'inline_*.js' -type f -delete 2>/dev/null
    PROJECTS_DIR="$(dirname "$PROJECT_ROOT")"
    for PROJ in mingli-baojian tcm-agent smart-home-family ai-vision-toolkit; do
        APP_DIR="$PROJECTS_DIR/$PROJ/app"
        [ -d "$APP_DIR" ] || { echo "  ⚠ 跳过缺失目录: $APP_DIR"; continue; }
        while IFS='|' read -r HTML_FILE TMP_FILE IDX; do
            [ -f "$TMP_FILE" ] || continue
            SCRIPT_TOTAL=$((SCRIPT_TOTAL+1))
            if ! node --check "$TMP_FILE" >/dev/null 2>&1; then
                SCRIPT_BAD=$((SCRIPT_BAD+1))
                ALERTS+=("内联script语法错误: $PROJ/app/$(basename "$HTML_FILE") #$IDX")
            fi
            rm -f "$TMP_FILE" 2>/dev/null
        done < <(python3 - "$APP_DIR" "$SCRIPTS_DIR" <<'PY'
import re, sys, os, glob
app_dir, out_dir = sys.argv[1], sys.argv[2]
pat = re.compile(r'<script\b([^>]*)>(.*?)</script>', re.S | re.I)
idx = 0
for html in sorted(glob.glob(os.path.join(app_dir, '*.html'))):
    try:
        with open(html, 'r', encoding='utf-8', errors='replace') as f:
            src = f.read()
    except Exception:
        continue
    for m in pat.finditer(src):
        attrs = m.group(1) or ''
        if re.search(r'\bsrc\s*=', attrs, re.I):
            continue  # 外部脚本（有 src）跳过
        idx += 1
        tmp = os.path.join(out_dir, 'inline_%s_%d.js' % (os.path.basename(html), idx))
        try:
            with open(tmp, 'w', encoding='utf-8') as f:
                f.write(m.group(2))
        except Exception:
            continue
        print('%s|%s|%d' % (html, tmp, idx))
PY
)
    done
    if [ "$SCRIPT_BAD" -gt 0 ]; then
        SCRIPT_STATUS="❌ ${SCRIPT_BAD} 处错误 / 共 ${SCRIPT_TOTAL} 块"
    else
        SCRIPT_STATUS="✅ ${SCRIPT_TOTAL} 块全部通过"
    fi
fi

# ===== R112 cron 蒸馏任务健康巡检：consecutiveErrors ≥3 告警 =====
CRON_JOBS_JSON="/Users/tom/.openclaw-autoclaw/cron/jobs.json"
if [ -f "$CRON_JOBS_JSON" ]; then
    BAD_CRON=$(python3 -c "
import json
try:
    data = json.load(open('$CRON_JOBS_JSON'))
    jobs = data.get('jobs', data)
    for j in jobs:
        if not j.get('enabled', True):
            continue
        errs = j.get('state', {}).get('consecutiveErrors', 0)
        if errs >= 3:
            print(f\"{j.get('name','?')} 连败{errs}次\")
except Exception:
    pass
" 2>/dev/null)
    if [ -n "$BAD_CRON" ]; then
        while IFS= read -r line; do
            [ -n "$line" ] && ALERTS+=("cron 任务连败: $line")
        done <<< "$BAD_CRON"
    fi
fi

# ===== R111 触发器巡检：kb_formal 关键触发器存在性 + hit_count NULL =====
TRIG_OK=$(sqlite3 "file:$PROJECT_ROOT/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND tbl_name='kb_formal' AND name='kb_formal_hit_count_default';" 2>/dev/null)
[ "$TRIG_OK" != "1" ] && ALERTS+=("触发器丢失: kb_formal_hit_count_default（FTS 重建可能吞掉，用 scripts/fix-fts5-unicode61.py 重跑可恢复）")
NULL_CNT=$(sqlite3 "file:$PROJECT_ROOT/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM kb_formal WHERE hit_count IS NULL;" 2>/dev/null)
[ "$NULL_CNT" != "0" ] && [ -n "$NULL_CNT" ] && ALERTS+=("kb_formal hit_count NULL: $NULL_CNT 条")

# ===== R118 KB 隔离巡检：跨项目 module 一旦出现在 mingli 正式 KB 表中 → 立即 ERROR =====
# 修真背景：2026-08-16 发现 distill-all-projects.py 误把 6 个跨项目（smart-home-family /
# epb-assistant / family-life / wechat-platform / digital-workshop / digital-ecosystem）
# 蒸馏进了 mingli 主 KB。本规则确保未来再混入时秒级告警。
# 范围限定：仅 kb_formal + formal_knowledge（正式 KB）。kb_staging 是待审核区，污染了不
# 影响检索结果，但外键约束需保留以便审计。
CROSS_MODULES="'family-life','smart-home-family','epb-assistant','wechat-platform','digital-ecosystem','digital-workshop'"
CROSS_F=$(sqlite3 "file:$PROJECT_ROOT/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM kb_formal WHERE module IN (${CROSS_MODULES});" 2>/dev/null)
CROSS_K=$(sqlite3 "file:$PROJECT_ROOT/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM formal_knowledge WHERE module IN (${CROSS_MODULES});" 2>/dev/null)
CROSS_TOTAL=$(( ${CROSS_F:-0} + ${CROSS_K:-0} ))
if [ "$CROSS_TOTAL" -gt 0 ]; then
  ALERTS+=("R118 KB 污染: mingli 主 KB 正式表出现跨项目 module ${CROSS_TOTAL} 条（kb_formal=${CROSS_F:-0} / formal_knowledge=${CROSS_K:-0}）。修真脚本 distill-all-projects.py 或运行 scripts/cleanup-outbound-20260816.sh 迁回")
fi

# R119 训练集跨项目污染（KB staging + DPO/SFT 数据集）
if [ -f "$PROJECT_ROOT/scripts/no-cross-project-tag.py" ]; then
  if ! python3 "$PROJECT_ROOT/scripts/no-cross-project-tag.py" >/dev/null 2>&1; then
    ALERTS+=("R119 训练集污染: kb_staging 或 DPO/SFT 数据集出现跨项目标签，跑 python3 scripts/no-cross-project-tag.py 查看详情")
  fi
fi

# R120 生产代码禁止引用已归档的 knowledge/yidao.db（2026-08-26 修真）
# 背景: kb_matcher.py / kb-matcher.py / kb-syndrome-infer.js 曾指向 knowledge/ 下
# 0 字节残留文件，导致视觉管线 KB 支撑自 8/16 起静默返回空。
# 规则: server/ 生产代码（.py/.js）不得出现 knowledge 目录的 yidao.db 引用；
# 一次性历史脚本（scripts/ 内且已标注 R112-ARCHIVED-REF）豁免。
STALE_DB_REFS=$(grep -rln "knowledge.{0,3}yidao" \
  "$PROJECT_ROOT/server" \
  --include="*.py" --include="*.js" 2>/dev/null | \
  grep -v "kb-management-engine" || true)
if [ -n "$STALE_DB_REFS" ]; then
  ALERTS+=("R120 断链: 生产代码仍引用 knowledge/yidao.db → $(echo "$STALE_DB_REFS" | tr '\n' ' ')。权威库唯一路径是 server/database/yidao.db")
fi

# R120b knowledge/ 目录不得残留非占位 SQLite 库（防 0 字节残留被误当数据源）
for _zero_db in "$PROJECT_ROOT"/knowledge/*.db; do
  [ -e "$_zero_db" ] || continue
  if [ -s "$_zero_db" ]; then
    ALERTS+=("R120b 违规: knowledge/ 下存在非空 SQLite 库 $_zero_db（README 规定新库一律进 server/database/）")
  fi
done

# 输出
if [ ${#ALERTS[@]} -eq 0 ]; then
    echo "[$TS] ✅ 全部健康 · 内存 ${MEM_USED}% · v6 PID ${V6_PID:-N/A} (${V6_STAT:-N/A})" >> "$LOG"
    echo "✅ 全部健康"
    echo "  · 内存: ${MEM_USED}%"
    echo "  · v6 训练: PID ${V6_PID:-N/A} (${V6_STAT:-N/A})"
    echo "  · 端口: 8900/8911/8912/8913/8920/8960 + 8941-8945 ONNX 全部正常"
    echo "  · 视觉推理: ${VIS_STATUS}"
    echo "  · 内联 script 校验: ${SCRIPT_STATUS}"
    exit 0
else
    echo "[$TS] ❌ ${#ALERTS[@]} 项异常" >> "$LOG"
    for a in "${ALERTS[@]}"; do
        echo "[$TS] $a" >> "$ALERTS_FILE"
        echo "  ❌ $a"
    done
    echo "  · 内联 script 校验: ${SCRIPT_STATUS}"
    exit 1
fi
