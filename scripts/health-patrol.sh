#!/bin/bash
PROJECT_ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG="$PROJECT_ROOT/.openclaw/tmp/health.log"
ALERTS_DIR="$PROJECT_ROOT/data/alerts"
ALERTS_FILE="$ALERTS_DIR/health-alerts.jsonl"
TS=$(date "+%Y-%m-%d %H:%M:%S")
MEM_MAX=96
ALERTS=()

# 1. 核心服务端口
for p in "8900:静态" "8911:排盘" "8912:TTS" "8913:face-ocr" "8920:api-v2" "8960:MLX-v5" "8941:face-diag" "8942:tongue-diag" "8943:eye-diag" "8944:hand-diag" "8945:vision-gw"; do
    PORT=${p%%:*}
    NAME=${p##*:}
    lsof -i :$PORT >/dev/null 2>&1 || ALERTS+=("$NAME(:$PORT) 未在监听")
done

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
for LOG_PATH in \
    "/tmp/distill-mingli-outbound.log" \
    "/tmp/distill-tcm-outbound.log" \
    "/tmp/vision-distill.log" \
    "$PROJECT_ROOT/.openclaw/tmp/distill-mingli-outbound.log"; do
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

# 输出
if [ ${#ALERTS[@]} -eq 0 ]; then
    echo "[$TS] ✅ 全部健康 · 内存 ${MEM_USED}% · v6 PID ${V6_PID:-N/A} (${V6_STAT:-N/A})" >> "$LOG"
    echo "✅ 全部健康"
    echo "  · 内存: ${MEM_USED}%"
    echo "  · v6 训练: PID ${V6_PID:-N/A} (${V6_STAT:-N/A})"
    echo "  · 端口: 8900/8911/8912/8913/8920/8960 + 8941-8945 ONNX 全部正常"
    echo "  · 视觉推理: ${VIS_STATUS}"
    exit 0
else
    echo "[$TS] ❌ ${#ALERTS[@]} 项异常" >> "$LOG"
    for a in "${ALERTS[@]}"; do
        echo "[$TS] $a" >> "$ALERTS_FILE"
        echo "  ❌ $a"
    done
    exit 1
fi
