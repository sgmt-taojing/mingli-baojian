#!/usr/bin/env python3
"""空域标归队·mingli 桶（ADR-024 补遗裁决申请配套脚本）

用法：
  python3 scripts/kb_domain_rehome_mingli.py            # dry-run 预览（默认，不写库）
  python3 scripts/kb_domain_rehome_mingli.py --apply    # 批复后执行

动作（仅两字段，不动内容/不动 trust/不动模块名）：
  domain ''/NULL → 'mingli'
  旧粗指纹 → sha256(content)[:16]（复用 09-28 回填规约）
留证：DELIVERY/kb-rehome-mingli-<时间戳>.jsonl（apply 时逐行记录 old→new）
"""
import sqlite3, hashlib, json, datetime, sys, os

ROOT = "/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian"
DB = f"{ROOT}/server/database/yidao.db"
APPLY = "--apply" in sys.argv

# 命理归队模块清单（与 DELIVERY/adr-request-domain-backfill-20260928.md 第二节一致）
MINGLI_MODULES = [
    "authoritative",          # 1,462 premium 命理内容（己土/世爻等实测）
    "r45_shishen_ext", "r45_shishen", "r45_palace", "r45_lifeplan", "r45_huajie",
    "r41_dh_huajie4",
    "naming",                 # 姓名学 81 数理
    "mingli-cross-moved",
    "ziwei", "ziwei,fengshui", "ziwei+yijing+fengshui", "ziwei/cai-bo",
    "ziwei,fengshui,qimen", "ziwei/health", "ziwei-case",
    "qimen", "fengshui",
    "r96-geju", "r96-jieqi", "r96-xinghai", "r96-yueling", "r96-chonghe",
    "koujue-state", "koujue-child",
    "yanzhi",                 # 命理咨询话术（LEARN 沟通法）
    "tianji-mingli",
    "wechat-cases",           # 信众求测案例
    # 内部蒸馏系（命理）
    "distill_fusion_kline_yunqi", "distill_fusion_paipan_code",
    "distill_fusion_sanpan_yixian", "distill_fusion_zhensolar_liushi",
    "distill_wenmo_jieqi", "distill_wenmo_liuri", "distill_wenmo_liushi",
    "distill_wenmo_zhensolar", "distill_wenzhen_liuqi", "distill_wenzhen_sitian",
    "distill_wenzhen_tiangan", "distill_wenzhen_zhuanyun",
    "distill_yuanfen_qimen_api", "distill_yuanfen_ziwei_api",
    "distill_yuanfen_ziwei_sihua", "distill_yuanfen_ziwei_stars",
    "distill_zhiming_dayun", "distill_zhiming_kline", "distill_zhiming_tizheng",
    "distill_zhiming_zhuanzhe",
    # 案例系
    "case_bazi", "case_fengshui", "case_liuren", "case_liuyao",
    "case_meihua", "case_qimen", "case_ziwei",
    # 09-28 抽检改判：原拟隔离桶四模块实为命理内容（标题混入 JS/JSON 碎片，内容正）
    "kb-store", "knowledge-raw", "knowledge-supplement", "kb-supplement",
]

def sha16(content):
    if content is None:
        return None
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")
    return hashlib.sha256(content.encode("utf-8")).hexdigest()[:16]

def is_legacy_fp(fp):
    return fp is None or len(fp) != 16 or any(c not in "0123456789abcdef" for c in fp)

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
ph = ",".join("?" * len(MINGLI_MODULES))
rows = con.execute(
    f"""SELECT entry_id, module, title, content, fingerprint, domain FROM kb_formal
        WHERE (domain IS NULL OR domain='') AND module IN ({ph})""",
    MINGLI_MODULES).fetchall()

by_module = {}
fp_need = 0
for r in rows:
    by_module.setdefault(r["module"], []).append(r)
    if is_legacy_fp(r["fingerprint"]):
        fp_need += 1

print(f"{'APPLY' if APPLY else 'DRY-RUN'} · 命中 {len(rows)} 条 / {len(by_module)} 模块 · 需回填指纹 {fp_need}")
print(f"{'module':<38}{'rows':>6}  样例")
for m in sorted(by_module, key=lambda k: -len(by_module[k])):
    sample = (by_module[m][0]["title"] or "")[:34].replace("\n", " ")
    print(f"{m:<38}{len(by_module[m]):>6}  {sample}")

if APPLY:
    ts = datetime.datetime.now()
    audit = f"{ROOT}/DELIVERY/kb-rehome-mingli-{ts.strftime('%Y%m%d-%H%M%S')}.jsonl"
    now = ts.isoformat(timespec="seconds")
    n_dom = n_fp = 0
    with open(audit, "w", encoding="utf-8") as f:
        for r in rows:
            old_fp = r["fingerprint"]
            new_fp = sha16(r["content"]) if is_legacy_fp(old_fp) else old_fp
            con.execute(
                "UPDATE kb_formal SET domain='mingli', fingerprint=?, updated_at=? WHERE entry_id=?",
                (new_fp, now, r["entry_id"]))
            f.write(json.dumps({
                "entry_id": r["entry_id"], "module": r["module"],
                "domain": [r["domain"], "mingli"],
                "fingerprint": [old_fp, new_fp] if new_fp != old_fp else "unchanged",
                "at": now}, ensure_ascii=False) + "\n")
            n_dom += 1
            if new_fp != old_fp:
                n_fp += 1
    con.commit()
    # 验收
    left = con.execute(
        f"SELECT COUNT(*) FROM kb_formal WHERE (domain IS NULL OR domain='') AND module IN ({ph})",
        MINGLI_MODULES).fetchone()[0]
    coll = con.execute("""SELECT COUNT(*) FROM (SELECT fingerprint FROM kb_formal
        WHERE domain='mingli' GROUP BY fingerprint HAVING COUNT(DISTINCT content)>1)""").fetchone()[0]
    dup = con.execute("""SELECT COUNT(*) FROM (SELECT content FROM kb_formal
        WHERE domain='mingli' GROUP BY content HAVING COUNT(*)>1)""").fetchone()[0]
    print(json.dumps({"applied": n_dom, "fp_backfilled": n_fp, "audit": audit,
                      "left_unlabeled_in_scope": left,
                      "mingli_fp_collisions": coll, "mingli_content_dups": dup},
                     ensure_ascii=False, indent=1))
else:
    print("\n确认无误后执行：python3 scripts/kb_domain_rehome_mingli.py --apply")
con.close()
