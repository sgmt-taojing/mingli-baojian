#!/bin/bash
# backup-guard.sh — 备份脚本 TCC 权限自动诊断（2026-09-14 快照修真）
# 现象：cron/launchd 上下文写外置卷报 Operation not permitted，手动跑正常
# 用法：bash scripts/backup-guard.sh （健康巡检/备份脚本开头调用）
DEST="/Volumes/模型训练数据/cold-storage"
PROBE="$DEST/.tcc-probe-$$"
if [ -d "$DEST" ]; then
  # R793：瞬态 TCC 失败重试（3 次×5s 退避——单次失败即告警入册曾误报）
  PROBE_OK=0
  for _attempt in 1 2 3; do
    if mkdir "$PROBE" 2>/dev/null; then PROBE_OK=1; break; fi
    sleep 5
  done
  [ "$PROBE_OK" -eq 1 ] && rmdir "$PROBE" 2>/dev/null
  if [ "$PROBE_OK" -eq 1 ]; then
    # 自愈语义：探测成功则清除历史 TCC-LOCKED/VOLUME-MISSING 标记，
    # 避免单次瞬态失败后的陈旧记录反复触发巡检告警（2026-09-15 修真）
    if [ -f "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log" ] && grep -q "TCC-LOCKED\|VOLUME-MISSING" "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log" 2>/dev/null; then
      echo "$(date '+%F %T') RECOVERED probe ok, clearing stale marks" >> "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log"
      # 只清失败行，保留 RECOVERED 审计痕迹
      grep -v "TCC-LOCKED\|VOLUME-MISSING" "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log" > "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log.tmp" 2>/dev/null
      mv "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log.tmp" "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log"
    fi
      exit 0   # 写入正常
  fi
  echo "⚠️ TCC-LOCKED: 定时上下文对外置卷无写权限（3 次重试均失败，Operation not permitted）"
  echo "   修复路径: 系统设置 → 隐私与安全性 → 完全磁盘访问权限 → 勾选 cron/launchd/bash 对应项，或改用 launchd 环境跑备份"
  # 失败自记录，供巡检发现
  echo "$(date '+%F %T') TCC-LOCKED probe failed" >> "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log"
  exit 2
fi
echo "$(date '+%F %T') VOLUME-MISSING $DEST not mounted" >> "$HOME/.openclaw-autoclaw/workspace/memory/backup-guard.log"
exit 1
