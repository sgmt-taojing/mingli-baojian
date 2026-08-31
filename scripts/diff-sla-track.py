#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""R-DIFF-SLA · 差集吸收 72h SLA 追踪器

规则（KANBAN 2026-08-31 19:45 排期 P2）：
- 链5 差集报告出新差集起计时（first_seen），72h 内须完成定性（KNOWN_EQUIV 登记或移植排期）
- 超时条目输出 WARN（供 health-patrol 接入运维看板告警）
- 已消失（被吸收/定性后不再出现在差集）的条目自动销账

输入：medical-stack/capability-diff-state.json（tcm-capability-diff.py 链5 产出，含条目级清单）
状态：medical-stack/diff-sla-state.json
退出码：0=无超时；1=存在 >72h 未定性条目
"""
import json
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MS = ROOT / 'medical-stack'
DIFF_STATE = MS / 'capability-diff-state.json'
SLA_STATE = MS / 'diff-sla-state.json'
SLA_HOURS = 72
CN = timezone(timedelta(hours=8))


def load(p, default):
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return default


def current_items():
    """从链5 状态提取当前差集条目键（L1 API / L2 模块 / L3 种子 / L4 页面增量）。"""
    last = load(DIFF_STATE, {}).get('last') or {}
    items = []
    for r in last.get('missing_api') or []:
        items.append('L1:' + r)
    for mod in (last.get('module_diffs') or {}).keys():
        items.append('L2:' + mod)
    for s in last.get('seed_missing') or []:
        items.append('L3:' + s)
    # L4 页面差集：52 页已有三分法定性表（DELIVERY/l4-page-triage-20260831.md），
    # 只追踪超出已定性基线的新增部分
    page_gap = last.get('page_gap_count') or 0
    if page_gap > 52:
        items.append(f'L4:page_gap_over_baseline({page_gap - 52})')
    return items


def main() -> int:
    now = datetime.now(CN)
    sla = load(SLA_STATE, {'items': {}})
    known = sla.get('items') or {}
    items = current_items()

    # 新条目登记 first_seen；已消失条目销账
    for k in items:
        known.setdefault(k, {'first_seen': now.isoformat(timespec='seconds')})
    for k in [k for k in known if k not in items]:
        del known[k]

    overdue = []
    pending = []
    for k, v in known.items():
        try:
            t0 = datetime.fromisoformat(v['first_seen'])
        except Exception:
            t0 = now
        age_h = (now - t0).total_seconds() / 3600
        (overdue if age_h > SLA_HOURS else pending).append((k, age_h))

    SLA_STATE.write_text(json.dumps({'items': known, 'last_check': now.isoformat(timespec='seconds')},
                                    ensure_ascii=False, indent=2), encoding='utf-8')

    for k, age in sorted(overdue, key=lambda x: -x[1]):
        print(f'WARN 差集超 72h 未定性: {k}（已挂 {age:.0f}h）')
    if not items:
        print('OK 差集 clean，无在途条目')
    else:
        print(f'OK 在途 {len(pending)} 条（72h 内），超时 {len(overdue)} 条')
    return 1 if overdue else 0


if __name__ == '__main__':
    sys.exit(main())
