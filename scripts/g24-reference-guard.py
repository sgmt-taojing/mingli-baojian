#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
g24-reference-guard.py — G24 参考域边界常驻守卫（2026-09-07）

背景：G24 一次性 UPDATE 打标后，staging→formal promote 通道（INSERT OR REPLACE）
会绕过打标——2026-09-07 晨发现 63 条 tcm 系模块条目经 promote 入库无 reference 标
（kb_formal 37,260→37,197 的差额即此）。VACUUM 重建后一并补标并建常驻防线。

两道防线：
  1) 存量补标：医学域模块 + 非 TCMFWD 指纹 + 未标 reference → 补标
  2) 触发器 kb_formal_reference_guard：AFTER INSERT 自动补标（覆盖 promote/
     蒸馏/手工一切写入路径；REPLACE = DELETE+INSERT 同样触发）

边界（与 G24/G24b/G24c/G24d 口径一致）：
  - 医学模块清单 = G24 任务书清单 + nihaisha_pcs/nihaisha-pcs/nihaisha-structured
  - 纯 'nihaisha' 模块不在列（G24c 分拣后留存 15 条为命理内容）
  - TCMFWD|% 指纹 = tcm 15min 通道内化正室，永不打标
"""
from __future__ import annotations

import json
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close  # noqa: E402

DB = ROOT / 'server' / 'database' / 'yidao.db'

MED_MODULES = [
    'nihaisha-tcm', 'tcm', 'huangdi-neijing', 'shanghan-lun', 'yizong-jinjian',
    'jingyue', 'bencao-gangmu', 'tcm-acupuncture', 'tcm-classical', 'shennong-bencao',
    'tcm-clinical', 'tcm-fangji', 'tcm-syndrome', 'tcm-diagnosis', 'tcm-herb',
    'tcm-formula', 'tcm-misc', 'tcm-wangzhen', 'tcm-zhongfu', 'tcm-shenzhi',
    'tcm-basic', 'tcm-engine', 'tcm-device',
    # G24d 追加（倪师混血模块分拣后的医学侧）
    'nihaisha_pcs', 'nihaisha-pcs', 'nihaisha-structured',
]

# 医学判定条件（SQL 片段，触发器与补标共用同一口径）
MED_COND = (
    "(module LIKE 'tcm%' OR module IN ('" + "','".join(MED_MODULES) + "'))"
)
NOT_TCMFWD = "(fingerprint IS NULL OR fingerprint NOT LIKE 'TCMFWD|%')"
NOT_REF = "(domain IS NULL OR domain != 'reference')"

TRIGGER_SQL = f"""
CREATE TRIGGER IF NOT EXISTS kb_formal_reference_guard
AFTER INSERT ON kb_formal
WHEN (NEW.module LIKE 'tcm%' OR NEW.module IN ('{"','".join(MED_MODULES)}'))
 AND (NEW.fingerprint IS NULL OR NEW.fingerprint NOT LIKE 'TCMFWD|%')
 AND (NEW.domain IS NULL OR NEW.domain != 'reference')
BEGIN
    UPDATE kb_formal SET domain='reference' WHERE rowid = NEW.rowid;
END;
"""


def main() -> int:
    report = {'ts': time.strftime('%Y-%m-%dT%H:%M:%S'), 'action': 'g24-reference-guard'}

    conn = sqlite3.connect(str(DB), timeout=15)
    cur = conn.cursor()

    # 1. 存量补标
    cur.execute(f"SELECT COUNT(*) FROM kb_formal WHERE {MED_COND} AND {NOT_TCMFWD} AND {NOT_REF}")
    before = cur.fetchone()[0]
    if before:
        cur.execute(
            f"UPDATE kb_formal SET domain='reference', updated_at=CURRENT_TIMESTAMP "
            f"WHERE {MED_COND} AND {NOT_TCMFWD} AND {NOT_REF}"
        )
        conn.commit()
    report['backfilled'] = before

    # 2. 触发器（幂等）
    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND name='kb_formal_reference_guard'")
    had_trigger = cur.fetchone()[0]
    cur.execute(TRIGGER_SQL)
    conn.commit()
    report['trigger_created'] = not had_trigger

    # 3. 触发器实弹验证（事务内插入医学测试行 → 应自动打标 → 回滚不留痕）
    cur.execute("SAVEPOINT guard_test")
    cur.execute(
        "INSERT INTO kb_formal (entry_id, module, title, content, status, audit_status, created_at, updated_at) "
        "VALUES ('GUARD-TEST-20260907', 'tcm-wangzhen', '守卫自检测试行', '测试', 'formal', 'approved', "
        "CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    cur.execute("SELECT domain FROM kb_formal WHERE entry_id='GUARD-TEST-20260907'")
    test_domain = cur.fetchone()[0]
    cur.execute("ROLLBACK TO guard_test")
    cur.execute("RELEASE guard_test")
    report['trigger_selftest'] = 'pass' if test_domain == 'reference' else f'FAIL(domain={test_domain})'

    # 4. 终态核验：泄漏应为 0
    cur.execute(f"SELECT COUNT(*) FROM kb_formal WHERE {MED_COND} AND {NOT_TCMFWD} AND {NOT_REF}")
    report['leak_after'] = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE domain='reference'")
    report['reference_total'] = cur.fetchone()[0]

    safe_close(conn)

    ok = report['leak_after'] == 0 and report['trigger_selftest'] == 'pass'
    report['status'] = 'ok' if ok else 'error'
    print(json.dumps(report, ensure_ascii=False))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
