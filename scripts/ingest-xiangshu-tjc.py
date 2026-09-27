#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ingest-xiangshu-tjc.py — 《古今图书集成·艺术典·相术部》卷631-650 入 kb_formal（2026-09-27 · Y5 命相同参）
源：corpus/xiangshu-tjc/卷631-650.txt（~37 万字净本，维基文库渲染全文）
切块：§§ 篇名 §§ 为节锚点；节文 <300 字并流下一节，>6000 字按段落二分（红线5长度门槛）；
      '{{{2}}}' 等模板残渣节丢弃；卷首目录区（含「彙考」「〈」目录行密集段）跳过。
字段：module=xiangshu，trust=0.95（PD 钦定汇编原典），src_id=wikisource:古今圖書集成·藝術典·相術部，
      fingerprint='XST|md5(module+content)' 幂等，status='formal'，domain='mingli'。
边界：相术为命理域内容（相不独论、命相同参），话术使用层另行守「倾向参考」边界。
"""
import hashlib, re, sqlite3, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
SRC = 'wikisource:古今圖書集成·藝術典·相術部'
FP_PREFIX = 'XST|'

def sections(txt):
    """按 §§ 锚点切节 → [(篇名, 正文)]"""
    parts = re.split(r'§§\s*(.+?)\s*§§', txt)
    out = []
    # parts[0] 为卷首（含目录），不进
    for i in range(1, len(parts) - 1, 2):
        name, body = parts[i].strip(), parts[i + 1].strip()
        if '{{{' in name or not name or len(name) > 60:
            continue
        name = name.strip('《》')
        if body:
            out.append((name, body))
    return out

def main():
    conn = sqlite3.connect(str(DB), timeout=120)
    conn.execute('PRAGMA busy_timeout=120000')
    fps = {r[0] for r in conn.execute(
        "SELECT fingerprint FROM kb_formal WHERE fingerprint LIKE 'XST|%'")}
    entries = []
    for v in range(631, 651):
        f = ROOT / 'corpus' / 'xiangshu-tjc' / f'卷{v}.txt'
        if not f.exists():
            continue
        secs = sections(f.read_text(encoding='utf-8'))
        buf_name, buf = None, ''
        for name, body in secs + [('§END', '')]:
            if buf and (len(buf) >= 300 or name == '§END'):
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
                    entries.append((f'相术部·卷{v}·{buf_name}{suffix}', ch, v))
                buf_name, buf = None, ''
            if name == '§END':
                break
            if buf_name is None:
                buf_name, buf = name, body
            else:
                buf += '\n\n' + body
    print(f'候选条目 {len(entries)}', flush=True)

    ins = skip = dup = 0
    for attempt in range(20):
        try:
            conn.execute('BEGIN IMMEDIATE')
            for title, content, v in entries:
                full = f'【古今图书集成·艺术典·相术部·{title}】（公有领域原典·清乾隆钦定汇编·维基文库）\n\n{content}\n\n关键词：相术 命相同参 {title}'
                fp = FP_PREFIX + hashlib.md5(('xiangshu' + full).encode()).hexdigest()[:12]
                if fp in fps:
                    dup += 1
                    continue
                eid = 'KB-XST-' + fp[4:]
                conn.execute(
                    """INSERT INTO kb_formal (entry_id, module, title, content, keywords, trust_score,
                       access_level, status, domain, src_id, fingerprint, created_at)
                       VALUES (?,?,?,?,?,0.95,'public','formal','mingli',?,?,datetime('now'))""",
                    (eid, 'xiangshu', f'原典·{title}', full,
                     f'相术部,卷{v},{title},相术,命相同参', SRC, fp))
                fps.add(fp)
                ins += 1
            conn.commit()
            break
        except sqlite3.OperationalError as e:
            conn.rollback()
            if 'locked' in str(e).lower():
                print(f'写锁被占，30s 后重试（{attempt+1}/20）…', flush=True)
                time.sleep(30)
            else:
                raise
    else:
        raise SystemExit('FATAL: 写锁重试耗尽')
    print(f'═══ 入库 {ins} 条，指纹去重跳过 {dup} 条')
    n = conn.execute("SELECT COUNT(*) FROM kb_formal WHERE module='xiangshu'").fetchone()[0]
    print(f'xiangshu 模块现总量 {n} 条')
    conn.close()

if __name__ == '__main__':
    main()
