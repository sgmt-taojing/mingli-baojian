#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
G24c · nihaisha 主模块内容级分拣（混血模块：天纪命理 × 人纪医学）
医学条目 → domain='reference'；命理/不明条目不动（ADR-024：命理域自主）。
分类依据：标题 + 内容前 300 字关键词；generic 标题（KB-store·xxx#N）靠内容判。
--apply 才落库；默认 dry-run 输出分布与抽样。
"""
import sqlite3, sys, re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from yidao_safe import safe_close  # noqa: E402

DB = ROOT / 'server' / 'database' / 'yidao.db'

MED_RE = re.compile(
    r'伤寒论|金匮|本草|针灸|经络|穴位|经方|扶阳|脉象|脉诊|色脉|舌诊|望诊|八纲|辨证|'
    r'方剂|汤剂|中药|药材|药方|本草|失眠|病症|症候|证型|癌|瘤|瘟疫|伤科|养生|'
    r'黄帝内经|灵枢|素问|脏腑|阴虚|阳虚|湿热|寒湿|痰湿|瘀血|'
    r'黄芪|枸杞|痛风|祛湿|补钙|减肥|瘦身|脱发|白发|腰痛|颈项|颈椎|睡姿|前列腺|'
    r'痴呆|感冒|发烧|咳嗽|便秘|祛痘|美白|饮食有节|吃啥补啥|喝牛奶|钙片|运动|瘦身')
MING_RE = re.compile(
    r'天纪|紫微|斗数|易经|卦|堪舆|地纪|命理|八字|四柱|风水|阳宅|阴宅|玄学|占卜|六壬|奇门|'
    r'面相|手相|姓名|太岁|生肖|大运|流年|十神|用神|格局|神煞|纳音|河图|洛书|太极|天干|地支')

def classify(title, content_head):
    text = (title or '') + ' ' + (content_head or '')
    med = len(MED_RE.findall(text))
    ming = len(MING_RE.findall(text))
    if med > 0 and med >= ming:
        return 'medical', med, ming
    if ming > 0:
        return 'mingli', med, ming
    return 'unknown', med, ming

# 命理条目按标题归位到对应命理模块（nihaisha 在命理报告黑名单里，归位后才可达）
MING_REMODULE = [
    (re.compile(r'紫微|斗数'), 'ziwei'),
    (re.compile(r'易经|卦'), 'yijing'),
    (re.compile(r'堪舆|地纪|风水|阳宅|阴宅'), 'fengshui'),
    (re.compile(r'八字|四柱|命理'), 'bazi'),
    (re.compile(r'奇门'), 'qimen'),
    (re.compile(r'六壬'), 'liuren'),
    (re.compile(r'天纪'), 'tianji-jiangjie'),
]

def main():
    apply = '--apply' in sys.argv
    conn = sqlite3.connect(str(DB) if apply else f'file:{DB}?mode=ro', uri=not apply, timeout=10)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT entry_id, title, substr(content,1,300) head FROM kb_formal WHERE module='nihaisha'").fetchall()
    dist = {'medical': [], 'mingli': [], 'unknown': []}
    for r in rows:
        cls, med, ming = classify(r['title'], r['head'])
        dist[cls].append({'id': r['entry_id'], 'title': r['title'][:46], 'med': med, 'ming': ming})
    print(json.dumps({k: len(v) for k, v in dist.items()}, ensure_ascii=False))
    print('── 医学类抽样 ──')
    for x in dist['medical'][:10]: print('  ', x['title'])
    print('── 不明类全量（人工过目）──')
    for x in dist['unknown'][:40]: print('  ', x['title'])
    if apply:
        cur = conn.cursor()
        cur.execute("DROP TABLE IF EXISTS g24c_backup_20260907")
        cur.execute("""CREATE TABLE g24c_backup_20260907 AS
            SELECT entry_id, module, domain FROM kb_formal WHERE module='nihaisha'""")
        # ①医学 + 不明（倪师健康短讲居多）→ reference（低误伤：命理链路可命中参考域）
        ids = [x['id'] for x in dist['medical']] + [x['id'] for x in dist['unknown']]
        n = 0
        for i in range(0, len(ids), 500):
            ph = ','.join('?' * len(ids[i:i+500]))
            n += cur.execute(f"""UPDATE kb_formal SET domain='reference'
                WHERE entry_id IN ({ph}) AND (domain IS NULL OR domain='')""", ids[i:i+500]).rowcount
        # ②命理条目归位对应命理模块（脱离黑名单模块名，恢复命理链路可达）
        remod = {}
        for x in dist['mingli']:
            for pat, target in MING_REMODULE:
                if pat.search(x['title']):
                    cur.execute("UPDATE kb_formal SET module=? WHERE entry_id=? AND module='nihaisha'",
                                (target, x['id']))
                    remod[target] = remod.get(target, 0) + cur.rowcount
                    break
        conn.commit()
        print(json.dumps({'tagged_reference': n, 'remoduled': remod,
                          'mingli_kept_nihaisha': len(dist['mingli']) - sum(remod.values())},
                         ensure_ascii=False))
    safe_close(conn)

if __name__ == '__main__':
    main()
