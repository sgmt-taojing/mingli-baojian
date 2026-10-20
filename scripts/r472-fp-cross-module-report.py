#!/usr/bin/env python3
"""
R472 · KB 指纹同源多模块地图 — 静态 HTML 报告生成器
查询 kb_formal 的 fingerprint 跨模块分布，生成可视化报告
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime

PROJECT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_DIR / 'server' / 'database' / 'yidao.db'
OUT_PATH = PROJECT_DIR / 'DELIVERY' / 'R472-fp-cross-module-map-2026-08-04.html'

def main():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # 跨模块 fp 组（≥3 模块）
    cur.execute("""
        SELECT fingerprint, COUNT(*) AS total, COUNT(DISTINCT module) AS module_cnt,
               GROUP_CONCAT(DISTINCT module) AS modules,
               ROUND(AVG(trust_score),3) AS avg_trust,
               ROUND(MAX(trust_score),3) AS max_trust,
               SUM(hit_count) AS total_hits
        FROM kb_formal
        WHERE fingerprint IS NOT NULL AND fingerprint != ''
        GROUP BY fingerprint
        HAVING module_cnt >= 3
        ORDER BY module_cnt DESC, total DESC
        LIMIT 100
    """)
    rows = [dict(r) for r in cur.fetchall()]

    # 模块互联统计
    cur.execute("""
        SELECT module, COUNT(*) as entry_count, COUNT(DISTINCT fingerprint) as fp_count
        FROM kb_formal WHERE fingerprint IS NOT NULL AND fingerprint != ''
        GROUP BY module ORDER BY fp_count DESC LIMIT 30
    """)
    module_stats = [dict(r) for r in cur.fetchall()]

    # 全局统计
    cur.execute("SELECT COUNT(*) as total, COUNT(DISTINCT fingerprint) as fps FROM kb_formal WHERE fingerprint IS NOT NULL AND fingerprint != ''")
    global_stats = dict(cur.fetchone())

    conn.close()

    now = datetime.now().strftime('%Y-%m-%d %H:%M')

    # 生成 HTML
    rows_html = ''
    for i, r in enumerate(rows):
        mods = r['modules'].split(',')
        mod_tags = ''.join(f'<span class="module-tag">{m.strip()}</span>' for m in mods[:12])
        if len(mods) > 12:
            mod_tags += f'<span class="more-tag">+{len(mods)-12}</span>'
        rows_html += f'''<tr>
            <td>{i+1}</td>
            <td class="mono">{r['fingerprint'][:30]}</td>
            <td class="num">{r['module_cnt']}</td>
            <td class="num">{r['total']}</td>
            <td class="num">{r['avg_trust']}</td>
            <td class="num">{r['max_trust']}</td>
            <td class="num">{r['total_hits']}</td>
            <td class="mods">{mod_tags}</td>
        </tr>'''

    mods_html = ''
    for m in module_stats:
        bar_pct = min(100, m['fp_count'] / module_stats[0]['fp_count'] * 100)
        mods_html += f'''<div class="mod-bar-row">
            <span class="mod-name">{m['module']}</span>
            <span class="mod-bar"><span class="mod-bar-fill" style="width:{bar_pct:.0f}%"></span></span>
            <span class="mod-stat">{m['fp_count']} fp / {m['entry_count']} 条</span>
        </div>'''

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KB 指纹同源多模块地图 · 易道智鉴</title>
<meta name="robots" content="noindex">
<style>
:root {{ --bg:#0f0f14; --card:#1a1a24; --text:#e0e0e0; --muted:#888; --accent:#c9a84c; --accent2:#4a90d9; --border:#2a2a3a; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif; padding:24px; max-width:1400px; margin:0 auto; }}
h1 {{ font-size:28px; color:var(--accent); margin-bottom:4px; }}
.sub {{ color:var(--muted); font-size:14px; margin-bottom:24px; }}
.stats {{ display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; }}
.stat-card {{ background:var(--card); border:1px solid var(--border); border-radius:8px; padding:16px 20px; flex:1; min-width:140px; }}
.stat-num {{ font-size:28px; font-weight:700; color:var(--accent); }}
.stat-label {{ font-size:12px; color:var(--muted); margin-top:4px; }}
.section {{ margin-bottom:32px; }}
.section-title {{ font-size:18px; color:var(--accent2); margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid var(--border); }}
table {{ width:100%; border-collapse:collapse; background:var(--card); border-radius:8px; overflow:hidden; }}
th {{ background:#222; color:var(--muted); font-size:12px; text-align:left; padding:10px 12px; font-weight:600; }}
td {{ padding:10px 12px; border-bottom:1px solid var(--border); font-size:13px; }}
tr:hover td {{ background:#1e1e2e; }}
.mono {{ font-family:'SF Mono','Menlo',monospace; font-size:11px; color:var(--muted); }}
.num {{ text-align:right; font-variant-numeric:tabular-nums; }}
.module-tag {{ display:inline-block; background:#252535; color:var(--accent2); font-size:11px; padding:2px 6px; border-radius:3px; margin:1px 2px; }}
.more-tag {{ display:inline-block; color:var(--muted); font-size:11px; padding:2px 4px; }}
.mods {{ max-width:400px; line-height:1.8; }}

.mod-bar-row {{ display:flex; align-items:center; gap:12px; margin-bottom:6px; font-size:13px; }}
.mod-name {{ width:120px; color:var(--accent2); text-align:right; flex-shrink:0; }}
.mod-bar {{ flex:1; height:8px; background:#252535; border-radius:4px; overflow:hidden; }}
.mod-bar-fill {{ height:100%; background:linear-gradient(90deg,var(--accent),var(--accent2)); border-radius:4px; }}
.mod-stat {{ width:120px; color:var(--muted); font-size:11px; flex-shrink:0; }}

.footer {{ margin-top:40px; padding-top:16px; border-top:1px solid var(--border); color:var(--muted); font-size:12px; }}
</style>
</head>
<body>

<h1>🔗 KB 指纹同源多模块地图</h1>
<div class="sub">同一知识指纹出现在多个模块中 = 跨领域知识关联 · 生成于 {now}</div>

<div class="stats">
    <div class="stat-card">
        <div class="stat-num">{global_stats['total']:,}</div>
        <div class="stat-label">KB 正式条目</div>
    </div>
    <div class="stat-card">
        <div class="stat-num">{global_stats['fps']:,}</div>
        <div class="stat-label">唯一指纹</div>
    </div>
    <div class="stat-card">
        <div class="stat-num">{len(rows)}</div>
        <div class="stat-label">多模块 fp 组 (≥3)</div>
    </div>
    <div class="stat-card">
        <div class="stat-num">{rows[0]['module_cnt'] if rows else 0}</div>
        <div class="stat-label">最大跨模块数</div>
    </div>
</div>

<div class="section">
    <div class="section-title">📊 模块指纹密度排行</div>
    {mods_html}
</div>

<div class="section">
    <div class="section-title">🔗 跨模块指纹关联 TOP 100</div>
    <table>
        <thead>
            <tr><th>#</th><th>指纹</th><th>模块数</th><th>条目</th><th>均信任</th><th>最大</th><th>点击</th><th>关联模块</th></tr>
        </thead>
        <tbody>
            {rows_html}
        </tbody>
    </table>
</div>

<div class="footer">
    R472 · KB Fingerprint Cross-Module Map · 命理宝鉴 · 数据来源: server/database/yidao.db · kb_formal 表
</div>

</body>
</html>'''

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)

    print(json.dumps({
        'action': 'r472-fp-cross-module-map',
        'output': str(OUT_PATH),
        'fp_groups': len(rows),
        'max_modules': rows[0]['module_cnt'] if rows else 0,
        'total_fps': global_stats['fps'],
        'total_entries': global_stats['total']
    }, ensure_ascii=False))

if __name__ == '__main__':
    main()
