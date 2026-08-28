#!/usr/bin/env python3
"""kb-trunc-repair.py — 截断型条目回源修复。

原理：入库切片时把源文截断在半句（如"曾国藩一生以"），源 JS 知识库文件里留有完整原文。
对每条疑似截断条目：
  1. 按 src_id 经 source_index.path 解析源文件（特殊 src 走内置映射）
  2. 用 content 前 40 字（去空白）在源文归一化文本中定位
  3. 提取外围 JS 字符串字面量并反转义
  4. 校验候选：以当前 content 开头（归一化）、更长 ≥15 字、长度 ≤20000
  5. 替换 content（FTS5 同写 content 列）

排除：r45% 模板卡 / liuyue / koujue-daily / mantra（来源标注结尾属设计形态）、
      元数据卡（含 抽取文字量 / no_text / 截图路径）。

用法：
  python3 scripts/kb-trunc-repair.py --dry-run
  python3 scripts/kb-trunc-repair.py
"""
import argparse
import json
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "server" / "database" / "yidao.db"
DELIVERY = ROOT / "DELIVERY"

PUNCT_END = tuple("。！？；」”.'》）)：:")
EXCLUDE_MODULES = ("r45", "liuyue", "koujue-daily", "mantra")
META_MARKERS = ("抽取文字量", "no_text", "截图路径", "后缀统计")
# 四库全书古籍切片（文言无句读、相邻条目连续，截断属正常切片形态）
CLASSICAL_SLICE_MODULES = ("yizong-jinjian", "jingyue", "qianjin", "danxi", "zhubingyuanhou", "jiayi-jing")
# 结构化卡片的合法结尾行（出处/来源标注，非截断）
CARD_TAIL_RE = re.compile(r"(出处|来源|【来源】|【古籍溯源】)[：:][^\n]*$")

# source_index 无映射但有已知文件的 src
SRC_FILE_OVERRIDE = {
    "SRC-AUTHORITATIVE-LEGACY": "server/kb-store/premium/authoritative-knowledge-base.js",
}

# path 相对目录候选
PATH_BASES = ["server", "server/kb-store/premium", "server/kb-store", "app", ""]

LAIYUAN_RE = re.compile(r"^来源：([^（\n]+?)(?:（[^）]*）)?\s*\n+")


def split_laiyuan(content: str):
    """剥离「来源：路径（…）」元数据头，返回 (body, 来源路径或None)。"""
    m = LAIYUAN_RE.match(content or "")
    if not m:
        return content, None
    return content[m.end():], m.group(1).strip()

_src_cache = {}


def norm(s: str) -> str:
    return re.sub(r"\s+", "", s or "")


def resolve_source(cur, src_id: str, laiyuan_path: str = None):
    """返回源文件绝对路径或 None。优先 content 内嵌来源路径。"""
    if laiyuan_path:
        for base in PATH_BASES:
            p = ROOT / base / laiyuan_path if base else ROOT / laiyuan_path
            if p.exists():
                return p
    if src_id in SRC_FILE_OVERRIDE:
        p = ROOT / SRC_FILE_OVERRIDE[src_id]
        return p if p.exists() else None
    cur.execute("SELECT path FROM source_index WHERE src_id=?", (src_id,))
    row = cur.fetchone()
    if not row or not row[0]:
        return None
    rel = row[0]
    for base in PATH_BASES:
        p = ROOT / base / rel if base else ROOT / rel
        if p.exists():
            return p
    return None


def load_source(path: Path):
    key = str(path)
    if key not in _src_cache:
        raw = path.read_text(encoding="utf-8", errors="replace")
        _src_cache[key] = (raw, norm(raw))
    return _src_cache[key]


def extract_js_string(raw: str, approx_idx: int):
    """从原始文本 approx_idx（归一化坐标已不可靠，需重新在 raw 中定位）提取外围字符串字面量。"""
    pass


def find_full_text(raw: str, content: str):
    """在源文件 raw 中找 content 前缀，返回完整字符串字面量或 None。"""
    # 前缀匹配：content 前 40 字在 raw 中直接查找（raw 中 \n 是转义的 \\n 两个字符，
    # content 里的真换行在 raw 里是字面 \n，所以先把 content 转义成 raw 形态）
    prefix = content[:40]
    esc = prefix.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')
    idx = raw.find(esc)
    if idx < 0:
        # 退化：只用前 20 字
        esc = content[:20].replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')
        idx = raw.find(esc)
        if idx < 0:
            return None
    # 向前找字面量起点：最近的 ": " 或 ":\"" 之后的引号
    start = raw.rfind('"', 0, idx)
    guard = 0
    while start > 0 and guard < 60:
        # 起点引号前面应当是 : 或 , 或 [ 或空白
        j = start - 1
        while j > 0 and raw[j] in " \t":
            j -= 1
        if raw[j] in ":,[\n":
            break
        start = raw.rfind('"', 0, start)
        guard += 1
    if start <= 0:
        return None
    # 向后找未转义引号终点
    i = start + 1
    while i < len(raw):
        if raw[i] == "\\":
            i += 2
            continue
        if raw[i] == '"':
            break
        i += 1
    if i >= len(raw):
        return None
    literal = raw[start + 1:i]
    # 反转义（JS 字符串常见转义）
    out = []
    k = 0
    while k < len(literal):
        if literal[k] == "\\" and k + 1 < len(literal):
            c = literal[k + 1]
            if c == "n":
                out.append("\n")
            elif c == "t":
                out.append("\t")
            elif c == "r":
                out.append("\r")
            elif c == "u" and k + 5 < len(literal):
                try:
                    out.append(chr(int(literal[k + 2:k + 6], 16)))
                    k += 6
                    continue
                except ValueError:
                    out.append(c)
            else:
                out.append(c)
            k += 2
        else:
            out.append(literal[k])
            k += 1
    return "".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    db = sqlite3.connect(str(DB))
    cur = db.cursor()
    cur.execute("SELECT entry_id, module, src_id, content FROM kb_formal")
    cands = []
    for entry_id, module, src_id, content in cur.fetchall():
        if not content:
            continue
        L = len(content)
        if L < 60 or L > 800:
            continue
        if content[-1] in PUNCT_END:
            continue
        if content.startswith("enc:"):
            continue  # 加密病历内容，不可处理
        if any(module.startswith(m) or module == m for m in EXCLUDE_MODULES):
            continue
        if module in CLASSICAL_SLICE_MODULES:
            continue  # 古籍文言切片，无句读属正常
        if any(mk in content for mk in META_MARKERS):
            continue
        if CARD_TAIL_RE.search(content):
            continue  # 出处/来源结尾的结构化卡片
        cands.append((entry_id, module, src_id, content))
    print(f"truncation candidates: {len(cands)}")

    repaired, no_source, no_match, no_gain = [], [], [], []
    for entry_id, module, src_id, content in cands:
        body, laiyuan_path = split_laiyuan(content)
        if len(body) < 30:
            continue
        path = resolve_source(cur, src_id, laiyuan_path)
        if not path:
            no_source.append((entry_id, module, src_id))
            continue
        raw, _ = load_source(path)
        full = find_full_text(raw, body)
        if full is None:
            no_match.append((entry_id, module, src_id))
            continue
        if not norm(full).startswith(norm(body)[:30]):
            no_match.append((entry_id, module, src_id))
            continue
        if len(full) < len(body) + 15 or len(full) > 20000:
            no_gain.append((entry_id, module, len(full), len(content)))
            continue
        # 保留来源头，替换正文
        head = content[:len(content) - len(body)] if laiyuan_path else ""
        repaired.append((entry_id, module, content, head + full))

    import collections
    print(f"repairable: {len(repaired)} | no_source: {len(no_source)} | no_match: {len(no_match)} | no_gain: {len(no_gain)}")
    print("repairable by module:", collections.Counter(m for _, m, _, _ in repaired).most_common(10))
    print("no_source top:", collections.Counter((m, s) for _, m, s in no_source).most_common(6))
    print("no_match top:", collections.Counter((m, s) for _, m, s in no_match).most_common(6))
    print("--- samples ---")
    for entry_id, module, old, new in repaired[:8]:
        print(f"[{module}] {entry_id}")
        print(f"  OLD tail: ...{old[-40:]}")
        print(f"  NEW tail: ...{new[-40:]}")

    if args.dry_run:
        db.close()
        return

    DELIVERY.mkdir(exist_ok=True)
    ts = time.strftime("%Y%m%d-%H%M%S")
    bak = DELIVERY / f"kb-trunc-backup-{ts}.json"
    with open(bak, "w", encoding="utf-8") as f:
        json.dump([{"entry_id": e, "content_old": o} for e, _, o, _ in repaired], f, ensure_ascii=False)
    print(f"backup -> {bak}")

    ts_iso = time.strftime("%Y-%m-%dT%H:%M:%S")
    for entry_id, module, old, new in repaired:
        cur.execute("UPDATE kb_formal SET content=?, updated_at=? WHERE entry_id=?", (new, ts_iso, entry_id))
        cur.execute("UPDATE kb_fts5 SET content=? WHERE entry_id=?", (new, entry_id))
    db.commit()
    cur.execute("SELECT COUNT(*) FROM kb_fts5 WHERE entry_id IN (SELECT entry_id FROM kb_formal)")
    print(f"done. repaired={len(repaired)}")
    db.close()


if __name__ == "__main__":
    sys.exit(main())
