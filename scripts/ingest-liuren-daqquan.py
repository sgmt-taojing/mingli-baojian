#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-liuren-daqquan.py — 《六壬大全（四庫全書本）》十二卷入 kb_formal（2026-09-27）
源：维基文库净本 corpus/liuren-daqquan/卷01-12.txt（295,484 字）
切块：{{SK anchor|節名}} 为节锚点；{{SK notes|X}} 转（注：X）；{{SKchar|XXXX}} 私用区字丢弃；
      节文 <300 字并入下一节（红线 5 长度门槛），>6000 字按段落二分。
字段：module=liuren，trust=0.95（PD 原典），src_id=wikisource:六壬大全(四庫全書本)，
      fingerprint='LRQ|md5(module+content)' 幂等，status='formal'，domain='mingli'。
"""
import hashlib, json, re, sqlite3, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = 'wikisource:六壬大全(四庫全書本)'

JUAN_NAME = {1:'入手法',2:'賦論',3:'課經一',4:'課經二',5:'課經三',6:'課經四',
             7:'課經五',8:'課經六',9:'課經七',10:'課經八',11:'占斷一',12:'占斷二'}

def clean_section(t):
    t = re.sub(r'\{\{SK notes\|([^}]*)\}\}', r'（注：\1）', t)
    t = re.sub(r'\{\{SKchar\|[0-9A-Fa-f]+\}\}', '', t)
    t = re.sub(r'\{\{[^}]*\}\}', '', t)
    t = re.sub(r'　+', '', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def sections(txt):
    """按 SK anchor 切节，返回 [(节名, 正文)]"""
    parts = re.split(r'\{\{SK anchor\|([^}]*)\}\}', txt)
    out = []
    if parts[0].strip():
        head = clean_section(parts[0])
        if len(head) > 50:
            out.append(('卷首', head))
    for i in range(1, len(parts) - 1, 2):
        name, body = parts[i].strip(), clean_section(parts[i + 1])
        if body:
            out.append((name, body))
    return out

def main():
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute("SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'LRQ|%'")}
    entries = []
    for v in range(1, 13):
        f = ROOT / 'corpus' / 'liuren-daqquan' / f'卷{v:02d}.txt'
        secs = sections(f.read_text(encoding='utf-8'))
        buf_name, buf = None, ''
        for name, body in secs + [('§END', '')]:
            if buf and (len(buf) >= 300 or name == '§END'):
                # 超长节按段落二分
                chunks = [buf]
                if len(buf) > 6000:
                    paras = buf.split('\n\n')
                    chunks, cur = [], ''
                    for p in paras:
                        if len(cur) + len(p) > 4000 and cur:
                            chunks.append(cur); cur = ''
                        cur += p + '\n\n'
                    if cur.strip():
                        chunks.append(cur)
                for ci, ch in enumerate(chunks):
                    ch = ch.strip()
                    if len(ch) < 100:
                        continue
                    suffix = f'·{ci+1}' if len(chunks) > 1 else ''
                    entries.append((f'六壬大全·卷{v:02d}{JUAN_NAME.get(v,"")}·{buf_name}{suffix}', ch, v))
                buf_name, buf = None, ''
            if name == '§END':
                break
            if buf_name is None:
                buf_name, buf = name, body
            else:
                buf += '\n\n' + body  # 短节并流
    print(f'候选条目 {len(entries)}')
    ins = skip = 0
    for attempt in range(20):
        try:
            conn.execute('BEGIN IMMEDIATE')
            for title, content, v in entries:
                fp = 'LRQ|' + hashlib.md5(('liuren' + content).encode()).hexdigest()
                if fp in fps:
                    skip += 1; continue
                eid = 'KB-LRQ-' + hashlib.md5((title + content[:50]).encode()).hexdigest()[:12]
                conn.execute("""INSERT OR IGNORE INTO kb_formal
                    (entry_id, module, title, content, src_id, category, keywords, summary,
                     trust_score, version, promoted_at, promoted_from, status, fingerprint, domain, tags)
                    VALUES (?,?,?,?,?,?,?,?,0.95,1,datetime('now','localtime'),'ingest-liuren-daqquan','formal',?,'mingli','六壬,大六壬,原典,四庫全書')""",
                    (eid, 'liuren', title[:80], content, SRC, '大六壬', '六壬,大六壬,課傳,占斷',
                     content[:120].replace('\n', ' '), fp))
                fps.add(fp); ins += 1
            conn.commit()
            break
        except sqlite3.OperationalError as e:
            conn.rollback(); print(f'locked retry {attempt+1}: {e}'); time.sleep(20)
    else:
        raise SystemExit('FATAL locked')
    print(f'入库 {ins} / 幂等跳过 {skip}')
    n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE fingerprint LIKE 'LRQ|%'").fetchone()[0]
    print(f'LRQ 总量 {n}')
    conn.close()

if __name__ == '__main__':
    main()
