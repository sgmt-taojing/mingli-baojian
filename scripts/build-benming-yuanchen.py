#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 corpus/taisui/KR5g0098_000.txt（正统道藏·六十甲子本命元辰历）抽取
六十甲子本命元辰表 → server/data/benming-yuanchen.json
三重校验：①六十甲子全覆盖 ②元辰星↔年支铁律 ③本命/女双线交叉
异文处理：底本讹字与双线异文均注记 note，正文不改写原典（仅校正显误并留痕）。"""
import re, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus/taisui/KR5g0098_000.txt')
OUT = os.path.join(ROOT, 'server/data/benming-yuanchen.json')

raw = open(SRC, encoding='utf-8').read()
body = re.sub(r'<pb:[^>]+>', '', raw)
body = re.sub(r'^#.*$', '', body, flags=re.M)
body = re.sub(r'[¶\s　]+', '', body)
body = body.replace('六十甲子本命元辰曆階四', '').replace('六十甲子本命元辰曆', '')
# 底本讹字：巳卯阴阳不配（巳阴卯阴？非配律之误——巳卯皆阴但其序非甲子旬位），
# 实为「己卯」：女线作「女己卯石文陽從官十五人」可证，且十五人文曲星与卯支铁律吻合
body = body.replace('巳卯本命', '己卯本命')

G = '甲乙丙丁戊己庚辛壬癸'; Z = '子丑寅卯辰巳午未申酉戌亥'
GZ = [G[i % 10] + Z[i % 12] for i in range(60)]
CN = {'九': 9, '十': 10, '十一': 11, '十二': 12, '十三': 13, '十四': 14,
      '十五': 15, '十六': 16, '十七': 17, '十八': 18}
CNT = '(十[一二三四五六七八]?|[二三四五六七八九])'

male = {}
for m in re.finditer(r'([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])本命([一-龥]{3})從官' + CNT + r'人([一-龥]{2,3})星元辰', body):
    gz, name, cnt, star = m.groups()
    male[gz] = {'lord': name, 'attendants': CN.get(cnt), 'star': star}
female = {}
for m in re.finditer(r'女([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])([一-龥]{3})從官' + CNT + r'人', body):
    gz, name, cnt = m.groups()
    female[gz] = {'lord': name, 'attendants': CN.get(cnt)}

miss_m = [g for g in GZ if g not in male]
miss_f = [g for g in GZ if g not in female]
assert not miss_m and not miss_f, f'覆盖缺口: 本命{miss_m} 女{miss_f}'

RULE = {'子': '貪狼', '丑': '巨門', '亥': '巨門', '寅': '禄存', '戌': '禄存',
        '卯': '文曲', '酉': '文曲', '辰': '廉貞', '申': '廉貞', '巳': '武曲',
        '未': '武曲', '午': '破軍'}
bad = [(gz, v['star'], RULE[gz[1]]) for gz, v in male.items()
       if v['star'] != RULE[gz[1]] and not (gz == '乙丑' and v['star'] == '臣門')]
assert not bad, f'星支铁律校验失败: {bad}'
assert all(v['attendants'] for v in male.values()), '从官人数存在未解析项'

NORM_STAR = {'臣門': '巨門'}  # 乙丑底本异文
table = {}
for gz in GZ:
    m_ = male[gz]; f_ = female.get(gz, {})
    note = []
    if m_['star'] in NORM_STAR:
        note.append(f"底本作{m_['star']}，即{NORM_STAR[m_['star']]}")
    if f_ and f_['lord'] != m_['lord']:
        note.append(f"女线作{f_['lord']}")
    if gz == '己卯':
        note.append('底本误作巳卯，据女线及阴阳配律校正')
    table[gz] = {'lord': m_['lord'], 'attendants': m_['attendants'],
                 'star': NORM_STAR.get(m_['star'], m_['star']),
                 'starRaw': m_['star'], 'note': '；'.join(note)}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'source': '六十甲子本命元辰历（正统道藏·正一部·KR5g0098）',
           'built': '2026-09-29', 'table': table},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'OK {OUT} · 60/60 · 星支校验通过')
