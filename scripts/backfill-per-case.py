#!/usr/bin/env python3
"""
backfill-per-case.py · R192 回填 W24-W30 per-case faithfulness 数据

用途：W24-W30 的 faithfulness.json 仅有汇总统计（avg_score/kb_hits），
      缺少 per-case results[] 数组，导致 eval-dashboard 跨周汇总表和
      模块趋势表只有 W31 有 per-case 数据。

策略：保留原始汇总数据不变，仅追加 results[] 数组（标记 backfilled=true）
      per-case 分数用当前 KB 重新跑，与历史 avg_score 可能有细微差异。

用法：
  python3 scripts/backfill-per-case.py --weeks 2026-W24,2026-W25,2026-W26,2026-W27,2026-W28,2026-W29,2026-W30
  python3 scripts/backfill-per-case.py  # 默认回填 W24-W30
"""

import json
import time
import urllib.request
import urllib.parse
import http.cookiejar
import argparse
import os
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = PROJECT_DIR / 'eval'
WEEKLY_DIR = EVAL_DIR / 'weekly'

# 复用 eval-runner 的核心函数
# eval-runner.py uses hyphenated name — use importlib for import
import importlib.util
_spec = importlib.util.spec_from_file_location("eval_runner", PROJECT_DIR / "scripts" / "eval-runner.py")
_eval_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_eval_mod)
setup_session = _eval_mod.setup_session
get_csrf = _eval_mod.get_csrf
call_ai_chat = _eval_mod.call_ai_chat
judge_faithfulness = _eval_mod.judge_faithfulness


def backfill_week(week_id, base='http://localhost:8920'):
    """回填单周 per-case results"""
    spec_file = EVAL_DIR / 'faithfulness.json'
    with open(spec_file) as f:
        spec = json.load(f)
    test_cases = spec.get('test_cases', [])

    target_file = WEEKLY_DIR / f"{week_id}-faithfulness.json"
    if not target_file.exists():
        print(f"[skip] {target_file} 不存在")
        return False

    with open(target_file) as f:
        existing = json.load(f)

    if existing.get('results'):
        print(f"[skip] {week_id} 已有 results[] ({len(existing['results'])} 条)，跳过")
        return True

    # 保留原始汇总
    orig_avg = existing.get('avg_score')
    orig_kb_hits = existing.get('kb_hits')
    orig_kb_rate = existing.get('kb_hit_rate')
    orig_total = existing.get('total_cases')

    # 重跑 30 cases
    opener = setup_session()
    csrf_token = get_csrf(opener, base)

    results = []
    for tc in test_cases:
        resp = call_ai_chat(opener, base, csrf_token, tc['query'], '', tc)
        judgment = judge_faithfulness(tc['query'], tc.get('expected_path', 'KB'), resp, tc)
        results.append({
            'id': tc['id'],
            'query': tc['query'],
            'expected_path': tc.get('expected_path'),
            'score': judgment['score'],
            'note': judgment['note'],
            'latency_ms': resp.get('latency_ms'),
            'ok': resp.get('ok')
        })
        time.sleep(0.05)  # 轻微限速

    # 写回：保留原始汇总 + 追加 results[] + backfilled 标记
    existing['results'] = results
    existing['backfilled'] = True
    existing['backfill_note'] = f'per-case results 回填于 {time.strftime("%Y-%m-%d %H:%M")}，汇总数据保留原始值'

    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    # 统计
    new_avg = sum(r['score'] for r in results) / len(results) if results else 0
    print(f"[done] {week_id}: {len(results)} cases · orig_avg={orig_avg} · backfill_avg={new_avg:.3f}")
    return True


def main():
    parser = argparse.ArgumentParser(description='R192 回填 W24-W30 per-case faithfulness')
    parser.add_argument('--weeks', default='2026-W24,2026-W25,2026-W26,2026-W27,2026-W28,2026-W29,2026-W30',
                        help='逗号分隔的周 ID')
    parser.add_argument('--base', default='http://localhost:8920', help='API gateway base')
    args = parser.parse_args()

    weeks = [w.strip() for w in args.weeks.split(',')]
    print(f"[backfill] 目标: {len(weeks)} 周 · base={args.base}")

    ok = 0
    for w in weeks:
        if backfill_week(w, args.base):
            ok += 1

    print(f"\n[backfill] 完成: {ok}/{len(weeks)} 周回填成功")


if __name__ == '__main__':
    main()
