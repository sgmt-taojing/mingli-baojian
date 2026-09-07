#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
G24b · 清单外医学经典模块存量参考域收尾（承接 G24，ADR-024）
范围：G24 任务书清单之外、内容抽样核实为医学域的经典/临床模块；
排除 fingerprint LIKE 'TCMFWD|%'（内化正室）；不改内容/不动 trust/updated_at。
命理域模块（yizhan 焦氏易林/monthly_cure 运势化解/yishi 行业运势）经抽样排除，不打标。
nihaisha 主模块（772 条天纪命理+人纪医学混合）不打标，另案做内容级分拣。
"""
import sqlite3, sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close  # noqa: E402

DB = ROOT / 'server' / 'database' / 'yidao.db'

CLASSIC_TCM_MODULES = [
    'qianjin', 'jinkui-yaolue', 'mingyi-leian', 'zhubingyuanhou', 'rumen-shiqin',
    'wenbing-tiaobian', 'jiayi-jing', 'nanjing', 'wenre-lun', 'piwei-lun',
    'wenyi-lun', 'yilin-gaicuo', 'danxi', 'maijing', 'wenbing', 'neijing',
    'bencao', 'fuyang', 'jingfang', 'fuke', 'erke', 'yanke', 'acupuncture',
    'wangzhen', 'r45_tcm', 'nihaisha-yian', 'nihaisha-acupuncture',
    'nihaisha-shanghanlun', 'tizhi',
]

def main():
    conn = sqlite3.connect(str(DB), timeout=10)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    ph = ','.join('?' * len(CLASSIC_TCM_MODULES))
    report = {}

    # 备份（追加到 G24b 专属表）
    cur.execute("DROP TABLE IF EXISTS g24b_backup_20260907")
    cur.execute(f"""CREATE TABLE g24b_backup_20260907 AS
        SELECT entry_id, module, domain FROM kb_formal WHERE module IN ({ph})""",
        CLASSIC_TCM_MODULES)
    report['backup_rows'] = cur.execute("SELECT COUNT(*) c FROM g24b_backup_20260907").fetchone()['c']

    cur.execute(f"""UPDATE kb_formal SET domain = 'reference'
        WHERE module IN ({ph})
          AND (fingerprint IS NULL OR fingerprint NOT LIKE 'TCMFWD|%')
          AND (domain IS NULL OR domain = '')""", CLASSIC_TCM_MODULES)
    report['tagged'] = cur.rowcount

    left = cur.execute(f"""SELECT COUNT(*) c FROM kb_formal WHERE module IN ({ph})
        AND (domain IS NULL OR domain != 'reference')""", CLASSIC_TCM_MODULES).fetchone()['c']
    left_fwd = cur.execute(f"""SELECT COUNT(*) c FROM kb_formal WHERE module IN ({ph})
        AND (domain IS NULL OR domain != 'reference') AND fingerprint LIKE 'TCMFWD|%'""",
        CLASSIC_TCM_MODULES).fetchone()['c']
    report['untagged_in_scope'] = left
    report['untagged_all_tcmfwd'] = (left == left_fwd)

    report['domain_dist'] = [dict(r) for r in cur.execute(
        "SELECT COALESCE(NULLIF(domain,''),'(none)') d, COUNT(*) c FROM kb_formal GROUP BY domain").fetchall()]
    # 逐模块明细
    report['per_module'] = [dict(r) for r in cur.execute(f"""
        SELECT module,
               SUM(CASE WHEN domain='reference' THEN 1 ELSE 0 END) ref,
               SUM(CASE WHEN domain IS NULL OR domain!='reference' THEN 1 ELSE 0 END) kept
        FROM kb_formal WHERE module IN ({ph}) GROUP BY module ORDER BY ref DESC""",
        CLASSIC_TCM_MODULES).fetchall()]

    conn.commit()
    safe_close(conn)
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
