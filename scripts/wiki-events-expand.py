#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wiki-events-expand.py — 验证语料事件二轮扩容（R-WIKI-EXPAND · 2026-09-28）

背景：702 维基名人中 527 人无可用事件（正则太窄：只有结婚/获奖/就任等；
漏了演艺体育最常见的主演/饰演/签约/发行/夺冠等）。两条路：
  阶段1（离线）：86 人有 raw_text 留存 → 扩正则二次提取（秒级）
  阶段2（在线）：441 人无原文 → 重抓 zh.wikipedia 导语再提取（限速 2.5s/批，熔断保断点）
幂等：二次处理过的写 events_fetched_v2=true；全程 UPDATE 不新增人。
用法: python3 wiki-events-expand.py [--offline-only]
"""
import json, re, sqlite3, sys, time, urllib.parse, urllib.request

DB = "/Users/tom/kimi/projects/mingli-baojian/server/database/yidao.db"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh) mingli-corpus/1.1 (research)"}
OFFLINE_ONLY = '--offline-only' in sys.argv

# 扩展事件正则：在 R-WIKI-FILL 基础上补演艺/体育/学术高频动词
EV_PAT = re.compile(
    r"((?:19|20)\d{2})\s*年[^。；;]{0,40}("
    r"结婚|嫁|娶|离婚|逝世|去世|病逝|出道|获[奖得]|荣获|当选|上任|就任|退役|移民|移居|创立|创办|确诊|患癌|入狱|被捕|破产|生子|诞下"
    r"|主演|饰演|签约|发行|推出|发布|出版|夺得|获得|提名|出任|担任|加入|退出|复出|夺冠|夺金|摘金|连任|辞职|卸任|圆寂|登基|即位"
    r")")

BATCH = 50
SLEEP = 2.5


def extract_events(text):
    evs, seen = [], set()
    for m in EV_PAT.finditer(text or ''):
        y = int(m.group(1))
        if not (1800 < y <= 2026):
            continue
        s = m.group(0)
        key = (y, s[:30])
        if key in seen:
            continue
        seen.add(key)
        evs.append({'year': y, 'text': s[:60]})
    return evs[:6]


def get(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8'))


def main():
    db = sqlite3.connect(DB)
    cur = db.cursor()
    rows = cur.execute(
        "SELECT person_id, name, facts_json FROM verification_corpus "
        "WHERE source='Wikidata名人' AND facts_json LIKE '%events_fetched%' "
        "AND facts_json NOT LIKE '%events_fetched_v2%'").fetchall()

    # 筛出无可用事件者
    targets = []
    for pid, name, fj in rows:
        f = json.loads(fj)
        evs = [e for e in (f.get('events') or []) if e.get('year') and 1800 < int(e['year']) <= 2026]
        if not evs:
            targets.append((pid, name, f))
    print(f'无可用事件待扩容: {len(targets)} 人')

    # ══ 阶段1：离线二次提取（有 raw_text/intro 留存者）
    p1_done = p1_hit = 0
    online_todo = []
    for pid, name, f in targets:
        txt = (f.get('raw_text') or '') + (f.get('intro') or '')
        if len(txt) > 100:
            evs = extract_events(txt)
            f['events'] = evs
            f['events_fetched_v2'] = True
            cur.execute("UPDATE verification_corpus SET facts_json=? WHERE person_id=?",
                        (json.dumps(f, ensure_ascii=False), pid))
            p1_done += 1
            if evs:
                p1_hit += 1
        else:
            online_todo.append((pid, name, f))
    db.commit()
    print(f'阶段1 离线二次提取: 处理 {p1_done} 人 · 抽到事件 {p1_hit} 人')

    # ══ 阶段2：在线重抓导语
    p2_hit = 0
    if OFFLINE_ONLY:
        print(f'阶段2 跳过（--offline-only），剩 {len(online_todo)} 人待在线补抓')
    else:
        fail_streak = 0
        for i in range(0, len(online_todo), BATCH):
            if fail_streak >= 2:
                print('[abort] 维基链路不通，断点已留（events_fetched_v2 未标），下次续跑', file=sys.stderr)
                db.commit(); db.close()
                return 2
            batch = online_todo[i:i + BATCH]
            titles = '|'.join(n for _, n, _ in batch)
            url = ('https://zh.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1'
                   '&explaintext=1&redirects=1&format=json&titles=' + urllib.parse.quote(titles))
            try:
                data = get(url)
                pages = data.get('query', {}).get('pages', {})
                by_title = {}
                for pg in pages.values():
                    if 'title' in pg:
                        by_title[pg['title']] = pg.get('extract') or ''
                for pid, name, f in batch:
                    txt = by_title.get(name, '')
                    if txt:
                        evs = extract_events(txt)
                        f['raw_text'] = txt[:4000]
                        f['events'] = evs
                        if evs:
                            p2_hit += 1
                    f['events_fetched_v2'] = True
                    cur.execute("UPDATE verification_corpus SET facts_json=? WHERE person_id=?",
                                (json.dumps(f, ensure_ascii=False), pid))
                db.commit()
                fail_streak = 0
                print(f'  批 {i // BATCH + 1}: {len(batch)} 人处理（累计命中 {p2_hit}）', flush=True)
            except Exception as e:
                fail_streak += 1
                print(f'  批 {i // BATCH + 1} 失败({fail_streak}/2): {repr(e)[:100]}', file=sys.stderr)
            time.sleep(SLEEP)
        print(f'阶段2 在线补抓: 命中事件 {p2_hit} 人')
    db.close()

    # 终盘统计
    db = sqlite3.connect(f'file:{DB}?mode=ro', uri=True)
    allr = db.execute(
        "SELECT facts_json FROM verification_corpus WHERE source='Wikidata名人'").fetchall()
    db.close()
    usable = 0
    for (fj,) in allr:
        f = json.loads(fj)
        if [e for e in (f.get('events') or []) if e.get('year') and 1800 < int(e['year']) <= 2026]:
            usable += 1
    print(f'═══ 终盘：702 名人中有可用事件者 {usable} 人')
    return 0


if __name__ == '__main__':
    sys.exit(main())
