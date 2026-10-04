#!/bin/bash
# run-baziqa-new100.sh — new100 题库（58 人 181 题）深度校验分段跑（2026-09-28）
# 模式同 run-baziqa-full-v92.sh：6 段 × ≤10 人，逐人增量写盘，失败段可单独重跑
# MLX 8960 本地推理实测 ~50s/题，全量约 2.5h——launchd 托管，不占会话
set -u
cd "$(dirname "$0")/.."
TAG="v92-new100"
DATA="training/baziqa/data/celebrity-new100_zh.masked.json"  # R-BQA-MASK 2026-10-04 脱敏版
LOG=training/baziqa-results/${TAG}-runner.log
PY=/usr/bin/python3

echo "=== $(date '+%F %T') new100 全量开跑（58 人 181 题）===" >> "$LOG"
for OFF in 0 10 20 30 40 50; do
  SEGLOG=training/baziqa-results/${TAG}-p$((OFF+1))-$((OFF+10)).log
  # 断点续跑：段日志已有 ≥10 人结果则跳过
  if [ -f "$SEGLOG" ] && [ "$(grep -c '^→ ' "$SEGLOG" 2>/dev/null || echo 0)" -ge 10 ]; then
    echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 已完成，跳过 ---" >> "$LOG"
    continue
  fi
  echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 开始 ---" >> "$LOG"
  $PY training/eval-baziqa.py --data "$DATA" --tag "$TAG" --offset $OFF --limit 10 >> "$LOG" 2>&1
  echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 结束 rc=$? ---" >> "$LOG"
done

# 汇总：各段日志合并统计
$PY - <<'PYEOF' >> "$LOG" 2>&1
import re, glob
tot = cor = 0
for f in sorted(glob.glob('training/baziqa-results/v92-new100-p*.log')):
    if 'runner' in f:
        continue
    for line in open(f, encoding='utf-8'):
        m = re.match(r'→ .+: (\d+)/(\d+)', line)
        if m:
            cor += int(m.group(1)); tot += int(m.group(2))
if tot:
    print(f'═══ new100 汇总：{cor}/{tot} = {cor/tot*100:.1f}%')
PYEOF
echo "=== $(date '+%F %T') new100 全量完跑 ===" >> "$LOG"
