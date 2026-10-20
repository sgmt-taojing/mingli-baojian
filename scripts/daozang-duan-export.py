#!/usr/bin/env python3
"""daozang-duan-export.py — KB-ZW-056 道藏本十二宫分宫断+逐星总断 → 结构化 JSON

输出 server/database/daozang-duan.json：
  palaces[12]: order/name/narrative/stars{星名:断语}/songs[]/redline_medical
  stars_total[17]: star/wuxing/yinyang/miao/alias/verses[]
解析要点：
  - 宫位段按「一~十二+宫名——」切分，相貌宫尾部在下一个 ◆ 处截断
  - 星曜斜杠断语区取连续 ≥4 段斜杠串；连写缩写链（贵红文美貌）自动拆分为多星共享断语
  - 逐星总断按；分段，星名用枚举交替避免贪婪误吞
  - 疾厄宫/相貌宫标 redline_medical（断语涉健康，服务层挂医师）
"""
import json, re, sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / 'server' / 'database' / 'yidao.db'
OUT = ROOT / 'server' / 'database' / 'daozang-duan.json'

STAR_ABBR = {'紫':'紫微','虚':'天虚','贵':'天贵','印':'天印','寿':'天寿','空':'天空','红':'红鸾',
             '库':'天库','贯':'贯索','文':'文昌','福':'天福','禄':'天禄','杖':'天杖','异':'天异',
             '毛':'毛头','刃':'天刃','刑':'天刑','姚':'天姚','哭':'天哭'}
STARS = list(dict.fromkeys(STAR_ABBR.values()))
ABBR_CHARS = set(STAR_ABBR.keys())
NUM = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'十二':12}

def split_chain(seg):
    """斜杠段拆星：'贵红文美貌' → [('贵',''),('红',''),('文','美貌')]（前星共享末星断语）"""
    chain = []
    i = 0
    while i < len(seg) and seg[i] in ABBR_CHARS:
        chain.append(seg[i]); i += 1
        # 下一字符若仍是缩写且其后还有非缩写文本，继续链；否则退出让当前星带走余文
        if i >= len(seg) or seg[i] not in ABBR_CHARS:
            break
    if not chain:
        return None, seg
    verdict = seg[len(chain):]
    return chain, verdict

def main():
    db = sqlite3.connect(DB)
    content = db.execute("SELECT content FROM kb_formal WHERE entry_id='KB-ZW-056|ziwei-xize|b10'").fetchone()[0]
    db.close()

    sec_re = re.compile(r'([一二三四五六七八九十]+)(命宫|财帛宫|兄弟宫|田宅宫|男女宫|奴仆宫|妻妾宫|疾厄宫|迁移宫|官禄宫|福德宫|相貌宫)(?:（[^）]*）)?——')
    parts = sec_re.split(content)
    palaces = []
    i = 1
    while i + 2 < len(parts):
        num, name, body = parts[i], parts[i+1], parts[i+2]
        body = body.split('◆')[0].strip()
        songs = [s for s in re.findall('「([^」]{14,})」', body)]
        stars = {}
        m = re.search(r'([紫虚贵印寿空红库贯文福禄杖异毛刃刑姚哭][^/。]{1,60}(?:/[^/。]{1,60}){3,})', body)
        if m:
            for seg in m.group(1).split('/'):
                chain, verdict = split_chain(seg)
                if not chain:
                    continue
                for ab in chain:
                    stars[STAR_ABBR[ab]] = verdict.strip()
        narrative = body
        if m: narrative = narrative.replace(m.group(1), ' ')
        for s in songs: narrative = narrative.replace('「'+s+'」', ' ')
        narrative = re.sub(r'\s+', ' ', narrative).strip(' 。;；')
        narrative = re.sub(r'。?\s*。', '。', narrative).strip('。 ') + '。'
        palaces.append({'order': NUM[num], 'name': name, 'narrative': narrative,
                        'stars': stars, 'songs': songs,
                        'redline_medical': name in ('疾厄宫', '相貌宫')})
        i += 3

    star_zone = content.split('◆ 逐星总断')[1].split('◆')[0].split('【批注用法')[0]
    alt = '|'.join(STARS)
    stars_total = []
    for seg in star_zone.split('；'):
        seg = seg.strip(' 。')
        pos = min([seg.find(s) for s in STARS if seg.find(s) >= 0] or [-1])
        if pos < 0: continue
        seg = seg[pos:]
        m = re.match(r'^(' + alt + r')([^——]*)——(.*)$', seg, re.S)
        if not m: continue
        name, attr, body = m.group(1), m.group(2), m.group(3)
        wx = re.search(r'属([金木水火土])', attr)
        yy = re.search(r'(阴|阳)', attr)
        miao = re.search(r'（([^）]*)）', attr)
        verses = re.findall('「([^」]+)」', body)
        stars_total.append({'star': name, 'wuxing': wx.group(1) if wx else '',
                            'yinyang': yy.group(1) if yy else '', 'miao': miao.group(1) if miao else '',
                            'alias': '咸池' if '咸池' in attr else '', 'verses': verses})

    # ZW-057/058 洞微十八星断（卷二/卷三逐星断）并入逐星层——别名+庙旺乐+身命宫断+诗
    dongwei = {}
    for eid in ('KB-ZW-057|ziwei-xize|b10', 'KB-ZW-058|ziwei-xize|b10'):
        db2 = sqlite3.connect(DB)
        row = db2.execute("SELECT content FROM kb_formal WHERE entry_id=?", (eid,)).fetchone()
        db2.close()
        if not row: continue
        zone = row[0]
        zpos = zone.find('十八星断')
        if zpos >= 0: zone = zone[zpos:]
        marks = list(re.finditer(r'([\u4e00-\u9fa5]{2,3})星——', zone))
        for i, mk in enumerate(marks):
            name = mk.group(1)
            if name not in STARS: continue
            end = marks[i+1].start() if i+1 < len(marks) else len(zone)
            body = zone[mk.end():end].split('◆')[0].split('【')[0].strip('；;。 ')
            alias_m = re.search(r'(?:一名|名曰)([^；。]{2,60})', body)
            mwl_m = re.search(r'庙[^；。]{0,20}(?:旺|乐)[^；。]{0,20}', body)
            sm_m = re.search(r'身命宫[^；。]{4,60}', body)
            verses = re.findall('「([^」]{8,})」', body)
            dongwei[name] = {
                'alias': (alias_m.group(1) if alias_m else ''),
                'miao_wang_le': (mwl_m.group(0) if mwl_m else ''),
                'shenming': (sm_m.group(0) if sm_m else ''),
                'verses': verses[:3],
                'text': body[:400],
            }

    out = {
        'source': 'KB-ZW-056/057/058 道藏本十二宫分宫断+逐星总断+洞微十八星断（正统道藏本紫微卷一~卷三 n0275-n0342，公有领域）',
        'system': '十八飞星·杖星为锚（≠通行紫微为锚，两系星性各异严禁混引）',
        'discipline': '凶断淫断存真；疾厄/相貌断涉健康挂医师；相不独论，须与命局同参',
        'palaces': palaces, 'stars_total': stars_total, 'dongwei': dongwei,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1))
    total_star_hits = sum(len(p['stars']) for p in palaces)
    print(f"宫位 {len(palaces)} | 宫星断语 {total_star_hits} 条 | 逐星总断 {len(stars_total)} 星 | 洞微十八星断 {len(dongwei)} 星 → {OUT.name}")

if __name__ == '__main__':
    main()
