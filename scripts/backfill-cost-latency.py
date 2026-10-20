#!/usr/bin/env python3
"""
backfill-cost-latency.py · R195 回填 W24-W30 per-case cost-budget & latency 数据

与 R192 backfill-per-case.py 类似，但针对 cost-budget 和 latency 两个 benchmark。
W24-W30 的 weekly JSON 仅有汇总统计（p50/p95/p99/avg_cost），缺少 per-case results[]。
R136 扩到 30 case 后，W31 首次有完整 per-case 数据。

策略：保留原始汇总数据不变，仅追加 results[] 数组（标记 backfilled=true）
      per-case latency 用当前 KB 重新跑。

用法：
  python3 scripts/backfill-cost-latency.py --weeks 2026-W24,2026-W25,2026-W26,2026-W27,2026-W28,2026-W29,2026-W30
  python3 scripts/backfill-cost-latency.py  # 默认回填 W24-W30
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
import importlib.util
_spec = importlib.util.spec_from_file_location("eval_runner", PROJECT_DIR / "scripts" / "eval-runner.py")
_eval_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_eval_mod)
setup_session = _eval_mod.setup_session
get_csrf = _eval_mod.get_csrf
call_ai_chat = _eval_mod.call_ai_chat


def backfill_week_benchmark(week_id, benchmark, base='http://localhost:8920'):
    """回填单周单 benchmark 的 per-case results"""
    spec_file = EVAL_DIR / f'{benchmark}.json'
    if not spec_file.exists():
        print(f"[skip] {spec_file} 不存在")
        return False

    with open(spec_file) as f:
        spec = json.load(f)
    test_cases = spec.get('test_cases', [])

    target_file = WEEKLY_DIR / f"{week_id}-{benchmark}.json"
    if not target_file.exists():
        print(f"[skip] {target_file} 不存在")
        return False

    with open(target_file) as f:
        existing = json.load(f)

    if existing.get('results'):
        print(f"[skip] {week_id}/{benchmark} 已有 results[] ({len(existing['results'])} 条)，跳过")
        return True

    # 保留原始汇总
    orig_p50 = existing.get('p50_ms')
    orig_p95 = existing.get('p95_ms')
    orig_p99 = existing.get('p99_ms')
    orig_avg_cost = existing.get('avg_cost_yuan')
    orig_total = existing.get('total_cases')
    orig_slo = existing.get('slo')

    # 重跑 30 cases
    opener = setup_session()
    csrf_token = get_csrf(opener, base)

    results = []
    latencies = []
    total_cost = 0

    for tc in test_cases:
        resp = call_ai_chat(opener, base, csrf_token, tc['query'])
        latency = resp.get('latency_ms', 0)
        latencies.append(latency)

        if resp.get('ok'):
            body = resp.get('data', {})
            answer = body.get('reply') or body.get('answer') or body.get('text') or ''
            tokens = len(answer) * 1.5 + len(tc['query']) * 1.5
            cost = tokens / 1000 * 0.0001
            total_cost += cost

        results.append({
            'id': tc['id'],
            'query': tc['query'],
            'latency_ms': latency,
            'ok': resp.get('ok')
        })
        time.sleep(0.05)

    # 写回：保留原始汇总 + 追加 results[] + backfilled 标记
    existing['results'] = results
    existing['backfilled'] = True
    existing['backfill_note'] = f'per-case results 回填于 {time.strftime("%Y-%m-%d %H:%M")}，汇总数据保留原始值'

    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    # 统计
    new_p95 = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0
    new_avg = total_cost / len(results) if results else 0
    print(f"[done] {week_id}/{benchmark}: {len(results)} cases · orig_p95={orig_p95}ms · backfill_p95={new_p95}ms · orig_avg_cost={orig_avg_cost} · backfill_avg_cost={new_avg:.6f}")
    return True


def main():
    parser = argparse.ArgumentParser(description='R195 回填 W24-W30 per-case cost-budget & latency')
    parser.add_argument('--weeks', default='2026-W24,2026-W25,2026-W26,2026-W27,2026-W28,2026-W29,2026-W30',
                        help='逗号分隔的周 ID')
    parser.add_argument('--base', default='http://localhost:8920', help='API gateway base')
    parser.add_argument('--benchmark', choices=['cost-budget', 'latency', 'both'], default='both',
                        help='回填哪个 benchmark')
    args = parser.parse_args()

    weeks = [w.strip() for w in args.weeks.split(',')]
    benchmarks = ['cost-budget', 'latency'] if args.benchmark == 'both' else [args.benchmark]
    print(f"[backfill] 目标: {len(weeks)} 周 × {len(benchmarks)} benchmark · base={args.base}")

    ok = 0
    for w in weeks:
        for b in benchmarks:
            if backfill_week_benchmark(w, b, args.base):
                ok += 1

    total = len(weeks) * len(benchmarks)
    print(f"\n[backfill] 完成: {ok}/{total} 回填成功")


if __name__ == '__main__':
    main()
