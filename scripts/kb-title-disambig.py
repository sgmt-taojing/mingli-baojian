#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KB 通用标题消歧（2026-09-26 · S-待办「通用标题消歧」）
同 (title, module) 重复组 413 组/1043 条：蒸馏通用桶标题（精华要点×63 等）
+ 古籍分页同题（兰台轨范×30 等）→ 从内容提取辨识符追加副题。
规矩：只改 title 元数据，不动内容；FTS5 无 title 列、UPDATE 触发器不含 title 条件，FTS 不受影响；
参考域红线不动（G24）；全部变更留审计轨迹 DELIVERY/title-disambig-20260926.jsonl。
用法：--dry 预演（默认）｜--apply 落库
"""
import sqlite3, re, json, sys, os

DB = os.path.join(os.path.dirname(__file__), '..', 'server', 'database', 'yidao.db')
OUT = os.path.join(os.path.dirname(__file__), '..', 'DELIVERY', 'title-disambig-20260926.jsonl')

BOLD_RE = re.compile(r'\*\*(.{2,24}?)\*\*')
PAGE_RE = re.compile(r'---\s*(?:Page|P)\s*(\d+)\s*---', re.I)
KOUJUE_RE = re.compile(r'【口诀】(.{2,30})')
BOOK_RE = re.compile(r'内文[:：]\s*[^,，]*[,，][^,，]*[,，]([^,，\s]{2,12})')
BAD_TITLE_RE = re.compile(r'^[-—\s]*(?:Page|P)?\d*[-—\s]*$', re.I)

def discriminator(title, content):
    """从内容提取辨识符；返回 (base_override_or_None, disc) """
    c = (content or '')[:1200]
    t = (title or '').strip()
    if t.lower() == 'none':
        t = ''
    m = PAGE_RE.search(c)
    page = 'P' + m.group(1) if m else None
    # 标题本身是页码垃圾/空/None → 基部用书名副题
    base = None
    if not t or BAD_TITLE_RE.match(t):
        b = BOOK_RE.search(c)
        base = (b.group(1) + '（扫描页）') if b else '扫描页'
    # ① 页码优先（古籍扫描页）
    if page:
        return base, page
    redundant = lambda d: d and t and (d in t or t in d)  # 与原标题互相包含则无辨识价值
    # ② 首个加粗术语（蒸馏条目「**经方溯源**：」形态）
    b = BOLD_RE.search(c)
    if b:
        disc = b.group(1).strip('：:，,。 \t')
        if 2 <= len(disc) <= 16 and not BAD_TITLE_RE.match(disc) and not redundant(disc):
            return base, disc
    # ③ 口诀首句
    k = KOUJUE_RE.search(c)
    if k:
        disc = re.split(r'[，。；]', k.group(1))[0][:16]
        if not redundant(disc):
            return base, disc
    # ④ 首个非空短行（剥掉【原文】类标记再判冗余）
    for line in c.split('\n'):
        line = line.strip().strip('#*>- ')
        if 4 <= len(line) <= 20 and not line.startswith('---'):
            core = re.sub(r'^【[^】]{1,8}】', '', line)
            if not redundant(core):
                return base, line[:16]
    return base, None

def main():
    apply = '--apply' in sys.argv
    conn = sqlite3.connect(DB, timeout=10)
    conn.execute('PRAGMA busy_timeout = 8000')
    cur = conn.cursor()
    groups = cur.execute("""
        SELECT title, module, COUNT(*) n FROM kb_formal
        WHERE status='formal' AND title IS NOT NULL
        GROUP BY title, module HAVING n > 1
    """).fetchall()
    # NULL 标题单独成组处理
    null_rows = cur.execute(
        "SELECT entry_id, module, content FROM kb_formal WHERE status='formal' AND (title IS NULL OR TRIM(title)='')"
    ).fetchall()

    plan = []  # (entry_id, old_title, new_title)
    taken = set()  # (module, new_title) 防新碰撞
    skipped = 0

    def emit(entry_id, module, old_title, content):
        nonlocal skipped
        base, disc = discriminator(old_title or '', content)
        if not disc:
            disc = 'id' + entry_id[-5:]
        new_title = ((base if base else (old_title or '').strip()) + '｜' + disc)[:60]
        if (module, new_title) in taken:
            new_title = (new_title + '·' + entry_id[-4:])[:60]
        if (module, new_title) in taken or new_title == (old_title or ''):
            skipped += 1
            return
        taken.add((module, new_title))
        plan.append((entry_id, old_title or '', new_title))

    for title, module, n in groups:
        rows = cur.execute(
            "SELECT entry_id, content FROM kb_formal WHERE status='formal' AND title IS ? AND module=?",
            (title, module)).fetchall()
        # 同组内首个出现的辨识符也可能相同（如全部 **精华** 开头）→ taken 集合兜底
        for entry_id, content in rows:
            emit(entry_id, module, title, content)
    for entry_id, module, content in null_rows:
        emit(entry_id, module, '', content)

    print(f'重复组 {len(groups)} + NULL标题 {len(null_rows)} 条 → 计划改题 {len(plan)} 条，跳过 {skipped} 条')
    for rec in plan[:12]:
        print(f'  {rec[0]}  「{rec[1][:36]}」→「{rec[2][:52]}」')
    if len(plan) > 12:
        print(f'  … 共 {len(plan)} 条')

    if not apply:
        print('（dry-run，加 --apply 落库）')
        conn.close()
        return

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf8') as f:
        for entry_id, old, new in plan:
            f.write(json.dumps({'entry_id': entry_id, 'old': old, 'new': new}, ensure_ascii=False) + '\n')
    with conn:
        conn.executemany('UPDATE kb_formal SET title=? WHERE entry_id=?',
                         [(new, eid) for eid, _, new in plan])
    # 复验
    remain = conn.execute("""
        SELECT COUNT(*) FROM (SELECT title, module FROM kb_formal
        WHERE status='formal' AND title IS NOT NULL GROUP BY title, module HAVING COUNT(*)>1)
    """).fetchone()[0]
    print(f'落库完成。复验：同(标题,module)重复组 {remain}（原 413）')
    print(f'审计轨迹: {OUT}')
    conn.close()

if __name__ == '__main__':
    main()
