#!/bin/bash
# R702: 蒸馏闭环 — feedback-aggregator → 高质量候选 → KB staging 入库 → 命中率统计
# 每周一 03:00 运行（launchd: com.mingli-baojian.distill-feedback-loop）
set -e
PROJECT_DIR="/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
LOG_FILE="$PROJECT_DIR/.openclaw/tmp/distill-feedback-loop.log"
WEEK=$(date +%Y-W%V)
echo "[$(date '+%F %T')] === 蒸馏闭环 $WEEK ===" >> "$LOG_FILE"
cd "$PROJECT_DIR"

echo "[1/4] 聚合反馈..." >> "$LOG_FILE"
python3 scripts/feedback-aggregator.py "$WEEK" >> "$LOG_FILE" 2>&1 || {
  echo "[WARN] aggregator 失败" >> "$LOG_FILE"; exit 0; }

CAND_FILE="training-data/feedback-weekly/${WEEK}.jsonl"
if [ ! -f "$CAND_FILE" ]; then
  echo "[INFO] 无候选文件" >> "$LOG_FILE"
  echo "[$(date '+%F %T')] === end ===" >> "$LOG_FILE"; exit 0; fi

CNT=$(wc -l < "$CAND_FILE" | tr -d ' ')
echo "[2/4] 候选: $CNT 条" >> "$LOG_FILE"

if [ "$CNT" -gt 0 ]; then
  echo "[3/4] KB staging 入库..." >> "$LOG_FILE"
  CAND_FILE="$CAND_FILE" WEEK="$WEEK" python3 - << 'PYEOF' >> "$LOG_FILE" 2>&1
import json, sqlite3, hashlib, os, sys
cand_file = os.environ.get('CAND_FILE', '')
week = os.environ.get('WEEK', '')
db_path = os.path.join(os.getcwd(), 'server/database/yidao.db')
src_id = 'SRC-FEEDBACK-' + week
now = __import__('datetime').datetime.now().isoformat()

db = sqlite3.connect(db_path)
db.execute("INSERT OR IGNORE INTO source_index (src_id,src_type,title,author,trust_score,tags,access_level,created_at,module) VALUES (?,?,?,?,?,?,?,?,?)",
           (src_id, 'SRC-FEEDBACK', '反馈闭环蒸馏 ' + week, 'feedback-loop', 0.78,
            'feedback,distill', 'internal', now, 'feedback-distill'))
db.commit()

with open(cand_file) as f:
    items = [json.loads(l) for l in f if l.strip()]

INSERT_COLS = 'module,title,content,src_id,category,keywords,summary,raw_metadata,status,tags,confidence,source_ids,fingerprint,created_at,updated_at'
INSERT_SQL = f'INSERT INTO kb_staging ({INSERT_COLS}) VALUES ({",".join(["?"]*15)})'

imported = skipped = 0
for item in items:
    q = item.get('query', '')
    if len(q) < 4:
        skipped += 1
        continue
    # 过滤测试噪声
    if any(t in q.lower() for t in ('test', 'supertest', 'e2e', 'r473', 'session_id')):
        skipped += 1
        continue
    hq = item.get('high_quality', False)
    comments = item.get('comments', [])
    if not hq and not comments:
        skipped += 1
        continue
    total = item.get('total', 0)
    score = item.get('score', 0)
    mods = ','.join(item.get('modules', []))
    content_text = f"# 反馈蒸馏候选({'高质量' if hq else '常规'})\n\n## 用户问题\n{q}\n\n## 反馈\n- 查询{total}次 | 评分{score} | 模块:{mods}\n"
    if comments:
        content_text += "\n## 用户评论\n" + "\n".join(f"- {c}" for c in comments[:3])
    title = f"[反馈蒸馏] {q[:30]}"
    summary = f"用户反馈{total}次 评分{score} {'高质' if hq else ''}"
    fp = hashlib.sha256(content_text.encode()).hexdigest()[:16]
    if db.execute('SELECT entry_id FROM kb_staging WHERE fingerprint=?', (fp,)).fetchone():
        skipped += 1
        continue
    try:
        db.execute(INSERT_SQL, ('feedback-distill', title, content_text, src_id, 'feedback',
                                'feedback,distill', summary, '{}', 'staged', 'feedback', 0.78,
                                src_id, fp, now, now))
        imported += 1
    except Exception as e:
        print(f'  [WARN] {q[:30]}: {e}', file=sys.stderr)
db.commit()
db.close()
print(f'[distill-loop] 入库 {imported} | 跳过 {skipped}')
PYEOF
fi

echo "[4/4] KB 统计..." >> "$LOG_FILE"
python3 - << 'PYEOF2' >> "$LOG_FILE" 2>&1
import sqlite3, os
db = sqlite3.connect(os.path.join(os.getcwd(), 'server/database/yidao.db'))
rows = db.execute("SELECT source, COUNT(*) FROM kb_hit_log WHERE created_at >= date('now','-7 days') GROUP BY source ORDER BY COUNT(*) DESC").fetchall()
total = sum(r[1] for r in rows) if rows else 0
print(f'[distill-loop] 本周KB命中: {total}次')
for r in (rows or []):
    print(f'  {r[0]}: {r[1]}')
staging = db.execute("SELECT COUNT(*) FROM kb_staging WHERE status='staged'").fetchone()[0]
print(f'[distill-loop] staging待审核: {staging}条')
db.close()
PYEOF2

echo "[$(date '+%F %T')] === end ===" >> "$LOG_FILE"
