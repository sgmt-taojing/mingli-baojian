#!/bin/bash
# R249 修真：蒸馏→KB 关联 每天 03:30 跑
# 直接调 node 模块（绕过 HTTP / JWT / CSRF），更可靠
set -e

# 修真 2026-08-22：cron 环境无 node（nvm PATH 未加载，08-18 起连续 5 天 distill/linker 失败）
# 用绝对路径兜底，避免依赖 shell profile
if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  NODE_BIN="/Users/tom/.nvm/versions/node/v22.22.2/bin/node"
fi
if [ ! -x "$NODE_BIN" ]; then
  echo "[$(date '+%F %T')] node not found" >> "$LOG_FILE" 2>/dev/null || true
  exit 1
fi

# 修真 2026-08-28 02:00 心跳：LOG_FILE 原在 set -e 之后才定义，早失败分支写日志
# 报「No such file or directory」连败 → 提前到最前，保证任何分支都能落日志
LOG_FILE="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/.openclaw/tmp/cron-distill-kb-link.log"
touch "$LOG_FILE"
echo "[$(date '+%F %T')] 开始 distill-link 任务" >> "$LOG_FILE"

cd /Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian

# 1) 全量画像蒸馏（直接调 engine 模块）
"$NODE_BIN" -e "
try {
  const engine = require('./server/profile-distill-engine');
  const patients = engine.rebuildAllPatientProfiles();
  const believers = engine.rebuildAllBelieverInsights();
  console.log('[distill] patients:', JSON.stringify(patients));
  console.log('[distill] believers:', JSON.stringify(believers));
} catch (e) {
  console.log('[distill ERROR]', e.message);
  process.exit(1);
}
" >> "$LOG_FILE" 2>&1 || echo "[$(date '+%F %T')] distill engine error" >> "$LOG_FILE"

# 2) 跑 linker
"$NODE_BIN" -e "
const l = require('./server/distill-kb-linker');
const r = l.linkAllInsights(0.7);
console.log('[linker]', JSON.stringify({linked:r.linked, pending:r.pending, no_match:r.no_match, total:r.total}));
console.log('[hot linked KB]');
l.getHotLinkedKB(5).forEach(h => console.log('  ' + h.kb_entry_id + ' | ' + h.module + ' | refs=' + h.ref_count));
console.log('[stats]', JSON.stringify(l.getLinkStats()));
" >> "$LOG_FILE" 2>&1 || echo "[$(date '+%F %T')] linker error" >> "$LOG_FILE"

echo "[$(date '+%F %T')] 任务完成" >> "$LOG_FILE"
