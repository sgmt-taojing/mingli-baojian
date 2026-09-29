#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 corpus/yijing/周易_<卦>.txt（维基文库本，已在库同文本）抽取 64 卦
卦辞/彖曰/象曰/爻辞 → server/data/yj-guaci.json。原典不改写，仅去版式标记。
校验：64 卦全覆盖、每卦 6 爻辞（乾坤多 用九/用六）、卦辞非空。"""
import re, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, 'corpus/yijing')
OUT = os.path.join(ROOT, 'server/data/yj-guaci.json')

# 64 卦简名 → 语料文件繁体名
FILE_NAME = {
    '乾':'乾','坤':'坤','屯':'屯','蒙':'蒙','需':'需','讼':'訟','师':'師','比':'比',
    '小畜':'小畜','履':'履','泰':'泰','否':'否','同人':'同人','大有':'大有','谦':'謙','豫':'豫',
    '随':'隨','蛊':'蠱','临':'臨','观':'觀','噬嗑':'噬嗑','贲':'賁','剥':'剝','复':'復',
    '无妄':'无妄','大畜':'大畜','颐':'頤','大过':'大過','坎':'坎','离':'離','咸':'咸','恒':'恆',
    '遁':'遯','大壮':'大壯','晋':'晉','明夷':'明夷','家人':'家人','睽':'睽','蹇':'蹇','解':'解',
    '损':'損','益':'益','夬':'夬','姤':'姤','萃':'萃','升':'升','困':'困','井':'井',
    '革':'革','鼎':'鼎','震':'震','艮':'艮','渐':'漸','归妹':'歸妹','丰':'豐','旅':'旅',
    '巽':'巽','兑':'兌','涣':'渙','节':'節','中孚':'中孚','小过':'小過','既济':'既濟','未济':'未濟',
}
YAO_LABEL = ['初', '二', '三', '四', '五', '上']

def clean(t):
    t = re.sub(r'-\{([^|}]*\|)?([^}]*)\}-', r'\2', t)  # -{周易/乾}- → 乾；-{无}- → 无
    t = re.sub(r'\{\{[^}]*\}\}', '', t)
    return t.strip()

def parse_gua(path):
    raw = open(path, encoding='utf-8').read()
    txt = clean(raw)
    # 卦辞：*易經：下一行 **…（有「卦名：」前缀则剥除；履卦等卦名入卦辞者无前缀）
    me = re.search(r'\*易經[：:]\s*\*\*([^\n*]+)', txt)
    gua_ci = ''
    if me:
        gua_ci = re.sub(r'^[^：:，。]{1,4}[：:]', '', me.group(1).strip())
    # 爻辞：*#初九：… / *#九二：…（阳爻九阴爻六；初二…上+乾坤用九用六）
    yaos = {}
    POS_OF = {'初': 0, '二': 1, '三': 2, '四': 3, '五': 4, '上': 5}
    for ym in re.finditer(r'\*#\s*(初[九六]|[九六][二三四五]|上[九六]|用[九六])[：:，,]\s*([^*\n]+)', txt):
        lab = ym.group(1); ci = ym.group(2).strip().rstrip('。；') + '。'
        pos_char = lab[0] if lab[0] in ('初', '上', '用') else lab[1]
        yaos[pos_char] = {'label': lab, 'ci': ci}
    # 彖曰（首段）
    tuan = ''
    mt = re.search(r'\*彖曰[：:]\s*\*\*([^*]+)', txt)
    if mt: tuan = mt.group(1).strip()
    # 象曰大象（首段「天行健」式）
    xiang = ''
    mx = re.search(r'\*象曰[：:]\s*\*\*([^*]+)', txt)
    if mx: xiang = mx.group(1).strip()
    return gua_ci, tuan, xiang, yaos

table = {}
for short, fname in FILE_NAME.items():
    # 恆/恒 双文件兼容
    p = os.path.join(SRC_DIR, f'周易_{fname}.txt')
    if not os.path.exists(p):
        p = os.path.join(SRC_DIR, f'周易_{chr(0x6062) if fname=="恆" else fname}.txt')
    assert os.path.exists(p), f'缺文件 {p}'
    gua_ci, tuan, xiang, yaos = parse_gua(p)
    assert gua_ci, f'{short} 卦辞为空'
    six = [yaos.get(l) for l in YAO_LABEL]
    assert all(six), f'{short} 爻辞不齐: {list(yaos)}'
    entry = {'guaCi': gua_ci, 'tuan': tuan, 'xiang': xiang,
             'yaos': [{'pos': YAO_LABEL[i], 'label': six[i]['label'], 'ci': six[i]['ci']} for i in range(6)]}
    if '用' in yaos:
        entry['yongYao'] = {'label': yaos['用']['label'], 'ci': yaos['用']['ci']}
    table[short] = entry

assert len(table) == 64, f'仅 {len(table)} 卦'
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'source': '周易（易经卦爻辞·彖·象）', 'built': '2026-09-29', 'table': table},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'OK {OUT} · 64 卦全')
for k in ['乾', '坤', '屯', '未济']:
    e = table[k]
    print(f"  {k}: 卦辞「{e['guaCi'][:20]}」 象「{e['xiang'][:16]}」 初爻「{e['yaos'][0]['ci'][:16]}」 yong={'yongYao' in e}")
