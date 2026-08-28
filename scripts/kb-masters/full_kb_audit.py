# -*- coding: utf-8 -*-
"""KB 全量诊断审计 — 查漏补缺
检查项:
  1. KB 总量 / FTS5 同步
  2. 四路大师来源分布
  3. 模块覆盖（54 模块缺口）
  4. 质量: 短内容 / 重复标题 / trust 分布 / keywords 缺失
  5. 倪师字幕完整性（106 视频 vs 提取 vs 蒸馏）
  6. 源文件残留扫描（桌面/周易-中医 + data2 未采文件）
输出: JSON 摘要 + HTML 报告
"""
import os, re, json, sqlite3, time, glob, sys

PROJ = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
DB = f"{PROJ}/server/database/yidao.db"
SUBS = "/Volumes/data2/nishi-materials/subs"
DESKTOP = "/Users/tom/Desktop/周易-中医"
DATA2 = "/Volumes/data2/nishi-materials"
OUT_HTML = f"{PROJ}/DELIVERY/KB全量诊断审计-2026-08-03.html"

def log(msg):
    print(msg, flush=True)

def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    report = {"time": time.strftime('%Y-%m-%d %H:%M:%S'), "issues": [], "ok": []}

    # ═══ 1. 基础统计 ═══
    cur.execute("SELECT COUNT(*) FROM kb_formal")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM kb_fts5")
    fts5 = cur.fetchone()[0]
    report["total"] = total
    report["fts5"] = fts5
    if total == fts5:
        report["ok"].append(f"FTS5 同步 {fts5}/{total}")
    else:
        # 自动修真: 重建 FTS5
        cur.execute('DELETE FROM kb_fts5')
        cur.execute("INSERT INTO kb_fts5 SELECT DISTINCT entry_id, module, title, COALESCE(content,''), COALESCE(keywords,''), COALESCE(category,'') FROM kb_formal WHERE entry_id IS NOT NULL AND length(content) > 0")
        db.commit()
        cur.execute("SELECT COUNT(*) FROM kb_fts5")
        fts5 = cur.fetchone()[0]
        if fts5 == total:
            report["ok"].append(f"FTS5 自动修真成功: {fts5}/{total}")
        else:
            report["issues"].append(f"❌ FTS5 不同步(修真后): {fts5}/{total}")

    # 字符总量
    cur.execute("SELECT SUM(LENGTH(content)) FROM kb_formal")
    report["chars"] = cur.fetchone()[0]

    # ═══ 2. 四路来源分布 ═══
    sources = {}
    for lab, kw in [("舒晗", "%舒晗%"), ("倪师", "%倪%"), ("路总", "%路总%"), ("路大师", "%路大师%")]:
        cur.execute("SELECT COUNT(*) FROM kb_formal WHERE keywords LIKE ?", (kw,))
        sources[lab] = cur.fetchone()[0]
    report["sources"] = sources

    # ═══ 3. 模块覆盖 ═══
    cur.execute("SELECT module, COUNT(*) FROM kb_formal GROUP BY module ORDER BY COUNT(*) DESC")
    modules = dict(cur.fetchall())
    report["modules"] = modules
    # 关键模块检查
    key_modules = ['bazi', 'ziwei', 'qimen', 'liuyao', 'liuren', 'meihua', 'fengshui',
                   'tcm', 'tcm-classical', 'tcm-herb', 'tcm-fangji', 'shanghan-lun',
                   'wangzhen', 'yijing', 'naming', 'folklore', 'classics', 'mantra',
                   'tcm-acupuncture']
    missing = [m for m in key_modules if m not in modules or modules[m] < 20]
    if missing:
        report["issues"].append(f"关键模块薄弱/缺失: {missing}")
    else:
        report["ok"].append("关键模块全覆盖")

    # ═══ 4. 质量检查 ═══
    # 短内容
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE LENGTH(content) < 150")
    short = cur.fetchone()[0]
    report["short_entries"] = short
    if short > 0:
        report["issues"].append(f"短内容(<150字符): {short} 条")
    else:
        report["ok"].append("无短内容")

    # 重复标题（title+content 双重判断才算真重复）
    cur.execute("""SELECT title, COUNT(*) c FROM (
        SELECT title, content FROM kb_formal GROUP BY title, content HAVING COUNT(*) > 1
    ) GROUP BY title HAVING c > 1 LIMIT 10""")
    dups = cur.fetchall()
    report["dup_titles"] = len(dups)
    if dups:
        preview = [str(d[0])[:20] for d in dups[:3] if d[0]]
        report["issues"].append(f"重复标题(同内容): {len(dups)} 组 (前3: {preview})")
    else:
        report["ok"].append("无真重复标题")

    # trust 分布
    cur.execute("SELECT trust_score, COUNT(*) FROM kb_formal GROUP BY trust_score ORDER BY COUNT(*) DESC LIMIT 8")
    report["trust_dist"] = dict(cur.fetchall())
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE trust_score < 0.7")
    low_trust = cur.fetchone()[0]
    if low_trust > 0:
        report["issues"].append(f"低信任(<0.7): {low_trust} 条")

    # keywords 缺失
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE keywords IS NULL OR keywords = ''")
    no_kw = cur.fetchone()[0]
    report["no_keywords"] = no_kw
    if no_kw > 0:
        report["issues"].append(f"keywords 缺失: {no_kw} 条")

    # ═══ 4.5 术语污染检查（修真 R-TERM · 2026-08-28）═══
    # 六经固定术语「太阳X」曾被 LLM 合规改写污染为「中医X」，此处做回归防护
    TERM_POLLUTION = ['中医病纲要','中医蓄水','中医蓄血','中医中风','中医伤寒',
                      '中医为表','中医提纲','一日中医','中医阳明','中医经证',
                      '中医腑证','中医表证']
    polluted = []
    for bad in TERM_POLLUTION:
        cur.execute("SELECT COUNT(*) FROM kb_formal WHERE content LIKE ? OR title LIKE ?",
                    ('%' + bad + '%', '%' + bad + '%'))
        n = cur.fetchone()[0]
        if n: polluted.append(f"{bad}×{n}")
    if polluted:
        report["issues"].append(f"❌ 术语污染(太阳→中医): {', '.join(polluted)} — 跑 kb_backfill_entry_ids.py 同级修复")
    else:
        report["ok"].append("术语污染检查通过(太阳X 六经术语纯净)")

    # entry_id NULL 回归检查（R117 曾修，后复发）
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id IS NULL")
    null_eid = cur.fetchone()[0]
    if null_eid > 0:
        report["issues"].append(f"❌ entry_id NULL 复发: {null_eid} 条 — 跑 kb_backfill_entry_ids.py")
    else:
        report["ok"].append("entry_id 无 NULL")

    # ═══ 5. 倪师字幕完整性 ═══
    if os.path.exists(SUBS):
        sub_files = [f for f in os.listdir(SUBS) if f.endswith('.txt') and f not in ('progress.log', 'run.log')]
        report["subs_extracted"] = len(sub_files)
        sub_chars = sum(os.path.getsize(os.path.join(SUBS, f)) for f in sub_files)
        report["subs_chars"] = sub_chars
        # 视频总数
        video_count = 0
        for d in os.listdir("/Volumes/data2/倪师智慧结晶"):
            full = os.path.join("/Volumes/data2/倪师智慧结晶", d)
            if os.path.isdir(full):
                video_count += len(glob.glob(os.path.join(full, "*.mp4")))
        report["videos_total"] = video_count
        if len(sub_files) >= video_count - 5:
            report["ok"].append(f"字幕提取接近完成: {len(sub_files)}/{video_count}")
        else:
            report["subs_remaining"] = video_count - len(sub_files)

        # 蒸馏条目
        cur.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id LIKE 'KB-NISHI-VID-%'")
        vid_entries = cur.fetchone()[0]
        report["nishi_vid_entries"] = vid_entries

    # 桌面 PDF 残留（已知文件名关键词表检查）
    if os.path.exists(DESKTOP):
        pdfs = [f for f in os.listdir(DESKTOP) if f.endswith('.pdf')]
        # 已知已处理的关键词
        KNOWN_KEYS = ['葬书', '术数全书', '六壬直指', '紫微斗数', '流年班', '撼龙经',
                      '玉匣记', '相术', '一掌经', '面诊', '甪庸堂', '创业成败',
                      '大六壬', '面诊大全', '神农本草', '黄帝内经']
        unprocessed = []
        for f in pdfs:
            matched = False
            for key in KNOWN_KEYS:
                if key in f:
                    cur.execute("SELECT 1 FROM kb_formal WHERE title LIKE ? LIMIT 1", (f"%{key}%",))
                    if cur.fetchone():
                        matched = True
                        break
            if not matched:
                unprocessed.append(f)
        report["desktop_pdfs"] = len(pdfs)
        report["desktop_unprocessed"] = unprocessed[:10]
        if unprocessed:
            report["issues"].append(f"桌面未采PDF: {len(unprocessed)} 个 (前5: {[u[:25] for u in unprocessed[:5]]})")
        else:
            report["ok"].append("桌面PDF全部处理")

    # ═══ 7. 缺失源文件检查 ═══
    # data2 中 nishi-materials 里的 PDF（未蒸馏的）
    if os.path.exists(DATA2):
        pdfs2 = [f for f in os.listdir(DATA2) if f.endswith('.pdf')]
        # 已蒸馏标记
        distilled = set()
        df_path = f"{DATA2}/distilled-files.json"
        if os.path.exists(df_path):
            with open(df_path) as f:
                try:
                    distilled = {d.get('name') for d in json.load(f)}
                except:
                    pass
        unprocessed2 = []
        for f in pdfs2:
            if f in distilled:
                continue
            # 兜底：title 模糊匹配
            core = os.path.splitext(f)[0][:8]
            cur.execute("SELECT 1 FROM kb_formal WHERE title LIKE ? LIMIT 1", (f"%{core}%",))
            if not cur.fetchone():
                unprocessed2.append(f)
        report["data2_pdfs"] = len(pdfs2)
        report["data2_unprocessed"] = unprocessed2[:10]
        if unprocessed2:
            report["issues"].append(f"data2 未蒸馏PDF: {len(unprocessed2)} 个")
        else:
            report["ok"].append("data2 PDF 全部处理")

    # 汇总
    cur.execute("SELECT COUNT(*) FROM kb_formal WHERE entry_id LIKE 'KB-NISHI-VID-%' OR entry_id LIKE 'KB-FOCR-%' OR entry_id LIKE 'KB-OCR-%'")
    report["ocr_video_entries"] = cur.fetchone()[0]

    report["issue_count"] = len(report["issues"])
    report["ok_count"] = len(report["ok"])
    db.close()

    # 输出摘要
    log(f"\n{'='*50}")
    log(f"KB 全量诊断审计 {report['time']}")
    log(f"{'='*50}")
    log(f"KB 总量: {total} | FTS5: {fts5} | 字符: {report['chars']:,}")
    log(f"四路: 舒晗={sources['舒晗']} 倪师={sources['倪师']} 路总={sources['路总']} 路大师={sources['路大师']}")
    log(f"模块数: {len(modules)}")
    log(f"字幕: {report.get('subs_extracted',0)}/{report.get('videos_total','?')} 个视频")
    log(f"倪师视频条目: {report.get('nishi_vid_entries',0)}")
    log(f"\n✅ 通过: {report['ok_count']} 项")
    for o in report["ok"]:
        log(f"  ✅ {o}")
    log(f"\n⚠️ 问题: {report['issue_count']} 项")
    for i in report["issues"]:
        log(f"  ⚠️ {i}")

    # 生成 HTML
    gen_html(report, total, fts5)
    return report

def gen_html(r, total, fts5):
    s = r["sources"]
    m = r["modules"]
    trust_rows = "".join(f"<tr><td>{t}</td><td>{c}</td></tr>" for t, c in sorted([(str(k), v) for k, v in r["trust_dist"].items() if k is not None], reverse=True)[:8])
    mod_rows = "".join(f"<tr><td>{k}</td><td>{v}</td></tr>" for k, v in sorted(m.items(), key=lambda x: -x[1])[:20])
    issues_html = "".join(f"<li class='warn'>{i}</li>" for i in r["issues"]) or "<li class='ok'>无</li>"
    ok_html = "".join(f"<li class='ok'>{o}</li>" for o in r["ok"]) or "<li>无</li>"

    html = f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KB 全量诊断审计 · {r['time'][:16]}</title>
<style>
:root {{ --bg:#0d0f1a; --card:#151827; --gold:#d4af37; --text:#e8e6df; --dim:#8b8a94; --green:#4ade80; --red:#f87171; --blue:#60a5fa; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:-apple-system,"PingFang SC",sans-serif; line-height:1.6; padding:40px 20px; }}
.wrap {{ max-width:1080px; margin:0 auto; }}
h1 {{ font-size:30px; margin-bottom:6px; }}
.sub {{ color:var(--dim); margin-bottom:28px; }}
.stats {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:28px; }}
.stat {{ background:var(--card); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:14px; }}
.stat .num {{ font-size:24px; font-weight:700; color:var(--gold); }}
.stat .lbl {{ font-size:12px; color:var(--dim); }}
h2 {{ font-size:20px; margin:28px 0 12px; color:var(--gold); border-left:3px solid var(--gold); padding-left:10px; }}
.card {{ background:var(--card); border:1px solid rgba(255,255,255,.06); border-radius:10px; padding:16px; margin-bottom:12px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; }}
th {{ text-align:left; color:var(--gold); padding:6px 8px; border-bottom:1px solid rgba(212,175,55,.3); }}
td {{ padding:6px 8px; border-bottom:1px solid rgba(255,255,255,.05); }}
ul {{ padding-left:20px; }} li {{ margin:4px 0; }}
.ok {{ color:var(--green); }} .warn {{ color:var(--red); }}
.grid2 {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }}
@media(max-width:720px){{ .grid2{{grid-template-columns:1fr;}} }}
.footer {{ margin-top:36px; color:var(--dim); font-size:12px; border-top:1px solid rgba(255,255,255,.08); padding-top:14px; }}
</style></head><body><div class="wrap">
<h1>📊 KB 全量诊断审计</h1>
<div class="sub">四路大师知识库 · {r['time']} · 查漏补缺</div>

<div class="stats">
  <div class="stat"><div class="num">{total:,}</div><div class="lbl">KB 总条目</div></div>
  <div class="stat"><div class="num">{fts5:,}</div><div class="lbl">FTS5 同步</div></div>
  <div class="stat"><div class="num">{r['chars']:,}</div><div class="lbl">总字符</div></div>
  <div class="stat"><div class="num">{len(r['modules'])}</div><div class="lbl">模块数</div></div>
  <div class="stat"><div class="num">{r.get('subs_extracted',0)}</div><div class="lbl">视频字幕提取</div></div>
  <div class="stat"><div class="num">{r.get('nishi_vid_entries',0)}</div><div class="lbl">倪师视频条目</div></div>
</div>

<h2>四路大师分布</h2>
<div class="card"><table>
<tr><th>来源</th><th>条目</th><th>占比</th></tr>
<tr><td>舒晗</td><td>{s['舒晗']}</td><td>{s['舒晗']/total*100:.1f}%</td></tr>
<tr><td>倪师</td><td>{s['倪师']}</td><td>{s['倪师']/total*100:.1f}%</td></tr>
<tr><td>路总</td><td>{s['路总']}</td><td>{s['路总']/total*100:.1f}%</td></tr>
<tr><td>路大师</td><td>{s['路大师']}</td><td>{s['路大师']/total*100:.1f}%</td></tr>
</table></div>

<h2>✅ 通过项 ({r['ok_count']})</h2>
<div class="card"><ul>{ok_html}</ul></div>

<h2>⚠️ 问题项 ({r['issue_count']})</h2>
<div class="card"><ul>{issues_html}</ul></div>

<div class="grid2">
<div class="card"><h2 style="margin-top:0">Trust 分布</h2><table><tr><th>trust</th><th>条数</th></tr>{trust_rows}</table></div>
<div class="card"><h2 style="margin-top:0">Top 20 模块</h2><table><tr><th>模块</th><th>条数</th></tr>{mod_rows}</table></div>
</div>

<div class="footer">命理宝鉴 KB 审计引擎 · 自动生成 · 数据源: yidao.db</div>
</div></body></html>"""
    with open(OUT_HTML, "w") as f:
        f.write(html)
    log(f"\n📄 HTML 报告: {OUT_HTML}")

if __name__ == "__main__":
    main()
