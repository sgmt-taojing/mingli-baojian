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
# R-BQA-PREFLIGHT（2026-10-09）：8960 预检——挂则整轮退出，杜绝 0/N 假成绩污染汇总（10-08 事故复盘）
if ! curl -s -m 5 -o /dev/null http://127.0.0.1:8960/v1/models; then
  echo "!!! $(date '+%F %T') 8960 推理服务不可达，整轮退出（不写成绩）===" >> "$LOG"
  exit 2
fi
for OFF in 0 10 20 30 40 50; do
  # 断点续跑：段日志（实际人数文件名 glob，如 p51-58）已有 ≥10 人结果则跳过
  # R-BQA-SEGFIX（2026-10-09）：原写死 p51-60 但实际产出 p51-58（58 人库末段 8 人），
  # 文件名失配导致每次 RunAtLoad 永驻重跑末段——改 glob 匹配
  SEGLOG=$(ls training/baziqa-results/${TAG}-p$((OFF+1))-*.log 2>/dev/null | head -1)
  if [ -n "$SEGLOG" ] && [ "$(grep -c '^→ ' "$SEGLOG" 2>/dev/null || echo 0)" -ge 10 ]; then
    echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10)) 已完成，跳过 ---" >> "$LOG"
    continue
  fi
  # 末段（不足 10 人）按「汇总行存在」判完成
  if [ -n "$SEGLOG" ] && grep -q '=== 结果:' "$SEGLOG" 2>/dev/null; then
    echo "--- $(date '+%F %T') 段 p$((OFF+1))-$((OFF+10))（末段）已完成，跳过 ---" >> "$LOG"
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
