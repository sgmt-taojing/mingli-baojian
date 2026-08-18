#!/bin/bash
# cron-distill-mingli-outbound.sh
# R103-v2: mingli-baojian 命理 KB 蒸馏到 tcm-agent + smart-home-family
set -e
PROJECT_DIR="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG_FILE="/tmp/distill-mingli-outbound.log"
TS=$(date '+%F %T')
echo "[$TS] === mingli-baojian 命理 KB 蒸馏开始 ===" >> "$LOG_FILE"
cd "$PROJECT_DIR"

DATE=$(date +%Y%m%d)
EXPORT="training-data/distill-outbound/mingli-pure-${DATE}.json"
mkdir -p training-data/distill-outbound

python3 - <<PYEOF >> "$LOG_FILE" 2>&1
import sqlite3, json, os
from datetime import datetime
from collections import Counter
def safe_str(v):
    if v is None: return ''
    if isinstance(v, bytes): return v.decode('utf-8', errors='ignore')
    return str(v)
# R735-g8 修真：静态白名单 → 动态全量导出（源头新模块自动纳入次日同步）
# 旧白名单仅 28 模块漏 96 模块；现 SQL NOT IN 排除内部模块，其余 formal 全量导出
EXCLUDE_MODULES = ('engine_compare', 'ai-prompt', 'mingli-cross-moved')
EXPORT = "training-data/distill-outbound/mingli-pure-${DATE}.json"
conn = sqlite3.connect("server/database/yidao.db")
conn.row_factory = sqlite3.Row
ph = ','.join(['?'] * len(EXCLUDE_MODULES))
rows = conn.execute(
    f"SELECT entry_id, module, title, content, keywords, trust_score FROM kb_formal "
    f"WHERE status='formal' AND module NOT IN ({ph})", EXCLUDE_MODULES).fetchall()
entries = []
for r in rows:
    entries.append({
        'entry_id': safe_str(r['entry_id']),
        'module': safe_str(r['module']),
        'title': safe_str(r['title']),
        'content': safe_str(r['content']),
        'keywords': safe_str(r['keywords']),
        'trust_score': r['trust_score'] or 0.85,
        'source_project': 'mingli-baojian',
        'distilled_at': datetime.now().isoformat(),
    })
modules = Counter(e['module'] for e in entries)
with open(EXPORT, 'w', encoding='utf-8') as f:
    json.dump(entries, f, ensure_ascii=False)
print(f"导出 {len(entries)} 条命理 KB")
for m, n in modules.most_common():
    print(f"  {m}: {n}")

PYEOF

cp "$EXPORT" /Users/tom/.openclaw-autoclaw/workspace/projects/smart-home-family/server/kb-store/mingli-pure.json
cp "$EXPORT" /Users/tom/.openclaw-autoclaw/workspace/projects/tcm-agent/server/kb-store/aux-mingli.json
echo "  ✓ 推送到 SHF + TCM-aux" >> "$LOG_FILE"
find training-data/distill-outbound -name "mingli-pure-*.json" -mtime +7 -delete
echo "[$TS] === 完成 ===" >> "$LOG_FILE"
# R104-W1.2: 更新蒸馏注册表
python3 - <<'PYEOF'
import json, os, time
REG = "/Users/tom/.openclaw-autoclaw/workspace/projects/_shared/distill-status.json"
data = {}
if os.path.exists(REG):
    with open(REG) as f: data = json.load(f)
if 'chains' not in data: data['chains'] = {}
# R106 修真：真实条目计数（原 bytes//500 hack 误差 6.5×）
def count_json(path):
    try:
        with open(path) as f:
            d = json.load(f)
        return len(d) if isinstance(d, list) else sum(len(v) for v in d.values() if isinstance(v, list))
    except Exception:
        return -1
shf_total = count_json("/Users/tom/.openclaw-autoclaw/workspace/projects/smart-home-family/server/kb-store/mingli-pure.json")
tcm_total = count_json("/Users/tom/.openclaw-autoclaw/workspace/projects/tcm-agent/server/kb-store/aux-mingli.json")
data['chains']['mingli-shf'] = {
    "domain": "命理",
    "source": "mingli-baojian",
    "target": "smart-home-family",
    "total": shf_total,
    "last_run": time.strftime('%Y-%m-%d %H:%M:%S'),
    "state": "updated",
}
data['chains']['mingli-tcm'] = {
    "domain": "医学",
    "source": "mingli-baojian",
    "target": "tcm-agent",
    "total": tcm_total,
    "last_run": time.strftime('%Y-%m-%d %H:%M:%S'),
    "state": "updated",
}
data['last_check'] = time.strftime('%Y-%m-%d %H:%M:%S')
with open(REG, 'w') as f: json.dump(data, f, ensure_ascii=False, indent=2)
print("✓ distill-status.json 已更新")
PYEOF

# R108: 回写 distill-registry.json（与 distill-status 同源；失败仅告警，不影响主流程退出码）
python3 - <<'PYEOF'
import json, os, time, glob

REG = "/Users/tom/.openclaw-autoclaw/workspace/projects/_shared/distill-registry.json"

def count_json(path):
    try:
        with open(path) as f:
            d = json.load(f)
        if isinstance(d, list):
            return len(d)
        if isinstance(d, dict):
            return sum(len(v) for v in d.values() if isinstance(v, list))
    except Exception:
        pass
    return -1

try:
    # 本轮导出文件（与 distill-status 同源：mingli-pure.json → shf / aux-mingli.json → tcm）
    exports = sorted(glob.glob("/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/training-data/distill-outbound/mingli-pure-*.json"))
    total = count_json(exports[-1]) if exports else -1
    if total < 0:
        total = count_json("/Users/tom/.openclaw-autoclaw/workspace/projects/tcm-agent/server/kb-store/aux-mingli.json")
    now = time.strftime('%Y-%m-%d %H:%M:%S') + '+08:00'

    with open(REG) as f:
        reg = json.load(f)
    for p in reg.get('pipelines', []):
        if p.get('id') == 'mingli-outbound':
            p['lastRun'] = now
            p['total'] = total
            p['total_scope'] = 'exported-this-run'
            p['status'] = 'enabled-daily'
            p['note'] = f"R108 自动回写 {now}：total={total}（exported-this-run）；累计口径见 synced_total（31024）与 distill-status chains.synced_total"
            st = p.setdefault('stats', {})
            st['totalDistilled'] = total
            st['totalDelivered'] = total
            st['note'] = f"R108 自动回写 {now}：totalDistilled=本轮导出条数；detail/lastDelta 为累计口径保留"
            break
    reg['updatedAt'] = now
    if 'metadata' not in reg: reg['metadata'] = {}
    reg['metadata']['last_sync_check'] = now
    tmp = REG + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(reg, f, ensure_ascii=False, indent=2)
    os.replace(tmp, REG)
    print(f"✓ distill-registry.json 已回写（mingli-outbound total={total}）")
except Exception as e:
    print(f"⚠ distill-registry 回写失败（不影响主流程）: {e}")
PYEOF
