#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""厚本五书七字段回填（照 docs/COLLATION-TEMPLATE-YUXIAJI.md 模板卡参数化复用）
对象：协纪辨方书 519 / 六壬大全 614 / 焦氏易林 196 / 渊海子平 134 / 穷通宝鉴 164
红线：只动 category/src_id/keywords/updated_at；title/content/summary 一字不改。
性质分型：原生条目→古籍原文；体质×命格→医命活化；典籍精华→精华蒸馏；阐释类→注解阐释。
回填后须跑 scripts/kb-sync-guard.py --sync 1 同步 fts5 category（唯一合法写入口）。"""
import sqlite3, re, json, datetime, time, sys

NOW = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
DB = 'server/database/yidao.db'

ZERI_SCENE = [('嫁娶|娶送|納婿|冠筓|合帳|安床', '婚嫁'), ('入宅|蓋屋|修造|動土|上樑|開鑿|穿井|作灶', '营建'),
              ('安葬|殯葬|除靈', '葬事'), ('出行|行船|入山', '出行'), ('開張|立契|出財|買田|耕種', '产业'),
              ('祈祀|禳解|禳鎮|進表|法師', '祈禳'), ('上官|襲爵|臨政|應試|入學', '人事'),
              ('太歲|年神|月忌|楊公|天赦|天德|四離|十惡|彭祖|黃黑|九星|三元|洛書|金符', '神煞宜忌')]

def parse_kw(kw):
    """JSON 数组型 keywords 先解析再合并（历史两格式并存）"""
    if not kw: return []
    kw = kw.strip()
    if kw.startswith('['):
        try: return [str(x) for x in json.loads(kw) if str(x).strip()]
        except Exception: return []
    return [k for k in kw.split() if k]

def nature(title):
    if title.startswith('体质×命格'): return '医命活化'
    if title.startswith('典籍精华'): return '精华蒸馏'
    if re.match(r'^(传承脉络|"|\[倪海厦|【)', title): return '注解阐释'
    return '古籍原文'

BOOKS = [
 dict(key='xieji', match=['协纪辨方', '協紀辨方'], book='协纪辨方书', domain='择日', scenes=ZERI_SCENE,
      fx=[(r'本原|義例|义例|論|曰|五行|天干|地支|納音|纳音|洛書|河图|河圖', '义理本原'),
          (r'宜忌|宜|忌', '宜忌通规'), (r'神|煞|太歲|太岁|歲', '神煞'), (r'表|立成|公規|公规', '立成表')],
      fx_default='择日通例'),
 dict(key='liuren', match=['六壬大全'], book='六壬大全', domain='三式', scenes=[],
      fx=[(r'入手法|起課|起课|天地盤|四課|三傳|三传|別責|别责|涉害|遙克|遥克|昴星|伏吟|反吟', '起课法'),
          (r'神將|神将|天將|天将|貴人|贵人|螣蛇|朱雀|六合|勾陳|青龍|白虎|玄武|太常|太陰|天空', '神将'),
          (r'畢法|毕法|課經|课经|課體|课体', '课经毕法'), (r'占|斷|断|驗|验', '占断')],
      fx_default='六壬通例'),
 dict(key='yilin', match=['焦氏易林'], book='焦氏易林', domain='易卦', scenes=[],
      fx=[(r'之', '林辞占验'), (r'卷', '林辞占验')], fx_default='林辞占验'),
 dict(key='yuanhai', match=['渊海子平'], book='渊海子平', domain='八字', scenes=[],
      fx=[(r'格局|用神', '格局用神'), (r'賦|赋|歌|訣|诀', '赋文歌诀'),
          (r'十神|六親|六亲|財官|财官', '十神六亲'), (r'論|论|曰', '子平通论')],
      fx_default='子平通论'),
 dict(key='qiongtong', match=['穷通宝鉴'], book='穷通宝鉴', domain='八字', scenes=[],
      fx=[(r'調候|调候|寒暖|燥濕|燥湿', '调候'), (r'春|夏|秋|冬', '四时调候'),
          (r'喜|忌|用', '喜忌用神')], fx_default='调候通论'),
]

for attempt in range(12):
    try:
        con = sqlite3.connect(DB, timeout=120)
        cur = con.cursor()
        allrows = cur.execute("SELECT entry_id, title, keywords, src_id, category FROM kb_formal WHERE title IS NOT NULL").fetchall()
        total = 0
        for cfg in BOOKS:
            rows = [r for r in allrows if any(m in r[1] for m in cfg['match'])]
            n = 0
            for eid, title, kw, src_id, oldcat in rows:
                nat = nature(title)
                fx = cfg['fx_default']
                for pat, tag in cfg['fx']:
                    if re.search(pat, title): fx = tag; break
                tags = set()
                for pat, sc in cfg['scenes']:
                    if re.search(pat, title): tags.add(sc)
                add = [cfg['book'], cfg['domain'], nat, fx] + sorted(tags)
                kws = parse_kw(kw)
                for a in add:
                    if a not in kws: kws.append(a)
                # src_id 溯源：空→旧 category（多为来源名）→书键
                new_src = src_id if src_id else (oldcat if oldcat else cfg['key'])
                cur.execute("UPDATE kb_formal SET category=?, src_id=?, keywords=?, updated_at=? WHERE entry_id=?",
                            (cfg['book'], new_src, ' '.join(kws), NOW, eid))
                n += 1
            con.commit()
            c = cur.execute("SELECT COUNT(*) FROM kb_formal WHERE category=?", (cfg['book'],)).fetchone()[0]
            print(f"{cfg['book']}: 回填 {n} 条；category 覆盖 {c}")
            total += n
        print(f'== 五书合计回填 {total} 条 ==')
        for book in ['协纪辨方书', '六壬大全', '渊海子平']:
            for r in cur.execute("SELECT title, keywords FROM kb_formal WHERE category=? LIMIT 2", (book,)):
                print(' 样例:', r[0][:34], '|', r[1][:80])
        con.close()
        print('下一步：/usr/bin/python3 scripts/kb-sync-guard.py --sync 1  # 同步 fts5 category')
        sys.exit(0)
    except sqlite3.OperationalError as e:
        print(f'[{attempt+1}/12] 锁库等待… {e}', flush=True); time.sleep(60)
print('12 次重试仍锁，待下棒'); sys.exit(1)
