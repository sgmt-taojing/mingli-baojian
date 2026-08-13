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
PURE_MINGLI = [
    'bazi', 'ziwei', 'qimen', 'liuyao', 'liuren', 'meihua',
    'fengshui', 'yijing', 'hehun', 'qiming', 'mingli',
    'tianji-mingli', 'tianji-jiangjie', 'daodejing',
    'liuyao-basics', 'bazi-teaching',
    'r45_palace_ext', 'r45_shishen_ext', 'r39_dual_core',
    'r39_career_core', 'r39_health_core',
    'case_bazi', 'case_fengshui', 'case_liuren', 'case_liuyao', 'case_meihua', 'case_qimen', 'case_ziwei',
]
EXPORT = "training-data/distill-outbound/mingli-pure-${DATE}.json"
conn = sqlite3.connect("server/database/yidao.db")
conn.row_factory = sqlite3.Row
placeholders = ','.join(['?'] * len(PURE_MINGLI))
rows = conn.execute(f"SELECT entry_id, module, title, content, keywords, trust_score FROM kb_formal WHERE status='formal' AND module IN ({placeholders})", PURE_MINGLI).fetchall()
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
data['chains']['mingli-shf'] = {
    "domain": "命理",
    "source": "mingli-baojian",
    "target": "smart-home-family",
    "total": len(open("/Users/tom/.openclaw-autoclaw/workspace/projects/smart-home-family/server/kb-store/mingli-pure.json").read()) // 500,
    "last_run": time.strftime('%Y-%m-%d %H:%M:%S'),
    "state": "updated",
}
data['chains']['mingli-tcm'] = {
    "domain": "医学",
    "source": "mingli-baojian",
    "target": "tcm-agent",
    "total": len(open("/Users/tom/.openclaw-autoclaw/workspace/projects/tcm-agent/server/kb-store/aux-mingli.json").read()) // 500,
    "last_run": time.strftime('%Y-%m-%d %H:%M:%S'),
    "state": "updated",
}
data['last_check'] = time.strftime('%Y-%m-%d %H:%M:%S')
with open(REG, 'w') as f: json.dump(data, f, ensure_ascii=False, indent=2)
print("✓ distill-status.json 已更新")
PYEOF
