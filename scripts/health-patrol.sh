#!/bin/bash
PROJECT_ROOT="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG="$PROJECT_ROOT/.openclaw/tmp/health.log"
ALERTS_DIR="$PROJECT_ROOT/data/alerts"
ALERTS_FILE="$ALERTS_DIR/health-alerts.jsonl"
TS=$(date "+%Y-%m-%d %H:%M:%S")
MEM_MAX=96
ALERTS=()

# 1. 核心服务端口
for p in "8900:静态" "8911:排盘" "8912:TTS" "8913:face-ocr" "8920:api-v2" "8950:MLX-v5"; do
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
MLX_RC=$(curl -s -o /dev/null -w "%{http_code}" -m 5 http://localhost:8950/health)
[ "$MLX_RC" != "200" ] && ALERTS+=("MLX v5 HTTP $MLX_RC")

# 6. 蒸馏 cron 日志 mtime（48h 静默告警）
NOW=$(date +%s)
CRON_STALE_LIMIT=172800  # 48h
for cf in "/tmp/distill-mingli-outbound.log" "/tmp/distill-tcm-outbound.log" "/tmp/vision-distill.log"; do
    if [ -f "$cf" ]; then
        MT=$(stat -f "%m" "$cf" 2>/dev/null)
        if [ -n "$MT" ]; then
            AGE=$((NOW - MT))
            [ $AGE -gt $CRON_STALE_LIMIT ] && ALERTS+=("$(basename $cf) ${AGE}s 未更新 > ${CRON_STALE_LIMIT}s")
        fi
    fi
done

# 输出
if [ ${#ALERTS[@]} -eq 0 ]; then
    echo "[$TS] ✅ 全部健康 · 内存 ${MEM_USED}% · v6 PID ${V6_PID:-N/A} (${V6_STAT:-N/A})" >> "$LOG"
    echo "✅ 全部健康"
    echo "  · 内存: ${MEM_USED}%"
    echo "  · v6 训练: PID ${V6_PID:-N/A} (${V6_STAT:-N/A})"
    echo "  · 端口: 8900/8911/8912/8913/8920/8950 全部正常"
    exit 0
else
    echo "[$TS] ❌ ${#ALERTS[@]} 项异常" >> "$LOG"
    for a in "${ALERTS[@]}"; do
        echo "[$TS] $a" >> "$ALERTS_FILE"
        echo "  ❌ $a"
    done
    exit 1
fi
