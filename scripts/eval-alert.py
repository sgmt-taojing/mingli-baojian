#!/usr/bin/env python3
"""
eval-alert.py · 评估告警聚合器

任务：读 eval/weekly/YYYY-WW-{benchmark}.json 三件套，对比 SLO 阈值 → 输出告警卡
  · 告警等级：CRITICAL（avg_score < 0.6）/ WARN（<0.8）/ OK（≥0.8）
  · 单 case score < 0.2 → 列入「差样本 TOP-N」清单（最多 5 条）
  · 输出两个文件：
      eval/weekly/YYYY-WW-alert-card.json  — 机器可读
      eval/weekly/YYYY-WW-alert-card.md    — 人类可读（贴 IM）
  · 退出码：0 OK / 1 有 WARN / 2 有 CRITICAL
  · 复用 eval-runner.py 写入的 slo.violations 字段，避免重复判定逻辑

用法：
  python3 scripts/eval-alert.py --week 2026-W31            # 单周
  python3 scripts/eval-alert.py --week 2026-W31 --quiet    # 只在违规时输出
  python3 scripts/eval-alert.py --week 2026-W31 --strict   # 提升阈值（warn=0.85）

设计原则：
  · 0 新增依赖（只用 stdlib json/argparse/datetime）
  · 沿用 eval-runner.py 既有 slo 字段，不重复判定
  · 失败兜底：单文件读不到 → 跳过该 bench 不阻塞整轮
"""

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

PROJECT_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = PROJECT_DIR / 'eval'
WEEKLY_DIR = EVAL_DIR / 'weekly'
CST = timezone(timedelta(hours=8))

# 阈值表（与 eval-runner.py 的 slo 字段对齐 + 加严/放宽）
THRESHOLDS = {
    'faithfulness': {
        # 默认：avg_score < 0.6 CRITICAL / < 0.8 WARN / ≥ 0.8 OK
        'default': {'critical': 0.6, 'warn': 0.8},
        'strict':  {'critical': 0.75, 'warn': 0.85},
    },
    'cost-budget': {
        'default': {'critical': 0.10, 'warn': 0.05},  # 超过 = 违规
    },
    'latency': {
        'default': {'critical': 3000, 'warn': 1500},   # p95 超过 = 违规
    },
}

LOW_CASE_THRESHOLD = 0.2   # 单 case 低于此分入「差样本 TOP-N」
TOP_N_LOW = 5              # 最多列 5 个差样本


def load_week(week_id: str) -> dict:
    """读一周三件套 → {benchmark: report_dict or None}"""
    out = {}
    for bench in ['faithfulness', 'cost-budget', 'latency']:
        p = WEEKLY_DIR / f"{week_id}-{bench}.json"
        if not p.exists():
            out[bench] = None
            continue
        try:
            with open(p, encoding='utf-8') as f:
                out[bench] = json.load(f)
        except Exception as e:
            print(f"[WARN] read {p.name} failed: {e}", file=sys.stderr)
            out[bench] = None
    return out


def judge_faithfulness(report: dict, mode: str) -> dict:
    """对 faithfulness 报告分级 + 抽差样本"""
    avg = report.get('avg_score', 0)
    thr = THRESHOLDS['faithfulness'][mode]
    if avg < thr['critical']:
        level = 'CRITICAL'
    elif avg < thr['warn']:
        level = 'WARN'
    else:
        level = 'OK'

    low_cases = []
    for r in report.get('results', []):
        s = r.get('score', 1.0)
        if s < LOW_CASE_THRESHOLD:
            low_cases.append({
                'id': r.get('id'),
                'query': r.get('query', ''),
                'score': s,
                'note': r.get('note', ''),
            })
    low_cases.sort(key=lambda x: x['score'])
    return {
        'level': level,
        'metric': 'avg_score',
        'actual': round(avg, 3),
        'threshold': thr,
        'violations': report.get('slo', {}).get('violations', 1 if level != 'OK' else 0),
        'low_cases': low_cases[:TOP_N_LOW],
    }


def judge_cost_latency(report: dict, bench: str, mode: str) -> dict:
    """对 cost-budget / latency 报告分级（沿用 slo.violations）"""
    thr = THRESHOLDS[bench][mode]
    slo = report.get('slo', {})
    sub = slo.get('latency' if bench == 'latency' else 'cost', {})
    actual = sub.get('p95_actual_ms' if bench == 'latency' else 'avg_actual_yuan', 0)
    target = sub.get('p95_target_ms' if bench == 'latency' else 'avg_target_yuan', 0)
    violations = sub.get('violations', 0)
    if violations == 1:
        if bench == 'latency' and actual > thr['critical']:
            level = 'CRITICAL'
        elif bench == 'cost-budget' and actual > thr['critical']:
            level = 'CRITICAL'
        else:
            level = 'WARN'
    else:
        level = 'OK'
    return {
        'level': level,
        'metric': 'p95_ms' if bench == 'latency' else 'avg_yuan',
        'actual': actual,
        'target': target,
        'violations': violations,
    }


def render_card(week_id: str, judgments: dict, mode: str) -> tuple:
    """渲染告警卡 → (json, md)"""
    # 整体判定（取最严等级）
    rank = {'OK': 0, 'WARN': 1, 'CRITICAL': 2}
    overall = max(
        (j['level'] for j in judgments.values() if j),
        key=lambda l: rank[l],
        default='OK',
    )

    now = datetime.now(CST).strftime('%Y-%m-%d %H:%M:%S CST')
    icon = {'OK': '✅', 'WARN': '⚠️', 'CRITICAL': '🔴'}[overall]

    # ── Markdown ──
    lines = [
        f'## {icon} Eval 告警 · {week_id}（{overall}）',
        '',
        f'- 生成时间：{now}',
        f'- 模式：{mode}',
        '',
    ]
    for bench, j in judgments.items():
        if j is None:
            lines.append(f'- **{bench}**：⏭ 跳过（无数据）')
            continue
        bi = {'OK': '✅', 'WARN': '⚠️', 'CRITICAL': '🔴'}[j['level']]
        metric = j['metric']
        actual = j['actual']
        thr = j.get('threshold')
        if isinstance(thr, dict):
            tgt = f"阈值 critical={thr['critical']} warn={thr['warn']}"
        else:
            tgt = f"目标 {j.get('target', '?')}"
        lines.append(f'- **{bench}** · {bi} {j["level"]} · {metric}={actual} · {tgt}')
        if bench == 'faithfulness' and j.get('low_cases'):
            lines.append('')
            lines.append('  **差样本 TOP-{}**：'.format(len(j['low_cases'])))
            for c in j['low_cases']:
                lines.append(f"  - `{c['id']}` score={c['score']} | {c['query'][:40]} | {c['note'][:60]}")
    lines.append('')
    if overall == 'CRITICAL':
        lines.append('> 🚨 **需立即处理** —— 建议派 R125 扩 case 或调阈值')
    elif overall == 'WARN':
        lines.append('> 👀 **观察** —— 周内复测确认趋势')
    else:
        lines.append('> 🎉 **全绿** —— 维持当前 KB 质量与提示词')

    md = '\n'.join(lines)

    # ── JSON ──
    js = {
        'week': week_id,
        'generated_at': now,
        'mode': mode,
        'overall_level': overall,
        'judgments': judgments,
    }
    return js, md


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--week', required=True, help='ISO week, e.g. 2026-W31')
    parser.add_argument('--mode', choices=['default', 'strict'], default='default')
    parser.add_argument('--quiet', action='store_true', help='只在违规时输出到 stdout')
    args = parser.parse_args()

    reports = load_week(args.week)

    judgments = {}
    if reports['faithfulness']:
        judgments['faithfulness'] = judge_faithfulness(reports['faithfulness'], args.mode)
    else:
        judgments['faithfulness'] = None
    for bench in ['cost-budget', 'latency']:
        if reports[bench]:
            judgments[bench] = judge_cost_latency(reports[bench], bench, args.mode)
        else:
            judgments[bench] = None

    js, md = render_card(args.week, judgments, args.mode)

    # 写文件
    json_out = WEEKLY_DIR / f"{args.week}-alert-card.json"
    md_out = WEEKLY_DIR / f"{args.week}-alert-card.md"
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(js, f, ensure_ascii=False, indent=2)
    with open(md_out, 'w', encoding='utf-8') as f:
        f.write(md)

    # stdout
    rank = {'OK': 0, 'WARN': 1, 'CRITICAL': 2}
    overall = js['overall_level']
    if not args.quiet or overall != 'OK':
        print(md)
        print(f'\n[eval-alert] week={args.week} overall={overall} → {md_out.name}')

    sys.exit(rank[overall])


if __name__ == '__main__':
    main()