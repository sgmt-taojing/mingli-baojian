#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""KB 治理 · 678 重复题名 + 杂域归一 + 营销污染分级（S3.5 · 2026-10-14）
依据 docs/COLLATION-AUDIT-20261012.md 批复口径。红线：不删条目、不改 content 原文；
只动 status（归档）/title（定位序号）/module（写法归一）+ 留 audit_notes。
用法：/usr/bin/python3 training/kb-governance-20261014.py [--apply]
"""
import sqlite3, re, json, sys
from collections import Counter

DB = 'server/database/yidao.db'
APPLY = '--apply' in sys.argv

CORE_MKT = re.compile(r'加微信|微信号|扫码|课程费|学费|优惠价|QQ群|客服微信|公众号|咨询电话|诚招代理|招代理|详主页|私信我')
MINGLI_DOMAINS = ('mingli', '紫微', '八字', '易卦', '三式', '民俗', '阳宅', '择日', '相术', '命名', '数字术数', '科仪')
MINGLI_MODULES = ('bazi', 'qimen', 'liuyao', 'liuyue', 'meihua', 'fengshui', 'zeri', 'xiangshu', 'tianji')
MODULE_MAP = {  # 杂域标点归一（语义不动：+ 表跨域并列）
    'ziwei,fengshui': 'ziwei+fengshui',
    'ziwei,fengshui,qimen': 'ziwei+fengshui+qimen',
    'ziwei/cai-bo': 'ziwei+caibo',
    'ziwei/health': 'ziwei+health',
    'tcm/wangzhen': 'tcm+wangzhen',
    'qimen/shuihan-tcm': 'qimen+shuihan-tcm',
}

def main():
    con = sqlite3.connect(DB)
    con.text_factory = str
    c = con.cursor()
    report = {'apply': APPLY}

    # ── A. 真重复组（同 module+title+fingerprint）：留最优，余归档 ──
    dup_groups = c.execute(
        "SELECT module, title, fingerprint FROM kb_formal WHERE fingerprint IS NOT NULL "
        "GROUP BY module, title, fingerprint HAVING COUNT(*)>1").fetchall()
    archived_dup = []
    for mod, title, fp in dup_groups:
        rows = c.execute(
            "SELECT entry_id, trust_score, created_at FROM kb_formal WHERE module=? AND title=? AND fingerprint=? "
            "ORDER BY COALESCE(trust_score,0) DESC, created_at ASC", (mod, title, fp)).fetchall()
        keep = rows[0][0]
        for eid, _, _ in rows[1:]:
            archived_dup.append((eid, keep))
    report['A_exact_dup_groups'] = len(dup_groups)
    report['A_archived'] = len(archived_dup)

    # ── B. 泛题名碰撞组：同 module+title 不同内容 → title 加「·之NN」定位序号 ──
    col_groups = c.execute("SELECT module, title FROM kb_formal GROUP BY module, title HAVING COUNT(*)>1").fetchall()
    renames = []
    for mod, title in col_groups:
        rows = c.execute(
            "SELECT entry_id FROM kb_formal WHERE module=? AND title=? ORDER BY created_at ASC, entry_id ASC",
            (mod, title)).fetchall()
        n = len(rows)
        for i, (eid,) in enumerate(rows, 1):
            new_title = '%s · 之%0*d' % (title, 3 if n > 99 else 2, i)
            renames.append((eid, title, new_title))
    report['B_collision_groups'] = len(col_groups)
    report['B_renamed'] = len(renames)

    # ── C. 杂域 module 写法归一 ──
    norm = []
    for old, new in MODULE_MAP.items():
        rows = c.execute("SELECT entry_id FROM kb_formal WHERE module=?", (old,)).fetchall()
        for (eid,) in rows:
            norm.append((eid, old, new))
    report['C_module_normalized'] = len(norm)

    # ── D. 命理域营销污染分级：纯营销归档 / 水印型留清单待清洗管线 ──
    rows = c.execute(
        "SELECT entry_id, module, domain, title, CAST(content AS TEXT) FROM kb_formal "
        "WHERE status='formal' AND (promoted_from IS NULL OR promoted_from != 'manuscript-staging')").fetchall()
    pure_mkt, watermark = [], []
    for eid, mod, dom, title, content in rows:
        in_mingli = (dom in MINGLI_DOMAINS) or (mod in MINGLI_MODULES) or (mod or '').startswith(('ziwei', 'nihaisha'))
        if not in_mingli:
            continue
        c2 = content or ''
        ms = CORE_MKT.findall(c2)
        if not ms:
            continue
        uniq = sorted(set(ms))
        density = len(ms) * 1000.0 / max(len(c2), 1)
        # 归档线：营销词密度 ≥3/千字（行间嵌插污染，OCR 字幕广告条属此类），或短条目带强词
        if density >= 3 or (len(c2) < 300 and len(uniq) >= 1):
            pure_mkt.append((eid, mod, title, '/'.join(uniq) + ' 密度%.1f/千字' % density))
        else:
            watermark.append((eid, mod, title, '/'.join(uniq)))
    report['D_pure_marketing_archived'] = len(pure_mkt)
    report['D_watermark_listed'] = len(watermark)

    if APPLY:
        c.execute('BEGIN IMMEDIATE')
        for eid, keep in archived_dup:
            c.execute("UPDATE kb_formal SET status='archived', audit_notes=COALESCE(audit_notes,'') || ' [S3.5 指纹重复归档→保留 ' || ? || ']', updated_at=CURRENT_TIMESTAMP WHERE entry_id=?", (keep, eid))
        for eid, old_t, new_t in renames:
            c.execute("UPDATE kb_formal SET title=?, updated_at=CURRENT_TIMESTAMP WHERE entry_id=?", (new_t, eid))
        for eid, old_m, new_m in norm:
            c.execute("UPDATE kb_formal SET module=?, updated_at=CURRENT_TIMESTAMP WHERE entry_id=?", (new_m, eid))
            # fts5 module 列同步（经影子索引拿 rowid）
            rid = c.execute("SELECT rid FROM kb_fts5_idmap WHERE entry_id=?", (eid,)).fetchone()
            if rid:
                c.execute("UPDATE kb_fts5 SET module=? WHERE rowid=?", (new_m, rid[0]))
        for eid, mod, title, why in pure_mkt:
            c.execute("UPDATE kb_formal SET status='archived', audit_notes=COALESCE(audit_notes,'') || ?, updated_at=CURRENT_TIMESTAMP WHERE entry_id=?",
                      (' [S3.5 营销污染归档：' + why + ']', eid))
        con.commit()
        report['committed'] = True
    else:
        con.rollback()

    # 台账
    lines = ['# KB 治理台账 · 2026-10-14（S3.5）', '',
             '批复口径 docs/COLLATION-AUDIT-20261012.md；红线：不删条目、不改 content 原文。', '',
             '## 结果', '',
             '| 项 | 数量 | 处置 |', '|---|---|---|',
             '| A 真重复组（指纹一致） | %d 组 / 归档 %d 条 | status=archived，留最优 |' % (report['A_exact_dup_groups'], report['A_archived']),
             '| B 泛题名碰撞组 | %d 组 / 改名 %d 条 | title 加「·之NN」定位序号 |' % (report['B_collision_groups'], report['B_renamed']),
             '| C 杂域 module 归一 | %d 条 | 标点写法归一（, / → +），fts5 module 列同步 |' % report['C_module_normalized'],
             '| D 纯营销污染 | %d 条 | status=archived（命理域召回清净） |' % report['D_pure_marketing_archived'],
             '| D 水印型（公众号等单提） | %d 条 | 不动，列清单待清洗管线 |' % report['D_watermark_listed'],
             '', '模式：%s' % ('APPLY 已提交' if APPLY else 'DRY-RUN 未写库'), '']
    if pure_mkt:
        lines += ['## D 纯营销归档明细', '', '| entry_id | 模块 | 标题 | 命中 |', '|---|---|---|---|']
        lines += ['| %s | %s | %s | %s |' % (e, m, (t or '')[:30], w) for e, m, t, w in pure_mkt[:80]]
    json.dump({'watermark': [{'entry_id': e, 'module': m, 'title': t, 'hit': w} for e, m, t, w in watermark]},
              open('reports/kb-governance-watermark-20261014.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open('reports/kb-governance-20261014.md', 'w', encoding='utf-8').write('\n'.join(lines))
    con.close()
    print(json.dumps(report, ensure_ascii=False, indent=1))

if __name__ == '__main__':
    main()
