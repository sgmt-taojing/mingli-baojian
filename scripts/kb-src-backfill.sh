#!/bin/bash
# kb-src-backfill.sh — 等锁空闲后回填 kb_formal 空 src_id（五类映射+近邻复用）
cd "$(dirname "$0")/.."
PY="/Users/tom/Library/Application Support/kimi-desktop/daimon-share/daimon/runtime/python/.venv/bin/python3"
LOG=logs/kb-src-backfill.log
echo "[$(date '+%F %T')] 启动，等待 kb-sync-guard / OCR 批释放写锁" >> "$LOG"
# 等 kb-sync-guard 与 OCR 批结束
while pgrep -f "kb-sync-guard.py --sync" >/dev/null || [ -f .openclaw/tmp/manuscript-ocr.lock ]; do sleep 30; done
echo "[$(date '+%F %T')] 锁已释放，开始回填" >> "$LOG"
for i in $(seq 1 30); do
  if "$PY" .openclaw/tmp/backfill-src2.py >> "$LOG" 2>&1; then
    echo "[$(date '+%F %T')] 回填完成，接着跑 P2 修复" >> "$LOG"
    "$PY" .openclaw/tmp/kb-p2-fixes.py >> "$LOG" 2>&1 && echo "[$(date '+%F %T')] P2 修复完成" >> "$LOG"
    launchctl kickstart -k gui/$(id -u)/com.mingli-baojian.kb-sync-now && echo "[$(date '+%F %T')] 已触发 FTS 重同步" >> "$LOG"
    exit 0
  fi
  echo "[$(date '+%F %T')] 第 $i 次失败，20s 后重试" >> "$LOG"; sleep 20
done
echo "[$(date '+%F %T')] FATAL 30 次重试仍失败" >> "$LOG"; exit 1
