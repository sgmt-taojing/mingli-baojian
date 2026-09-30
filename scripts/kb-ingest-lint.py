#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""kb-ingest-lint.py — kb_formal 手写 INSERT 闸门（R-INGEST-LINT · 2026-09-30）

规则（R-INGEST-SPEC-20260927）：所有向 kb_formal 写入的脚本必须走
scripts/lib/kb_ingest.py（KBIngestor），禁止手写 INSERT INTO kb_formal。

本脚本扫描 scripts/ 下所有 .py：
  - lib/kb_ingest.py 本身是唯一合法 INSERT 来源；
  - LEGACY_WHITELIST 内为 2026-09-30 前的一次性历史批次脚本（已跑完、
    字段已含指纹/formal 域），登记封存、禁止再跑；改动它们请先改造走新口径；
  - 白名单之外出现手写 INSERT → exit 1（拦新增污染）。

用法：python3 scripts/kb-ingest-lint.py   # 挂 agent-selfcheck 每日节奏
"""
import sys
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SPEC = 'R-INGEST-SPEC-20260927'

# 历史一次性脚本封存登记（2026-09-30 盘点）：仅供查阅，禁止再执行入库
# （首轮 60 条中 8 条经正则核实为 FTS 重建/注释误命中，已移出封存）
LEGACY_WHITELIST = {
    'bazi-t1-batch1.py', 'bazi-t1-batch2.py',
    'import-classics-batch1.py', 'distill-luzong-wangzhen-zhongyi-20260815.py',
    'r493-clean-staging.py', 'ingest-qiongtong-local.py',
    'r484-final-tcm-fill.py', 'r483-tcm-gap-fill.py', 'ingest-xiangshu-tjc.py',
    'r478-final-distill.py', 'ingest-liuren-duanan-local.py',
    'ingest-mingxiang-yunqi.py', 'ingest-xieji.py',
    'r481-staging-batch-promote.py', 'import-shanghan-batch.py',
    'kb-masters/tianji_classified_distill.py', 'kb-masters/distill_authoritative.py',
    'kb-masters/distill_shuhan_deep2.py', 'kb-masters/distill_system_kbs.py',
    'kb-masters/distill_yanzhi2.py', 'kb-masters/distill_ziwei_kb.py',
    'kb-masters/distill_authoritative2.py', 'kb-masters/nishi_subs_distill.py',
    'kb-masters/distill_shuhan_ppt.py', 'kb-masters/distill_nihaisha_pro.py',
    'ingest-yuanhai-batch5.py',
    'distill-desktop-liunian-baoyan-20260815.py',
    'distill-shuhan-l31-l32-20260815.py', 'import-yijing-batch.py',
    'ingest-liuren-zhinan-local.py', 'fix-kb-quality-r366.py',
    'yangsheng-batch2.py', 'ingest-meihua-local.py', 'import-tcm-kb.py',
    'ingest-yilin.py', 'ingest-tianji-backfill-batch11.py',
    'ingest-ziping-pz-anchor-batch9b.py', 'r481-hand-kb-distill.py',
    'ingest-qimen-tongzong-local.py',
    'ingest-sanming-shensha-batch4.py',
    'fix-kb-quality.py', 'ingest-batch10-lantai-bazhishi.py',
    'g24-reference-guard.py', 'ingest-wuxingjingji-batch6.py',
    'ingest-shenfeng-batch7.py', 'ingest-sanming-full-batch12.py',
    'fix-kb-quality-r368.py', 'ingest-qiongtong-batch3.py',
    'g26-r2-gap-distill.py', 'distill-backlog-ingest.py',
    'ingest-batch9-three-books.py',
    'ingest-ditiansui-batch8.py',
}

NEEDLE = re.compile(r'INSERT\s+INTO\s+kb_formal\s*\(', re.I)  # 精确匹配 kb_formal 表（kb_formal_fts 重建不算）


def main():
    offenders, legacy_hit = [], []
    for f in sorted(ROOT.rglob('*.py')):
        rel = str(f.relative_to(ROOT))
        if rel == 'lib/kb_ingest.py' or rel == Path(__file__).name:
            continue
        try:
            txt = f.read_text(encoding='utf-8', errors='replace')
        except Exception:
            continue
        if NEEDLE.search(txt):
            if rel in LEGACY_WHITELIST:
                legacy_hit.append(rel)
            else:
                offenders.append(rel)
    print(f'[kb-ingest-lint] 历史白名单命中 {len(legacy_hit)}/{len(LEGACY_WHITELIST)}（封存，不拦截）')
    stale = LEGACY_WHITELIST - set(legacy_hit)
    for s in sorted(stale):
        print(f'  ○ 白名单条目已无手写 INSERT（可移出封存）：{s}')
    if offenders:
        print(f'[kb-ingest-lint] ✗ 白名单之外发现手写 INSERT INTO kb_formal（违反 {SPEC}）：')
        for o in offenders:
            print(f'  ✗ {o} —— 请改用 scripts/lib/kb_ingest.py KBIngestor')
        return 1
    print(f'[kb-ingest-lint] ✓ 无新增手写 INSERT，口径 {SPEC} 守住')
    return 0


if __name__ == '__main__':
    sys.exit(main())
