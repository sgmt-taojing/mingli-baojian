#!/usr/bin/env python3
"""标题卫生：JS/JSON 碎片标题 → 正文提取正标题（P3，批复后与归队同窗执行）

用法：
  python3 scripts/kb_title_hygiene.py            # dry-run 预览（默认，不写库）
  python3 scripts/kb_title_hygiene.py --apply    # 批复后执行

范围：kb-store / knowledge-raw / knowledge-supplement / kb-supplement / authoritative
五模块空域标行中标题为代码碎片者（"KB-store·…#N"、"Knowledge·…"、含 window./{/< 等）。
提取规则：去「来源：」前缀 → 优先抓 === xxx === / 【xxx】 注释 → 否则取首个含 ≥4 个
汉字的干净句段（截至句号或 24 字）→ 质量门不过关则跳过不改。
安全：title 不在 kb_fts5 触发器 WHEN 子句内，仅展示层变更；apply 后自动 rebuild kb_formal_fts。
留证：DELIVERY/kb-title-hygiene-<时间戳>.jsonl
"""
import sqlite3, re, json, datetime, sys

ROOT = "/Users/tom/kimi/projects/mingli-baojian"
DB = f"{ROOT}/server/database/yidao.db"
APPLY = "--apply" in sys.argv
MODULES = ["kb-store", "knowledge-raw", "knowledge-supplement", "kb-supplement", "authoritative"]
CJK = re.compile(r"[一-鿿]")

def is_junk_title(t: str) -> bool:
    if not t:
        return True
    if t.startswith(("KB-store·", "Knowledge·")):
        return True
    if re.search(r"(window\.|\(function|#\d+$|\.js|\.json)", t):
        return True
    return len(CJK.findall(t)) < 2

def extract_title(content: str):
    """先取首个干净句段（最贴近本条主题），=== 注释 / 【】 仅作兜底。"""
    c = content
    if isinstance(c, bytes):
        c = c.decode("utf-8", errors="replace")
    c = re.sub(r"^来源：[^\n]*?\.js\s*", "", c or "").strip()
    plain = re.sub(r"<[^>]+>", " ", c)             # 去 HTML
    plain = re.sub(r"[#*`>{}\[\]()=;:\"']", " ", plain)  # 去代码/md 符号
    for seg in re.split(r"[\n。！？]", plain):
        seg = seg.strip()
        if len(CJK.findall(seg)) >= 4:
            return seg[:24]
    m = re.search(r"={3,}\s*([^=\n]{2,30}?)\s*={3,}", c)  # === 区块注释 ===（兜底）
    if m and len(CJK.findall(m.group(1))) >= 2:
        return m.group(1).strip()
    m = re.search(r"【([^】]{2,30})】", c)
    if m:
        return m.group(1).strip()
    return None

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
ph = ",".join("?" * len(MODULES))
rows = con.execute(
    f"""SELECT entry_id, module, title, content FROM kb_formal
        WHERE (domain IS NULL OR domain='') AND module IN ({ph})""", MODULES).fetchall()

plan, skip_clean, skip_fail = [], 0, 0
used = {}
for r in rows:
    if not is_junk_title(r["title"] or ""):
        skip_clean += 1
        continue
    new = extract_title(r["content"])
    if new:
        base = new
        n = used.get(base, 0)  # 同题去重：·2 ·3 后缀
        used[base] = n + 1
        if n:
            new = f"{base}·{n + 1}"
    if new and new != r["title"]:
        plan.append((r["entry_id"], r["module"], r["title"], new))
    else:
        skip_fail += 1

print(f"{'APPLY' if APPLY else 'DRY-RUN'} · 扫描 {len(rows)} 条：待修 {len(plan)} · 标题本洁 {skip_clean} · 提取失败跳过 {skip_fail}")
from collections import Counter
print("按模块:", dict(Counter(m for _, m, _, _ in plan)))
print("\n样例（旧 → 新）:")
for eid, m, old, new in plan[:10]:
    print(f"  [{m}] {old[:36]!r} → {new!r}")

if APPLY and plan:
    ts = datetime.datetime.now()
    now = ts.isoformat(timespec="seconds")
    audit = f"{ROOT}/DELIVERY/kb-title-hygiene-{ts.strftime('%Y%m%d-%H%M%S')}.jsonl"
    with open(audit, "w", encoding="utf-8") as f:
        for eid, m, old, new in plan:
            con.execute("UPDATE kb_formal SET title=?, updated_at=? WHERE entry_id=?", (new, now, eid))
            f.write(json.dumps({"entry_id": eid, "module": m, "title": [old, new], "at": now},
                               ensure_ascii=False) + "\n")
    con.commit()
    con.execute("INSERT INTO kb_formal_fts(kb_formal_fts) VALUES('rebuild')")
    con.commit()
    print(json.dumps({"updated": len(plan), "audit": audit, "fts_rebuilt": True},
                     ensure_ascii=False, indent=1))
elif not APPLY:
    print(f"\n确认无误后执行：python3 scripts/kb_title_hygiene.py --apply")
con.close()
