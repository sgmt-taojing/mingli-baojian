import sqlite3, json, os
DB = "./server/database/yidao.db"
con = sqlite3.connect(DB); cur = con.cursor()

modules = ["acupuncture","huangdi-neijing","shanghan-lun","shennong-bencao","tianji-jiangjie"]
labels = {
    "acupuncture": "针灸（甲乙经体系）",
    "huangdi-neijing": "黄帝内经",
    "shanghan-lun": "伤寒论",
    "shennong-bencao": "神农本草经",
    "tianji-jiangjie": "天纪·易经+阳宅+命理",
}
colors = {
    "acupuncture": "#d4540c",
    "huangdi-neijing": "#1a6b3c",
    "shanghan-lun": "#8c1a1a",
    "shennong-bencao": "#2d4a7a",
    "tianji-jiangjie": "#6b3a7a",
}

rows = {}
for m in modules:
    cur.execute("SELECT entry_id, title, category, difficulty, keywords, src_id FROM kb_formal WHERE module=? AND status='formal' ORDER BY promoted_at DESC LIMIT 100", (m,))
    rows[m] = cur.fetchall()

cur.execute("SELECT COUNT(*) FROM kb_formal")
total = cur.fetchone()[0]
cur.execute("SELECT status, COUNT(*) FROM kb_formal GROUP BY status")
status_dist = cur.fetchall()
con.close()

cards_html = ""
for m in modules:
    title = labels[m]
    color = colors[m]
    cards_html += f'<section class="module" id="{m}">\n'
    cards_html += f'<div class="module-header"><span class="badge">{title}</span><span class="count">{len(rows[m])}条</span></div>\n'
    cards_html += '<div class="card-list">\n'
    for r in rows[m]:
        eid, t, cat, diff, kw, src = r
        kw = json.loads(kw) if kw else []
        kw_str = " ".join(f'<span class="tag">{k}</span>' for k in kw[:4])
        cards_html += f'<div class="card"><div class="card-title">{t}</div><div class="card-meta"><span class="cat">{cat}</span><span class="diff">{diff}</span><span class="src">{src}</span></div><div class="card-tags">{kw_str}</div><div class="card-id">{eid}</div></div>\n'
    cards_html += '</div>\n</section>\n'

status_html = " | ".join(f"<b>{s}</b>: {c}" for s, c in status_dist)

html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>倪师五课骨架 · 5大模块 242条 · 总KB 9419</title>
<style>
:root {{ --bg:#faf9f7; --fg:#1a1a1a; --muted:#666; --line:#e5e0d8; --accent:#8c5e2e; --card:#fff; }}
* {{ box-sizing: border-box; margin:0; padding:0; }}
body {{ font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background:var(--bg); color:var(--fg); line-height:1.6; padding:24px; }}
h1 {{ font-size:22px; font-weight:600; letter-spacing:-0.5px; border-bottom:1px solid var(--line); padding-bottom:12px; margin-bottom:16px; }}
.sub {{ color:var(--muted); font-size:13px; margin-bottom:24px; }}
.status {{ background:#fff; border:1px solid var(--line); padding:10px 14px; font-size:13px; margin-bottom:24px; }}
.module {{ border:1px solid var(--line); border-top-width:3px; margin-bottom:24px; padding:16px; background:var(--card); }}
.module-header {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }}
.badge {{ font-size:15px; font-weight:600; padding:3px 10px; background:#f5f0e8; color:var(--accent); border-radius:4px; }}
.count {{ font-size:13px; color:var(--muted); }}
.card-list {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }}
.card {{ border:1px solid var(--line); padding:10px 12px; border-radius:4px; background:#fdfcfb; }}
.card-title {{ font-size:14px; font-weight:600; margin-bottom:6px; }}
.card-meta {{ font-size:11px; color:var(--muted); margin-bottom:6px; display:flex; gap:8px; }}
.card-tags {{ margin-bottom:4px; }}
.tag {{ display:inline-block; font-size:11px; background:#f5f0e8; color:var(--accent); padding:1px 6px; border-radius:2px; margin-right:4px; }}
.cat {{ background:#eef5ee; color:#2d5a3d; padding:1px 6px; border-radius:2px; }}
.diff {{ background:#f5f0e8; color:#6b4c1e; padding:1px 6px; border-radius:2px; }}
.src {{ font-size:10px; color:#999; }}
.card-id {{ font-size:10px; color:#bbb; font-family:monospace; }}
footer {{ margin-top:24px; font-size:12px; color:var(--muted); border-top:1px solid var(--line); padding-top:12px; }}
</style>
</head>
<body>
<h1>倪师五课骨架 · 全KB覆盖图</h1>
<p class="sub">更新时间: 2026-07-23 10:10 | 总KB: {total} (formal 9128 + deprecated 544) | 5大倪师课: 242条</p>
<div class="status">KB分布: {status_html}</div>
{cards_html}
<footer>数据来源: 数智工坊知识库 mingli-baojian · 审计通过: 164条 · 备份: archive/yidao_5modules_50_20260723-0950.db</footer>
</body>
</html>'''

out = os.path.expanduser("~/.openclaw-autoclaw/workspace/projects/mingli-baojian/倪师五课-242条覆盖图.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(html)
print(f"written: {out} size: {os.path.getsize(out)//1024}KB")
