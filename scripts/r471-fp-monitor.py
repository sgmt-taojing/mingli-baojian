#!/usr/bin/env python3
"""
R471 · fingerprint 变化监控
每晚运行，对比 kb_formal 指纹集与上一次快照，输出增量/减量报告。
基线保存到 scripts/.r471-fp-baseline.json
"""

import sqlite3
import json
import os
import sys
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_DIR / 'server' / 'database' / 'yidao.db'
BASELINE_PATH = PROJECT_DIR / 'scripts' / '.r471-fp-baseline.json'

def load_baseline():
    if BASELINE_PATH.exists():
        with open(BASELINE_PATH) as f:
            return json.load(f)
    return None

def save_baseline(data):
    with open(BASELINE_PATH, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 当前 fp 统计
    cur.execute("""
        SELECT fingerprint, COUNT(*) as cnt, COUNT(DISTINCT module) as modules,
               GROUP_CONCAT(DISTINCT module) as module_list,
               ROUND(AVG(trust_score), 3) as avg_trust,
               MAX(trust_score) as max_trust
        FROM kb_formal
        WHERE fingerprint IS NOT NULL AND fingerprint != ''
        GROUP BY fingerprint
        ORDER BY cnt DESC
    """)
    current = {row['fingerprint']: dict(row) for row in cur.fetchall()}

    # 全量统计
    cur.execute("SELECT COUNT(*) as total, COUNT(DISTINCT module) as modules FROM kb_formal")
    stats = dict(cur.fetchone())

    conn.close()

    now = datetime.now().isoformat()
    current_fps = set(current.keys())

    baseline = load_baseline()
    if not baseline:
        # 首次运行：建立基线
        baseline_data = {
            'created_at': now,
            'total_fps': len(current_fps),
            'total_entries': stats['total'],
            'fps': sorted(current_fps),
            'fp_details': {k: {'cnt': v['cnt'], 'modules': v['module_list']} for k, v in current.items()}
        }
        save_baseline(baseline_data)
        print(json.dumps({
            'ts': now,
            'action': 'r471-fp-monitor',
            'phase': 'baseline_init',
            'total_fps': len(current_fps),
            'total_entries': stats['total'],
            'message': '基线已建立，下次运行将产生 diff'
        }, ensure_ascii=False))
        return

    prev_fps = set(baseline['fps'])

    # 计算 diff
    added = current_fps - prev_fps
    removed = prev_fps - current_fps
    kept = current_fps & prev_fps

    # 新增 fp 详情
    added_details = []
    for fp in sorted(added, key=lambda x: current[x]['cnt'], reverse=True):
        d = current[fp]
        added_details.append({
            'fingerprint': fp,
            'count': d['cnt'],
            'modules': d['module_list'],
            'avg_trust': d['avg_trust']
        })

    # 移除 fp 详情（从 baseline 取）
    removed_details = []
    for fp in sorted(removed):
        d = baseline.get('fp_details', {}).get(fp, {})
        removed_details.append({
            'fingerprint': fp,
            'count': d.get('cnt', '?'),
            'modules': d.get('modules', '?')
        })

    # 判断是否告警
    alert = len(added) > 50 or len(removed) > 10

    report = {
        'ts': now,
        'action': 'r471-fp-monitor',
        'phase': 'diff',
        'baseline_created': baseline.get('created_at'),
        'current': {
            'total_fps': len(current_fps),
            'total_entries': stats['total'],
            'modules': stats['modules']
        },
        'previous': {
            'total_fps': baseline.get('total_fps'),
            'total_entries': baseline.get('total_entries')
        },
        'diff': {
            'added': len(added),
            'removed': len(removed),
            'kept': len(kept),
            'net_change': len(current_fps) - len(prev_fps)
        },
        'added_top10': added_details[:10],
        'removed_top10': removed_details[:10],
        'alert': alert,
        'message': f"+{len(added)} / -{len(removed)} / ={len(kept)} fp 变化{' ⚠️ 异常' if alert else ''}"
    }

    print(json.dumps(report, ensure_ascii=False, indent=2))

    # 更新基线
    baseline_data = {
        'created_at': baseline.get('created_at', now),
        'updated_at': now,
        'total_fps': len(current_fps),
        'total_entries': stats['total'],
        'fps': sorted(current_fps),
        'fp_details': {k: {'cnt': v['cnt'], 'modules': v['module_list']} for k, v in current.items()}
    }
    save_baseline(baseline_data)

    # 退出码：异常变化时返回 1（触发告警）
    sys.exit(1 if alert else 0)

if __name__ == '__main__':
    main()
