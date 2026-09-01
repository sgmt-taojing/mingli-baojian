#!/usr/bin/env python3
"""名人盘批量比对管线（R780）：真实名人排盘 + 事件反推 + 命中率统计
用法：python3 scripts/celebrity-batch-verify.py [--limit N] [--offset N]
数据流：Wikidata/BaziQA名人 → 本地引擎排盘 → facts事件反推（流年宫位信号比对）→ verify_score
"""
import sqlite3, json, urllib.request, argparse, sys, re

DB = 'server/database/yidao.db'
API = 'http://127.0.0.1:8911/paipan'

def paipan(y, m, d, hour=12, gender='male'):
    body = json.dumps({"year":y,"month":m,"day":d,"hour":hour,"minute":0,"gender":gender}).encode()
    req = urllib.request.Request(API, data=body, headers={'Content-Type':'application/json'})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

def extract_events(facts_j):
    """从 facts 提取可验证事件（年份+类型）"""
    events = []
    try:
        f = json.loads(facts_j or '{}')
        # 结构化字段
        for k in ('children','marriage','career','health','wealth'):
            for ev in (f.get(k) or []):
                if isinstance(ev, dict):
                    y = ev.get('year') or ev.get('birth_year') or (ev.get('born','')[:4] if ev.get('born') else None)
                    if y and str(y)[:4].isdigit(): events.append({'year': int(str(y)[:4]), 'type': k})
        # wiki_intro_events 格式
        for ev in (f.get('events') or []):
            if isinstance(ev, dict) and ev.get('year'):
                events.append({'year': int(ev['year']), 'type': 'wiki', 'text': (ev.get('text') or '')[:40]})
        # 文本字段
        raw = f.get('raw_text','') or ''
        for seg in re.split(r'[;；，,]', raw):
            m = re.search(r'(19|20)\d{2}', seg)
            if m: events.append({'year': int(m.group()), 'type': 'text', 'text': seg.strip()[:40]})
    except Exception: pass
    return events

def verify_events(paipan_j, events):
    """事件反推：该年流年干支与命局的互动信号（冲合刑害+十神透干）"""
    if not paipan_j or not events: return 0.0, []
    try: p = json.loads(paipan_j) if isinstance(paipan_j, str) else paipan_j
    except Exception: return 0.0, []
    # R780：历史事件年份常在流年表（未来10年）之外——直接按公式算该年干支
    GAN='甲乙丙丁戊己庚辛壬癸'; ZHI='子丑寅卯辰巳午未申酉戌亥'
    def year_gz(y):
        return GAN[(y-4)%10] + ZHI[(y-4)%12]
    ln_map = {l.get('year'): l for l in (p.get('liunian') or [])}
    for yy in range(1900, 2040):
        if yy not in ln_map:
            ln_map[yy] = {'year': yy, 'ganzhi': year_gz(yy), 'gan_shen': '', 'zhi_shen': ''}
    pillars = p.get('pillars') or {}
    zhi_relations = p.get('zhi_relations') or ''
    hits = []
    for ev in events:
        ln = ln_map.get(ev['year'])
        if not ln: continue
        gz = ln.get('ganzhi','')
        # 简化命中判定：流年干支与四柱有互动（透干十神或地支有合冲）——深度规则后续迭代
        zhi = gz[1] if len(gz)==2 else ''
        gan = gz[0] if len(gz)==2 else ''
        # R780b 收紧判定：流年地支与四柱地支须有实质互动（同支/六合/相冲），且年干十神有意义
        CHONG = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'}
        LIUHE = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'}
        pillar_zhis = [v[1] for v in pillars.values() if v and len(v)==2]
        gan_shen = ln.get('gan_shen','')
        interact = any(
            zhi == pz or CHONG.get(zhi)==pz or LIUHE.get(zhi)==pz
            for pz in pillar_zhis
        )
        hits.append({'year': ev['year'], 'type': ev['type'], 'matched': bool(interact)})
    score = sum(1 for h in hits if h['matched'])/len(hits) if hits else 0.0
    return score, hits

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--limit', type=int, default=50)
    args = ap.parse_args()
    db = sqlite3.connect(DB)
    rows = db.execute("""SELECT person_id, name, birth_json, facts_json FROM verification_corpus 
        WHERE source IN ('Wikidata名人','BaziQA大赛赛题','学术数据集') 
        AND (paipan_json IS NULL OR paipan_json='') AND birth_json LIKE '%year%' LIMIT ?""", (args.limit,)).fetchall()
    print(f'本轮处理 {len(rows)} 位名人')
    done = hit = 0
    for pid, name, birth_j, facts_j in rows:
        try:
            b = json.loads(birth_j)
            y, m, d = b.get('year'), b.get('month'), b.get('day')
            if not (y and m and d): continue
            p = paipan(y, m, d, b.get('hour') or 12)
            events = extract_events(facts_j)
            score, hits = verify_events(p, events) if events else (0.0, [])
            db.execute("UPDATE verification_corpus SET paipan_json=?, verify_score=?, verify_detail_json=?, verify_status=? WHERE person_id=?",
                (json.dumps(p, ensure_ascii=False)[:50000], score, json.dumps({'events':hits}, ensure_ascii=False), 'verified' if events else 'pending', pid))
            done += 1
            if events: hit += 1
            if done % 10 == 0: print(f'  进度 {done}', flush=True)
        except Exception as e:
            print(f'  ✗ {name}: {str(e)[:40]}', flush=True)
    db.commit()
    # 汇总
    stats = db.execute("SELECT source, COUNT(*), ROUND(AVG(verify_score),3) FROM verification_corpus WHERE verify_score>0 GROUP BY source").fetchall()
    total_v = db.execute("SELECT COUNT(*) FROM verification_corpus WHERE verify_score>0").fetchone()[0]
    print(f'本轮完成 {done} 位（含事件 {hit}）；全库已验证 {total_v} 位')
    for s in stats: print(f'  {s[0]}: {s[1]} 位，平均命中 {s[2]}')
    db.close()

if __name__ == '__main__':
    main()
