#!/usr/bin/env python3
"""
weekly-report.py · 周评估报告渲染器

读 eval/weekly/{WEEK_ID}-{benchmark}.json + training-data/feedback-weekly/{WEEK_ID}.jsonl
产出 DELIVERY/weekly-{WEEK_ID}.html（邮件式周报）

用法：python3 scripts/weekly-report.py [WEEK_ID]
"""

import json
import os
import sys
import re
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent
EVAL_DIR = PROJECT_DIR / 'eval' / 'weekly'
FEEDBACK_DIR = PROJECT_DIR / 'training-data' / 'feedback-weekly'
DELIVERY_DIR = PROJECT_DIR / 'DELIVERY'


def safe_score(d, key='avg_score'):
    if isinstance(d, dict) and key in d:
        return d.get(key, 0)
    return 0


def fmt_pct(v):
    try: return f'{float(v) * 100:.1f}%'
    except: return '—'


def fmt_ms(v):
    try: return f'{int(v)}ms'
    except: return '—'


def render(week_id):
    # 收集三件套
    faithfulness = {}
    cost_budget = {}
    latency = {}
    feedback_count = 0
    feedback_sample = []
    compliance_violations = 0

    for bench, target in [('faithfulness', 'faithfulness'), ('cost-budget', 'cost'), ('latency', 'latency')]:
        f = EVAL_DIR / f'{week_id}-{bench}.json'
        if not f.exists():
            continue
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
        except Exception:
            continue
        if bench == 'faithfulness':
            faithfulness = d
        elif bench == 'cost-budget':
            cost_budget = d
        elif bench == 'latency':
            latency = d

    fb_file = FEEDBACK_DIR / f'{week_id}.jsonl'
    if fb_file.exists():
        with fb_file.open(encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line: continue
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                if obj.get('status') == 'empty':
                    continue
                feedback_count += 1
                feedback_sample.append(obj)
        feedback_sample = feedback_sample[:5]

    comp_file = FEEDBACK_DIR / f'{week_id}-compliance.json'
    if comp_file.exists():
        try:
            cd = json.loads(comp_file.read_text(encoding='utf-8'))
            compliance_violations = cd.get('total_violations', 0)
        except Exception:
            pass

    # 计算 SLO 状态
    faith_score = safe_score(faithfulness)
    faith_slo = '✅' if faith_score >= 0.85 else ('⚠️' if faith_score >= 0.7 else '🔴')
    kb_hit_rate = fmt_pct(faithfulness.get('kb_hit_rate', 0))
    p95 = (latency.get('p95_ms') if isinstance(latency, dict) else None) or 0
    p95_slo = '✅' if p95 < 1500 else ('⚠️' if p95 < 2500 else '🔴')
    kb_direct = fmt_pct(cost_budget.get('kb_direct_rate', 0))
    backend_ai = fmt_pct(cost_budget.get('backend_ai_call_rate', 0))
    backend_ai_slo = '✅' if cost_budget.get('backend_ai_call_rate', 0) <= 0.4 else ('⚠️' if cost_budget.get('backend_ai_call_rate', 0) <= 0.6 else '🔴')
    comp_slo = '✅' if compliance_violations == 0 else ('⚠️' if compliance_violations <= 5 else '🔴')

    # HTML 卡片
    html_rows = []
    for tc in (faithfulness.get('results', []) or [])[:6]:
        score = tc.get('score', 0)
        cls = 'ok' if score >= 0.85 else ('warn' if score >= 0.6 else 'fail')
        html_rows.append(f'<tr class="{cls}"><td>{tc.get("id","")}</td><td>{tc.get("query","")[:30]}</td><td>{score:.2f}</td><td>{fmt_ms(tc.get("latency_ms",0))}</td><td>{(tc.get("note","") or "")[:30]}</td></tr>')
    faith_table = '<table class="grid"><tr><th>ID</th><th>查询</th><th>分数</th><th>延迟</th><th>说明</th></tr>' + ''.join(html_rows) + '</table>' if html_rows else '<div class="empty">本周无 faithfulness 数据</div>'

    # 反馈样本
    fb_html = ''
    if feedback_sample:
        fb_items = []
        for fb in feedback_sample:
            q = (fb.get('query') or fb.get('question') or '—')[:50]
            score = fb.get('score', '—')
            fb_items.append(f'<li><b>{q}</b> — 评分 {score}</li>')
        fb_html = '<ul class="fb-list">' + ''.join(fb_items) + '</ul>'
    else:
        fb_html = '<div class="empty">本周尚无反馈数据</div>'

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>📊 命理宝鉴 · 周评估报告 {week_id}</title>
<style>
body{{font-family:'Noto Serif SC',serif;max-width:900px;margin:24px auto;padding:24px;background:#f5ebd8;color:#1a1207}}
h1{{border-bottom:3px double #8b6f3a;padding-bottom:8px}}
.kpi{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}}
.kpi-card{{padding:14px;background:rgba(201,168,76,.08);border:1px solid #c9a84c;border-radius:8px;text-align:center}}
.kpi-card .val{{font-size:24px;font-weight:bold;margin:6px 0}}
.kpi-card.ok{{border-color:#10b981;background:rgba(16,185,129,.06)}}
.kpi-card.warn{{border-color:#f59e0b;background:rgba(245,158,11,.06)}}
.kpi-card.fail{{border-color:#ef4444;background:rgba(239,68,68,.06)}}
.section{{margin:24px 0;padding:18px;background:rgba(255,247,224,.6);border:1px solid #c9a84c;border-radius:10px}}
.section h2{{color:#5a3811;margin-top:0}}
table.grid{{width:100%;border-collapse:collapse;font-size:13px}}
table.grid th,table.grid td{{padding:6px 8px;border-bottom:1px solid #d4c088;text-align:left}}
table.grid th{{background:rgba(201,168,76,.15);color:#5a3811}}
tr.ok td{{background:rgba(16,185,129,.05)}}
tr.warn td{{background:rgba(245,158,11,.05)}}
tr.fail td{{background:rgba(239,68,68,.05)}}
.empty{{padding:16px;text-align:center;color:#8b6f3a;font-style:italic}}
.fb-list{{padding-left:20px}}
.footer{{margin-top:24px;padding-top:16px;border-top:1px dashed #8b6f3a;font-size:12px;color:#8b6f3a;text-align:center}}
</style>
</head>
<body>
<h1>📊 命理宝鉴 · 周评估报告 {week_id}</h1>
<p>📅 评估周期：{week_id} · 生成时间：{datetime.now().strftime("%Y-%m-%d %H:%M:%S")} · API: <code>{os.environ.get("API_BASE","http://127.0.0.1:8920")}</code></p>

<div class="kpi">
  <div class="kpi-card {"ok" if faith_slo=="✅" else ("warn" if faith_slo=="⚠️" else "fail")}">
    <div>保真度</div>
    <div class="val">{faith_slo} {faith_score:.2f}</div>
    <div>目标 ≥ 0.85</div>
  </div>
  <div class="kpi-card ok">
    <div>KB 命中率</div>
    <div class="val">{kb_hit_rate}</div>
    <div>目标 ≥ 60%</div>
  </div>
  <div class="kpi-card {"ok" if p95_slo=="✅" else ("warn" if p95_slo=="⚠️" else "fail")}">
    <div>P95 延迟</div>
    <div class="val">{p95_slo} {fmt_ms(p95)}</div>
    <div>目标 &lt; 1500ms</div>
  </div>
  <div class="kpi-card {"ok" if backend_ai_slo=="✅" else ("warn" if backend_ai_slo=="⚠️" else "fail")}">
    <div>后端 AI 调用</div>
    <div class="val">{backend_ai_slo} {backend_ai}</div>
    <div>目标 ≤ 40%</div>
  </div>
</div>

<div class="section">
  <h2>📋 评估明细</h2>
  <h3>1. Faithfulness · 保真度</h3>
  {faith_table}
  <p style="font-size:12px;color:#8b6f3a">通过条件：信任度分数 ≥ 0.85 · KB 直答率 ≥ 60% · 幻觉率 ≤ 15%</p>
</div>

<div class="section">
  <h2>💬 反馈样本 · 本周 {feedback_count} 条</h2>
  {fb_html}
</div>

<div class="section">
  <h2>🛡️ 合规扫描</h2>
  <p>本周合规校验：<b style="color:{"#10b981" if comp_slo=="✅" else ("#f59e0b" if comp_slo=="⚠️" else "#ef4444")}">{comp_slo} {compliance_violations} 处违规</b></p>
  <p style="font-size:12px;color:#8b6f3a">合规规则涵盖：医疗诊断替代、性别偏见、未成年人保护、绝对化承诺、高危预测、权威依据、行业通行标注等</p>
</div>

<div class="footer">
  © 命理宝鉴 · 周评估闭环 · 由 weekly-eval.sh 自动生成<br>
  <a href="https://sgmt-taojing.github.io/mingli-baojian/">sgmt-taojing.github.io/mingli-baojian</a>
</div>
</body>
</html>'''
    return html


def main():
    week_id = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime('%Y-W%V')
    print(f"[weekly-report] Generate for {week_id}")
    DELIVERY_DIR.mkdir(parents=True, exist_ok=True)
    out = DELIVERY_DIR / f'weekly-{week_id}.html'
    html = render(week_id)
    out.write_text(html, encoding='utf-8')
    print(f"[weekly-report] ✓ {out} ({out.stat().st_size} bytes)")


if __name__ == '__main__':
    main()