#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
G24 · 医学存量参考域标注 + 模块标签规范化（ADR-024，2026-09-07 裁判任务书）

任务①：医学域模块存量 → domain='reference'
  - 范围：G24 清单 23 模块 + tcm* 前缀全部
  - 排除：fingerprint LIKE 'TCMFWD|%'（tcm 15min 通道内化正室，不打标）
  - 纪律：不改内容、不删条目、不动 trust/updated_at

任务②：混拼标签归一（只改 module 标签）
  - 医学类归并目标已带 reference 标；jingui/jinkui 两个非 tcm% 源显式补标

回滚：g24_backup_20260907 表留存全部受影响行的 (entry_id, module, domain) 原值。
"""
import sqlite3, sys, os, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close  # noqa: E402

DB = ROOT / 'server' / 'database' / 'yidao.db'

# ═══ G24 任务书圈定的医学域模块清单 ═══
G24_MODULES = [
    'nihaisha-tcm', 'tcm', 'huangdi-neijing', 'shanghan-lun', 'yizong-jinjian',
    'jingyue', 'bencao-gangmu', 'tcm-acupuncture', 'tcm-classical', 'shennong-bencao',
    'tcm-clinical', 'tcm-fangji', 'tcm-syndrome', 'tcm-diagnosis', 'tcm-herb',
    'tcm-formula', 'tcm-misc', 'tcm-wangzhen', 'tcm-zhongfu', 'tcm-shenzhi',
    'tcm-basic', 'tcm-engine', 'tcm-device',
]

# ═══ 任务② 标签归并映射（内容已抽样核实）═══
# (源模块, 目标模块, 归并后是否补 reference 标, 依据)
LABEL_MERGES = [
    ('qimen/shuihan-tcm',        'qimen',           False, '内容=舒晗奇门导图（空亡/击刑/八门），命理域'),
    ('shuihan-tcm',              'qimen',           False, '内容=舒晗奇门重置三法/四害调理，命理域'),
    ('shuhan-tcm',               'tianji-jiangjie', False, '内容=天纪太极校正/先后天八卦/洛书九宫，命理域'),
    ('tcm,shanghan-lun,jinkui',  'jinkui-yaolue',   True,  '内容=倪海厦注金匮章节原文，医学域'),
    ('tcm.clinical',             'tcm-clinical',    True,  '内容=倪海厦诊疗日志医案，医学域'),
    ('tcm/wangzhen',             'tcm-wangzhen',    True,  '内容=望诊数据/采集架构，医学域'),
    ('tcm,fengshui',             'fengshui',        True,  '内容=中医风水跨界融合，保留参考域标'),
    ('梅花',                     'meihua',          False, '内容=梅花易数万物类象，命理域'),
    ('nihaixia',                 'nihaisha',        False, '倪海厦正字归一'),
    ('nihaixia-yian',            'nihaisha-yian',   False, '倪海厦医案正字归一'),
    ('jingui',                   'huangdi-neijing', True,  '内容=素问原文（任脉/四气调神/金匮真言），医学域'),
    ('jinkui',                   'jinkui-yaolue',   True,  '内容=金匮要略章节，医学域'),
]
# 不归并（同族不同内容，提裁判定性）：
#   nihaisha_pcs(1274, 医典§节) vs nihaisha-pcs(80, 梁冬访谈实录)
#   shuhan(504) 舒晗命理正品保留

def main():
    conn = sqlite3.connect(str(DB), timeout=10)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    report = {'steps': []}

    # ── 0. domain 列 ──
    cols = [r['name'] for r in cur.execute("PRAGMA table_info(kb_formal)").fetchall()]
    if 'domain' not in cols:
        cur.execute("ALTER TABLE kb_formal ADD COLUMN domain TEXT DEFAULT ''")
        report['steps'].append('ALTER TABLE kb_formal ADD COLUMN domain')
    else:
        report['steps'].append('domain 列已存在，跳过 ALTER')

    # ── 1. 备份受影响行（打标+归并的全集候选）──
    merge_sources = [m[0] for m in LABEL_MERGES]
    placeholders_g24 = ','.join('?' * len(G24_MODULES))
    placeholders_ms = ','.join('?' * len(merge_sources))
    cur.execute("DROP TABLE IF EXISTS g24_backup_20260907")
    cur.execute(f"""
        CREATE TABLE g24_backup_20260907 AS
        SELECT entry_id, module, domain FROM kb_formal
        WHERE module IN ({placeholders_g24}) OR module LIKE 'tcm%' OR module IN ({placeholders_ms})
    """, G24_MODULES + merge_sources)
    bak_cnt = cur.execute("SELECT COUNT(*) c FROM g24_backup_20260907").fetchone()['c']
    report['backup_rows'] = bak_cnt

    # ── 2. 任务① 打标（排除 TCMFWD 正室）──
    cur.execute(f"""
        UPDATE kb_formal SET domain = 'reference'
        WHERE (module IN ({placeholders_g24}) OR module LIKE 'tcm%')
          AND (fingerprint IS NULL OR fingerprint NOT LIKE 'TCMFWD|%')
          AND (domain IS NULL OR domain = '')
    """, G24_MODULES)
    tagged = cur.rowcount
    report['reference_tagged'] = tagged

    # 正室确认：tcm% 或清单模块里未打标的应全部是指纹 TCMFWD
    fwd_left = cur.execute(f"""
        SELECT COUNT(*) c FROM kb_formal
        WHERE (module IN ({placeholders_g24}) OR module LIKE 'tcm%')
          AND (domain IS NULL OR domain != 'reference')
    """, G24_MODULES).fetchone()['c']
    fwd_chk = cur.execute(f"""
        SELECT COUNT(*) c FROM kb_formal
        WHERE (module IN ({placeholders_g24}) OR module LIKE 'tcm%')
          AND (domain IS NULL OR domain != 'reference')
          AND fingerprint LIKE 'TCMFWD|%'
    """, G24_MODULES).fetchone()['c']
    report['untagged_in_scope'] = fwd_left
    report['untagged_all_tcmfwd'] = (fwd_left == fwd_chk)

    # ── 3. 任务② 标签归并 ──
    merge_results = []
    for src, dst, tag_ref, basis in LABEL_MERGES:
        if tag_ref:
            cur.execute("UPDATE kb_formal SET module = ?, domain = 'reference' WHERE module = ?", (dst, src))
        else:
            cur.execute("UPDATE kb_formal SET module = ? WHERE module = ?", (dst, src))
        merge_results.append({'from': src, 'to': dst, 'rows': cur.rowcount, 'ref_tag': tag_ref, 'basis': basis})
    report['merges'] = merge_results
    report['merge_total'] = sum(m['rows'] for m in merge_results)

    # ── 4. 汇总 ──
    report['domain_dist'] = [dict(r) for r in cur.execute(
        "SELECT COALESCE(NULLIF(domain,''),'(none)') d, COUNT(*) c FROM kb_formal GROUP BY domain").fetchall()]
    report['total'] = cur.execute("SELECT COUNT(*) c FROM kb_formal").fetchone()['c']

    conn.commit()
    safe_close(conn)
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
