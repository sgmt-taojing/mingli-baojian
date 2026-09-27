#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""kb-activation-weekly.py — KB 活化周报（MB-K1，每周一 06:41 launchd）
产出 DELIVERY/kb-activation-weekly-<date>.md：滞留账龄/晋升拒绝比/命理域增量/队列状态/SLA 红灯。"""
import sqlite3, json, subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'DELIVERY' / f'kb-activation-weekly-{datetime.now():%Y%m%d}.md'

conn = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
q = lambda s: conn.execute(s).fetchall()

pending = q("SELECT src_id, COUNT(*), MIN(created_at) FROM kb_staging WHERE status='pending' GROUP BY src_id ORDER BY 2 DESC")
week_promote = q("SELECT COUNT(*) FROM kb_staging WHERE status='promoted' AND updated_at > datetime('now','-7 day')")[0][0]
week_reject = q("SELECT COUNT(*) FROM kb_staging WHERE status='rejected' AND updated_at > datetime('now','-7 day')")[0][0]
mingli_total = q("SELECT COUNT(*) FROM kb_formal WHERE domain='mingli'")[0][0]
formal_total = q("SELECT COUNT(*) FROM kb_formal")[0][0]
red = [(s, c, t) for s, c, t in pending if t < datetime.now().strftime('%Y-%m-%d %H:%M:%S') and
       (datetime.now() - datetime.strptime(t, '%Y-%m-%d %H:%M:%S')).days > 14]

receipts = Path('/Volumes/模型训练数据/知识原始材料/管理/提取回执.json')
rc = len(json.loads(receipts.read_text(encoding='utf-8'))) if receipts.exists() else 0
ocr_log = ROOT / 'logs' / 'manuscript-ocr.log'
ocr_done = subprocess.run(['grep', '-c', '回执 v2-ocr', str(ocr_log)], capture_output=True, text=True).stdout.strip() if ocr_log.exists() else '0'

lines = [f'# KB 活化周报 · {datetime.now():%Y-%m-%d %H:%M}', '',
         f'- kb_formal 总量：{formal_total}（命理域 {mingli_total}）',
         f'- 近 7 天：晋升 {week_promote} / 拒绝 {week_reject}',
         f'- 老板稿件回执：{rc}/67；OCR v2 回执：{ocr_done}/26', '',
         '## staging 滞留（pending）', '',
         '| src_id | 条数 | 最早入队 |', '|---|---|---|']
for s, c, t in pending:
    lines.append(f'| {s} | {c} | {t} |')
lines += ['', '## SLA 红灯（滞留 >14 天）', '']
if red:
    for s, c, t in red:
        lines.append(f'- 🔴 {s}：{c} 条，最早 {t} —— 需逐条裁决（升/拒写原因）')
else:
    lines.append('- 无')
lines += ['', '## 下周动作', '',
          '- 红灯项 48h 内裁决；',
          '- 按 docs/CLASSICS-COLLECTION.md 推进古籍净本采集；',
          '- 净本候选周检：奇门遁甲秘笈大全（IA/维基 09-27 未中，每周复检新上架）；',
          '- G2CLAW 额度恢复后切回 AI 蒸馏主链（rules 为降级链）。']
OUT.parent.mkdir(exist_ok=True)
OUT.write_text('\n'.join(lines), encoding='utf-8')
print('周报 →', OUT)
conn.close()
