#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 corpus/qimen/qimen-tongzong.txt（奇门统宗）抽取格局原典
→ server/data/qm-geju.json。逐条断言锚文存在于原典，断章不杜撰。"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus/qimen/qimen-tongzong.txt')
OUT = os.path.join(ROOT, 'server/data/qm-geju.json')

txt = open(SRC, encoding='utf-8').read()
flat = re.sub(r'\s+', '', txt)  # 去空白便于子串断言

def q(s):
    """断言锚文在原典中，返回原文"""
    assert s.replace('，','').replace('。','') in flat.replace('，','').replace('。',''), f'锚文不在原典: {s[:20]}'
    return s

FU = '奇门统宗·烟波钓叟歌'
TJ = '奇门统宗'

table = {
  '青龙返首': {'source': TJ, 'quote': q('值符六甲加六丙，为青龙回首，木来生火，主兵大利，客亦不凶，出师掠地大振威名。') + '〔歌曰〕' + q('甲加丙兮龙回首，') + q('回首则悦怿易逐，')},
  '飞鸟跌穴': {'source': TJ, 'quote': q('六丙加六甲为飞鸟跌穴，下生上，客兵大利，主亦无灾，出兵战斗大利。若会合生门相助，则坐生击死，一战百胜。') + '〔歌曰〕' + q('丙加甲兮鸟跌穴。') + q('跌穴则显灼易成。')},
  '玉女守门': {'source': FU, 'quote': q('又有三奇游六仪，号为玉女守门时。凡作阴私和合事，请君但向此中推。') + '〔断曰〕' + q('玉女守门物喜食，隐私和合喜盈溢。')},
  '太白入荧': {'source': TJ, 'quote': q('六庚加丙为白入荧，此时贼兵必来。营中当整顿兵马防备以应之，不宜先出兵。') + '〔歌曰〕' + q('白入荧兮贼即来，')},
  '荧入太白': {'source': FU, 'quote': q('荧入白兮贼欲隔。') + '〔断曰〕' + q('如丙临六庚，则客军大利，所向披靡。')},
  '白虎猖狂': {'source': TJ, 'quote': q('六辛加乙为白虎猖狂，客兵利，宜先出兵，百战百胜，闻风披靡，不利为主，兵甲无存。') + '〔歌曰〕' + q('财虚耗兮，辛遇乙而虎猖狂。')},
  '青龙逃走': {'source': TJ, 'quote': q('六乙加辛为青龙逃走，客兵不利，亦不宜先出兵以攻讨，必主大败。') + '〔歌曰〕' + q('身残毁兮，乙遇辛而龙逃走；')},
  '腾蛇妖娇': {'source': TJ, 'quote': q('六癸加丁，昏迷惑乱，事事伤嗟；') + '〔歌曰〕' + q('癸见丁，腾蛇妖矫；')},
  '朱雀投江': {'source': TJ, 'quote': q('六丁加癸，忧愁恐惊，自投刑狱。') + '〔歌曰〕' + q('丁见癸，朱雀投江。')},
  '门迫': {'source': TJ, 'quote': q('兵事分主客：宫为主，星门为客。客生星门利客，星门生宫利主。宫克星门利主，星门克宫利客。') + '〔按〕门克宫即为门迫，伤主。'},
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'source': '奇门统宗（含烟波钓叟歌）', 'built': '2026-09-29', 'table': table},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'OK {OUT} · {len(table)} 格局')
for k, v in table.items():
    print(f"  {k}: {len(v['quote'])} 字 | {v['quote'][:26]}…")
