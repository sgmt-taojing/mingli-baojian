#!/bin/bash
# weekly-eval.sh · 周一 06:00 跑三件套评估 + 反馈聚合 + 合规扫描 + HTML 周报
# cron: 0 6 * * 1 bash /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/scripts/weekly-eval.sh

set -euo pipefail
PROJECT_DIR=/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian
cd "$PROJECT_DIR"

WEEK_ID=$(date +%Y-W%V)
TS=$(date +%Y-%m-%dT%H:%M:%S)
API_BASE=${API_BASE:-http://127.0.0.1:8920}
LOG=/tmp/mingli-weekly-eval.log
ERR=/tmp/mingli-weekly-eval.err

mkdir -p eval/weekly training-data/feedback-weekly DELIVERY

# 修真 2026-08-26：cron/launchd 环境无 node（nvm PATH 未加载，weekly-eval 连败 4 次，同 cron-distill-kb-link.sh 08-22 修法）
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  NODE_BIN="/Users/tom/.nvm/versions/node/v22.22.2/bin/node"
fi
if [ ! -x "$NODE_BIN" ]; then
  echo "[$(date '+%F %T')] node not found" >> "$ERR"
  exit 1
fi

exec >> "$LOG" 2>> "$ERR"
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
echo "=== [weekly-eval] Start week=$WEEK_ID at $TS ==="

# ──────────────────────────────────────────────────────────────
# 1. 反馈聚合（kb_feedback → training-data/feedback-weekly）
# ──────────────────────────────────────────────────────────────
python3 scripts/feedback-aggregator.py "$WEEK_ID" || echo "[WARN] feedback-aggregator failed"

# ──────────────────────────────────────────────────────────────
# 2. 三套件评估：faithfulness / cost-budget / latency
# ──────────────────────────────────────────────────────────────
for bench in faithfulness cost-budget latency; do
  python3 scripts/eval-runner.py --benchmark "$bench" --week "$WEEK_ID" --base "$API_BASE" || echo "[WARN] eval-runner $bench failed"
done

# ──────────────────────────────────────────────────────────────
# 3. KB 健康摘要
# ──────────────────────────────────────────────────────────────
"$NODE_BIN" -e "
const fs=require('fs'),path=require('path');
const start=Date.now();
const kbFiles=fs.readdirSync('knowledge').filter(f=>f.endsWith('-kb.js')||f.endsWith('-knowledge-base.js'));
const totalKB=fs.readdirSync('knowledge').filter(f=>f.endsWith('-full.js')||f.endsWith('-data.js')).length;
console.log('[weekly-eval] KB files count:',kbFiles.length,'+ data files:',totalKB);
console.log('[weekly-eval] KB scan duration:',Date.now()-start,'ms');
"

# ──────────────────────────────────────────────────────────────
# 4. 合规扫描（DPO 训练数据 + system prompt 合规校验）
# ──────────────────────────────────────────────────────────────
if [ -f scripts/sft-compliance-check.py ]; then
  python3 scripts/sft-compliance-check.py --output "training-data/feedback-weekly/${WEEK_ID}-compliance.json" || echo "[WARN] sft-compliance-check failed"
fi

# ──────────────────────────────────────────────────────────────
# 5. 生成 HTML 周报（DELIVERY/weekly-YYYY-WW.html）
# ──────────────────────────────────────────────────────────────
python3 scripts/weekly-report.py "$WEEK_ID" 2>&1 || echo "[WARN] weekly-report failed"

# ──────────────────────────────────────────────────────────────
# 6. 可选投递：写入 my-yuanzhu 推送收件箱（/api/ai/feedback-notify）
# ──────────────────────────────────────────────────────────────
REPORT_PATH="DELIVERY/weekly-${WEEK_ID}.html"
if [ -f "$REPORT_PATH" ]; then
  curl -s -X POST -F "week=$WEEK_ID" -F "report=@$REPORT_PATH" "$API_BASE/api/ai/weekly-report" >/dev/null 2>&1 || echo "[INFO] weekly-report delivery skipped (endpoint may not exist)"
fi

# ──────────────────────────────────────────────────────────────
# 7. 评估告警聚合（eval-alert.py → alert-card.json + .md）
# ──────────────────────────────────────────────────────────────
python3 scripts/eval-alert.py --week "$WEEK_ID" || echo "[WARN] eval-alert returned $?(W=warn/C=critical)"

# ──────────────────────────────────────────────────────────────
# 7.5 R126 告警上传（写入 admin_notify_log + 文件）
# ──────────────────────────────────────────────────────────────
ALERT_CARD="eval/weekly/${WEEK_ID}-alert-card.json"
if [ -f "$ALERT_CARD" ]; then
  ALERT_SEVERITY=$(python3 -c "import json;d=json.load(open('$ALERT_CARD'));print(d.get('overall_level','INFO'))")
  ALERT_TITLE=$(python3 -c "import json,sys;d=json.load(open('$ALERT_CARD'));print((f'周报${WEEK_ID} 评估: '+d.get('overall_level','INFO'))[:200])")
  ALERT_MSG=$(python3 << EOF
import json
d=json.load(open('$ALERT_CARD'))
j=d.get('judgments',{})
fa=j.get('faithfulness') or {};co=j.get('cost-budget') or {};la=j.get('latency') or {}
print('faithfulness=%s target≥%s | cost=¥%s | latency=%sms' % (
    fa.get('actual','?'), (fa.get('threshold') or {}).get('warn','?'),
    co.get('actual','?'), la.get('actual','?')))
EOF
)
  ALERT_DETAILS=$(python3 -c "import json;d=json.load(open('$ALERT_CARD'));print(json.dumps(d.get('judgments',{}),ensure_ascii=False)[:4000])")
  curl -s -X POST -H "Content-Type: application/json" \
    -d "{\"severity\":\"$ALERT_SEVERITY\",\"source\":\"weekly-eval\",\"title\":\"$ALERT_TITLE\",\"message\":\"$ALERT_MSG\",\"details\":$ALERT_DETAILS}" \
    "$API_BASE/api/public/notify-admin" >/dev/null 2>&1 && echo "[INFO] alert uploaded: severity=$ALERT_SEVERITY" || echo "[WARN] notify-admin upload failed"
fi

# ──────────────────────────────────────────────────────────────
# 8. 写 final marker（供 watchdog 检测）
# ──────────────────────────────────────────────────────────────
echo "$WEEK_ID" > .openclaw/tmp/last-weekly-eval.txt
echo "$TS"   > .openclaw/tmp/last-weekly-eval-ts.txt

echo "=== [weekly-eval] Done week=$WEEK_ID at $(date +%Y-%m-%dT%H:%M:%S) ==="
exit 0