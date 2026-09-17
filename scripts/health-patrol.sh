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

# 1a. 医学权威库在线（R119：8932 搜索端点存活验证；R-DEBOUNCE：冷索引期 5s 超时曾 40min 内两次误报——失败时隔 8s 重试一次再告警；
# R-DEBOUNCE2：09-14 I/O 尖峰期 5s/8s 超时再抖误报（实测服务 198ms 健康返回 103484 条）——超时加固至 12s/15s）
if lsof -i :8932 >/dev/null 2>&1; then
    AUTH_PROBE='import sys,json; d=json.load(sys.stdin); print(d.get("ok","") and d.get("total_hits",0))'
    AUTH_CHECK=$(curl -s -m 12 "http://127.0.0.1:8932/api/tcm/kb/search?q=%E4%B8%AD%E5%8C%BB&limit=1" 2>/dev/null | python3 -c "$AUTH_PROBE" 2>/dev/null)
    if [ -z "$AUTH_CHECK" ] || [ "$AUTH_CHECK" = "0" ]; then
        sleep 8
        AUTH_CHECK=$(curl -s -m 15 "http://127.0.0.1:8932/api/tcm/kb/search?q=%E4%B8%AD%E5%8C%BB&limit=1" 2>/dev/null | python3 -c "$AUTH_PROBE" 2>/dev/null)
    fi
    [ -z "$AUTH_CHECK" ] || [ "$AUTH_CHECK" = "0" ] && ALERTS+=("医学权威库 8932 搜索异常（重试后仍 total_hits=${AUTH_CHECK:-空}）")
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

# 2a. 备份快照健康（R-2026-09-14：快照/周备连报 Operation not permitted 一个月，失败静默跳过无人发现）
# 检查两类痕迹：backup-guard.log 近 48h 内的 TCC-LOCKED / VOLUME-MISSING，以及快照日志连续失败
GUARD_LOG="$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log"
if [ -f "$GUARD_LOG" ]; then
    GUARD_HIT=$(find "$GUARD_LOG" -mtime -2 2>/dev/null | wc -l | tr -d ' ')
    # 2026-09-15 修真：只统计真实的 TCC-LOCKED / VOLUME-MISSING 行，
    # RECOVERED 行是自愈痕迹不算告警；且只在存在新鲜失败行时才报
    # 2026-09-17 修真：grep -c 无匹配时输出 0 且退出码 1，`|| echo 0` 会追加第二个 0
    # 导致 GUARD_FAILS="0\n0" 触发 integer expression error——改为固定输出单值
    GUARD_FAILS=$(grep -c "TCC-LOCKED\|VOLUME-MISSING" "$GUARD_LOG" 2>/dev/null; true)
    GUARD_LAST_FAIL=$(grep "TCC-LOCKED\|VOLUME-MISSING" "$GUARD_LOG" 2>/dev/null | tail -1)
    if [ "$GUARD_FAILS" -gt 0 ] && [ "$GUARD_HIT" -gt 0 ]; then
        ALERTS+=("备份守卫告警: $GUARD_LAST_FAIL")
    fi
fi
SNAP_LOG="$HOME/.openclaw-autoclaw/workspace/memory/snapshot-cron.log"
if [ -f "$SNAP_LOG" ]; then
    SNAP_MTIME=$(stat -f %m "$SNAP_LOG" 2>/dev/null || echo 0)
    NOW_EPOCH=$(date +%s)
    if [ $((NOW_EPOCH - SNAP_MTIME)) -gt 172800 ]; then
        ALERTS+=("源码快照日志 48h 未更新（快照任务可能未跑或静默失败）")
    fi
fi

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
# R111 更新：distill-mingli-outbound.log 已废弃（旧 cron）；
# R-PATROL-FIX2 再更新：mingli-tcm-daily-distill 已停用（jobs.json enabled=false），
# 其产物 server/kb/mingli-log.jsonl 自 08-26 停更——监控死写入方导致静默误报 137h。
# R-PATROL-FIX3 三更新：kb-web-distill.py 系僵尸脚本（指向 0 字节归档库、无任何任务引用，
# 09-14 已归档 scripts-legacy/），其旧产物监控再次制造 103h 静默误报。
# 现行权威日频产出为 exports/distill-outbound/mingli-full-*.json
# （distill-mingli-outbound launchd 任务每日 03:00 产出，family 知识通道真产出，09-14 已验证），
# 改监控该目录最新文件 mtime。
LATEST_DISTILL=$(ls -t "$PROJECT_ROOT"/exports/distill-outbound/mingli-full-*.json 2>/dev/null | head -1)
for LOG_PATH in \
    "/tmp/distill-tcm-outbound.log" \
    "/tmp/vision-distill.log" \
    $LATEST_DISTILL; do
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
import json, time
try:
    data = json.load(open('$CRON_JOBS_JSON'))
    jobs = data.get('jobs', data)
    now_ms = time.time() * 1000
    FRESH_MS = 48 * 3600 * 1000  # R749 修真：48h 内有真实复跑失败的才算新鲜连败
    stale = []
    for j in jobs:
        if not j.get('enabled', True):
            continue
        st = j.get('state', {})
        errs = st.get('consecutiveErrors', 0)
        if errs < 3:
            continue
        last_ms = st.get('lastRunAtMs') or 0
        if st.get('lastRunStatus') == 'error' and (now_ms - last_ms) <= FRESH_MS:
            print(f\"{j.get('name','?')} 连败{errs}次\")
        else:
            stale.append(f\"{j.get('name','?')} 连败{errs}次（陈旧·待复跑清零）\")
    if stale:
        print('STALE|' + '；'.join(stale), file=__import__('sys').stderr)
except Exception:
    pass
" 2>/tmp/patrol-stale-cron.txt)
    if [ -s /tmp/patrol-stale-cron.txt ]; then
        echo "[$TS] ℹ️ $(sed 's/^STALE|//' /tmp/patrol-stale-cron.txt)" >> "$LOG"
    fi
    if [ -n "$BAD_CRON" ]; then
        while IFS= read -r line; do
            [ -n "$line" ] && ALERTS+=("cron 任务连败: $line")
        done <<< "$BAD_CRON"
    fi
fi

# ===== R793 KB 质量红线巡检（2026-09-17）：五红线检测，详 docs/KB-QUALITY-RULES.md =====
KBQ_OUT=$(python3 "$PROJECT_ROOT/scripts/kb-quality-patrol.py" 2>/dev/null)
if [ $? -ne 0 ] && [ -n "$KBQ_OUT" ]; then
    while IFS= read -r line; do
        echo "$line" | grep -q '^WARN' && ALERTS+=("$(echo "$line" | sed 's/^WARN //')")
    done <<< "$KBQ_OUT"
fi

# ===== R-DIFF-SLA 差集吸收 72h SLA：链5 新差集 72h 内须定性，超时告警上盘 =====
DIFF_SLA_OUT=$(python3 "$PROJECT_ROOT/scripts/diff-sla-track.py" 2>/dev/null)
if [ -n "$DIFF_SLA_OUT" ]; then
    while IFS= read -r line; do
        echo "$line" | grep -q '^WARN' && ALERTS+=("$(echo "$line" | sed 's/^WARN //')")
    done <<< "$DIFF_SLA_OUT"
fi

# ===== R-VSYNC 视觉模型同步审计（2026-09-06 新增，接 launchd com.mingli-baojian.vision-model-sync）=====
# 背景：原 cron agentTurn 版 120s 超时连败（agent 开销非脚本开销），已迁 launchd 纯脚本 6h。
# 本规则承接原 agent 的判定职责：最新 sync 报告 audit_failed>0 即告警。
VSYNC_REPORT=$(ls -t "$PROJECT_ROOT"/reports/sync-*.json 2>/dev/null | head -1)
if [ -n "$VSYNC_REPORT" ]; then
  VSYNC_BAD=$(python3 -c "import json; print(json.load(open('$VSYNC_REPORT')).get('audit_failed', 0))" 2>/dev/null)
  [ "$VSYNC_BAD" != "0" ] && [ -n "$VSYNC_BAD" ] && ALERTS+=("视觉模型同步审计失败 $VSYNC_BAD 项: $(basename "$VSYNC_REPORT")")
fi

# ===== R-CHAIN5 tcm 链条健康：末次退出码 + 差集状态新鲜度（2026-09-06 新增）=====
# 背景：09-03 tcm-capability-diff.py 引入 3.10 语法崩退，链条以 /usr/bin/python3(3.9) 运行
# 每次静默失败，差集停摆 3 天无人知。双保险：退出码非零即警 + 状态超 1h 未更新即警。
TCM_EXIT=$(launchctl print "gui/$(id -u)/com.mingli-baojian.tcm-import" 2>/dev/null | grep "last exit code" | awk '{print $NF}')
[ -n "$TCM_EXIT" ] && [ "$TCM_EXIT" != "0" ] && [ "$TCM_EXIT" != "exited)" ] && ALERTS+=("tcm-import 链条末次退出码 $TCM_EXIT（某环节崩退，查 /tmp/tcm-import.log）")
DIFF_STATE_MTIME=$(stat -f '%m' "$PROJECT_ROOT/medical-stack/capability-diff-state.json" 2>/dev/null || echo 0)
DIFF_STATE_AGE=$(( $(date +%s) - DIFF_STATE_MTIME ))
[ "$DIFF_STATE_AGE" -gt 3600 ] && ALERTS+=("差集状态超 1h 未更新（链5 疑似停摆，上轮崩退 3 天无人知）")

# ===== R-WALF WAL 裂脑检测（2026-08-31 事故守卫，09-05 升级自动收敛）=====
# 背景：R772 按请求开关写连接触发 SQLite 末连接语义删除/重建 -wal/-shm，
# 主句柄持续写入失链孤儿 WAL（磁盘不可见、重启即丢）。根修后本规则兜底：
# 主 API 进程持有的 yidao.db-wal fd inode 与磁盘文件 inode 不一致即告警。
# 09-05 升级：检出即自动收敛（kickstart api-v2，R-WALF 既定处置动作）+ 每次巡检记录 wal inode 时间线
# （logs/wal-watch.jsonl），复发时可按时间戳对撞 launchd 任务日志定位 unlink 方。
API_PID=$(pgrep -f 'api-server-v2.js' | head -1)
if [ -n "$API_PID" ]; then
  DISK_WAL_INODE=$(stat -f '%i' "$PROJECT_ROOT/server/database/yidao.db-wal" 2>/dev/null || echo MISSING)
  HELD_BAD=$(lsof -p "$API_PID" 2>/dev/null | awk '/yidao\.db-wal/ && $4 ~ /u$/ {print $8}' | sort -u | grep -v "^${DISK_WAL_INODE}$" | head -1)
  echo "{\"ts\":\"$TS\",\"pid\":$API_PID,\"disk_wal\":\"$DISK_WAL_INODE\",\"held_bad\":\"${HELD_BAD:-}\"}" >> "$PROJECT_ROOT/logs/wal-watch.jsonl"
  if [ -n "$HELD_BAD" ]; then
    echo "[$TS] ⚠️ WAL裂脑检出: pid=$API_PID held=$HELD_BAD disk=$DISK_WAL_INODE → 自动收敛(kickstart api-v2)" >> "$LOG"
    launchctl kickstart -k "gui/$(id -u)/com.mingli-baojian.api-v2" 2>/dev/null
    sleep 6
    NEW_PID=$(pgrep -f 'api-server-v2.js' | head -1)
    NEW_DISK=$(stat -f '%i' "$PROJECT_ROOT/server/database/yidao.db-wal" 2>/dev/null || echo MISSING)
    NEW_BAD=""
    [ -n "$NEW_PID" ] && NEW_BAD=$(lsof -p "$NEW_PID" 2>/dev/null | awk '/yidao\.db-wal/ && $4 ~ /u$/ {print $8}' | sort -u | grep -v "^${NEW_DISK}$" | head -1)
    if [ -n "$NEW_BAD" ]; then
      ALERTS+=("WAL裂脑: 自动收敛后仍失链 pid=$NEW_PID held=$NEW_BAD disk=$NEW_DISK → 需人工介入（暂停写入类 launchd 任务排查 unlink 方）")
    else
      echo "[$TS] ✅ WAL裂脑自动收敛成功: 新 pid=$NEW_PID wal inode 一致" >> "$LOG"
      echo "  · WAL裂脑: 已自动收敛（旧 pid=$API_PID → 新 pid=$NEW_PID）"
    fi
  fi
fi

# ===== R-MCC 月度互查退出码（2026-09-07 新增，接 launchd monthly-cross-check 每月 2 日 09:17）=====
MCC_EXIT=$(launchctl print "gui/$(id -u)/com.mingli-baojian.monthly-cross-check" 2>/dev/null | grep "last exit code" | awk '{print $NF}')
[ -n "$MCC_EXIT" ] && [ "$MCC_EXIT" != "0" ] && [ "$MCC_EXIT" != "exited)" ] && ALERTS+=("月度互查末轮 FAIL（exit $MCC_EXIT，详件 DELIVERY/monthly-cross-check-*.json + logs/monthly-cross-check.log）")

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

# G22 能力漂移巡检（mingli→family 能力包：部署版落后告警 WARN / 同版内容漂移告警 ERROR）
DRIFT_OUT=$(node "$PROJECT_ROOT/scripts/capability-drift-check.js" 2>&1)
DRIFT_CODE=$?
if [ $DRIFT_CODE -eq 1 ]; then
  ALERTS+=("G22 能力漂移: $(echo "$DRIFT_OUT" | grep '❌' | head -2 | tr '\n' ' ')→ 详件 DELIVERY/capability-drift-latest.json")
elif [ $DRIFT_CODE -eq 2 ]; then
  echo "[$TS] ⚠️ 能力版本待接收: $(echo "$DRIFT_OUT" | grep '⚠️' | head -1)" >> "$LOG"
fi

# ===== R-G24GUARD 参考域泄漏巡检（2026-09-07 新增，防线本体=g24-reference-guard.py 触发器）=====
# 背景：staging→formal promote（INSERT OR REPLACE）绕过 G24 一次性打标，63 条医学条目漏标。
# 触发器已自动补标，本规则兜底：泄漏 >0 即告警（触发器被 FTS 重建吞掉等意外时能发现）。
REF_LEAK=$(sqlite3 "file:$PROJECT_ROOT/server/database/yidao.db?mode=ro" "SELECT COUNT(*) FROM kb_formal WHERE (module LIKE 'tcm%' OR module IN ('nihaisha-tcm','huangdi-neijing','shanghan-lun','yizong-jinjian','jingyue','bencao-gangmu','shennong-bencao','nihaisha_pcs','nihaisha-pcs','nihaisha-structured')) AND (fingerprint IS NULL OR fingerprint NOT LIKE 'TCMFWD|%') AND (domain IS NULL OR domain != 'reference');" 2>/dev/null)
[ "$REF_LEAK" != "0" ] && [ -n "$REF_LEAK" ] && ALERTS+=("G24 参考域泄漏: $REF_LEAK 条医学条目未标 reference（跑 python3 scripts/g24-reference-guard.py 补标）")

# ===== R-WALK-API 前端 API 基址门禁（2026-09-07 新增）=====
# 背景：五中心走查发现 13 页同源落空暗病——`API=''` 或裸 fetch('/api/…') 打 8900 静态口
# 必 404，页面静默降级为空态（kb-browser 总览全 0、master-workstation 实时通道全灭等均因此）。
# 规则：app/*.html 禁止 ①API 基址空字符串静态赋值 ②裸 '/api/' 相对路径 fetch/XHR（注释行除外）。
# 标准基址写法：(location.hostname==='127.0.0.1'||location.hostname==='localhost')?'http://127.0.0.1:8920':''
# 例外：确实需要同源 /api 的页面（如将来反向代理部署），列入 scripts/.patrol-api-base-allowlist 并注明理由。
API_BASE_ALLOW=""
[ -f "$PROJECT_ROOT/scripts/.patrol-api-base-allowlist" ] && API_BASE_ALLOW=$(grep -v '^#' "$PROJECT_ROOT/scripts/.patrol-api-base-allowlist" | tr '\n' ' ')
API_BASE_BAD=""
while IFS= read -r -d '' f; do
  rel=$(basename "$f")
  case " $API_BASE_ALLOW " in *" $rel "*) continue;; esac
  if grep -qE "(var|const|let) +API *= *['\"]{2} *;?\s*(//.*)?$" "$f"; then
    API_BASE_BAD="$API_BASE_BAD $rel(空基址)"
    continue
  fi
  if grep -vE "^\s*//" "$f" | grep -qE "(fetch|\.open)\(['\"\`]/api/"; then
    API_BASE_BAD="$API_BASE_BAD $rel(裸/api)"
  fi
done < <(find "$PROJECT_ROOT/app" -maxdepth 1 -name '*.html' -print0 2>/dev/null)
[ -n "$API_BASE_BAD" ] && ALERTS+=("R-WALK-API 基址同源落空:$API_BASE_BAD → 注入 127.0.0.1→8920 标准基址或加白名单")

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
    # R-NOTIFY 桌面通知（2026-09-07 新增）：告警只落文件=无人看（health-alerts.jsonl 积压 9,067 行的教训）
    # 去抖：告警集合指纹不变且 6h 内已通知 → 不重复打扰；指纹变化（新增/消失异常）立即通知
    NOTIFY_STATE="$ALERTS_DIR/.notify-state"
    ALERT_FP=$(printf '%s\n' "${ALERTS[@]}" | shasum | awk '{print $1}')
    NOW_EPOCH=$(date +%s)
    LAST_FP=""; LAST_TS=0
    [ -f "$NOTIFY_STATE" ] && { LAST_FP=$(awk '{print $1}' "$NOTIFY_STATE"); LAST_TS=$(awk '{print $2}' "$NOTIFY_STATE"); }
    if [ "$ALERT_FP" != "$LAST_FP" ] || [ $((NOW_EPOCH - LAST_TS)) -gt 21600 ]; then
        NOTIFY_BODY=$(printf '%s；' "${ALERTS[@]}" | tr '"' "'" | head -c 180)
        osascript -e "display notification \"$NOTIFY_BODY\" with title \"命理宝鉴巡检 · ${#ALERTS[@]} 项异常\" sound name \"Frog\"" 2>/dev/null
        echo "$ALERT_FP $NOW_EPOCH" > "$NOTIFY_STATE"
    fi
    exit 1
fi
