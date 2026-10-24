#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P9：生成蔡沈《洪范皇极内篇》上中下全篇语料。

上、中篇按底本自然段；下篇首个3194字长段按26组原夹注主题及末尾九经
无损切片。切片只改变检索粒度，join 后必须与原自然段逐字一致。
"""
from pathlib import Path
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'corpus/hongfan-huangji-neipian'
SOURCE = OUT / 'Wikisource-XingliDaquan-juan24-source.html'
ZHONG = OUT / 'hongfan-huangji-neipian-zhong-transcript.md'
URL = 'https://zh.wikisource.org/zh-hant/性理大全書_(四庫全書本)/卷24'
UPPER_LABELS = [
    '造化幽明', '理氣生化', '理數無形', '理氣之數', '真知真見', '虛明窒暗', '陰陽體用', '陰陽循環',
    '變化消長', '洪範九疇', '理氣形數', '理妙萬化', '性與天道', '太極動靜', '鬼神良能', '一兩難易',
    '義理形氣', '皇極大本', '陰陽五行', '數始無形', '人心至靈', '動靜奇偶', '彜倫敬知', '一心之主',
    '天地常心', '禮義交際', '二氣五行', '明禮言數', '仁智交際', '氣之消息', '數運無形', '二氣五運',
]
UPPER_KEYWORDS = [
    '造化,幽明,屈信,陰陽', '理氣,生化,無極,二五', '理數,無形,老氏,釋氏', '理氣,形數,禮,聖人', '真知,真見,義,誠', '虛明,窒暗,神,聖', '陰陽,五行,體用,周流', '陰陽,清濁,動靜,升降',
    '變化,消長,屈伸,一二', '洪範,九疇,五行,五事,八政,五紀,皇極,三德,稽疑,庶徵,五福,六極', '無形,有形,理氣,吉凶', '理,氣,萬化,無極', '邵子,性,道,程子,自強', '朱子,太極,動靜,程子,張子', '鬼神,二氣,良能,動靜', '一兩,可知,可見,體微',
    '仁義禮智信,視聽言貌思,義理,形氣', '皇極,齊家,治國,平天下,龜筮', '天地,四時,陰陽,五行', '數始,無形,動靜,聖人', '人心,虛明,形氣,物慾', '天下之理,動靜,奇偶', '彜倫,人心,敬,知', '一心,仁義禮智,惻隱,是非',
    '程子,天地,聖人,無心,無情', '禮義,仁智,養身,養民', '周子,二氣,五行,萬物', '明禮,適道,治民,言數,鬼神', '翕聚,發散,仁智,萬化', '氣息,形生,水,火', '數運,生化,性命,無極', '二氣,五運,無極,太極,闢翕',
]
LOWER_LABELS = [
    '數原九野', '別地九州', '制人九德', '九品任官', '九井均田', '九族睦俗', '九禮辨分', '九變成樂',
    '八陣制兵', '九刑禁姦', '九寸為律', '九分造曆', '九筮稽疑', '九章命算', '九職任民', '九賦斂財',
    '九式節用', '九府圜法', '九服邦國', '九命邦國', '九儀邦國', '九法邦國', '九伐邦國', '九貢邦用',
    '九兩繫民', '營國九制', '天下九經', '律度量衡', '原數決疑', '揲蓍筮法', '數辭吉凶', '八數周流',
]
LOWER_KEYWORDS = [
    '數原,數教,九野,九天,星宿', '九州,山鎮,澤藪,川浸', '九德,臯陶謨,九行', '九品,任官,職田', '九井,均田,井田,貢賦', '九族,五服,高祖,玄孫', '九禮,冠昏喪祭,朝宗軍賓', '九變,樂,黃鐘,雲門,咸池',
    '八陣,制兵,正奇,井田', '九刑,大辟,宮,剕,劓,墨', '九寸,黃鐘,律,十二辰', '九分,造曆,統元,日法', '九筮,稽疑,巫更,巫咸', '九章,方田,粟米,衰分,少廣,商功,均輸,盈朏,方程,勾股', '九職,三農,園圃,虞衡,百工', '九賦,邦中,四郊,關市,山澤',
    '九式,祭祀,賓客,喪荒,工事', '九府,圜法,太府,王府', '九服,王畿,侯服,甸服,藩服', '九命,受職,受服,受位,作伯', '九儀,上公,諸侯,諸伯,諸子,諸男', '九法,平邦國,制畿封國', '九伐,正邦國,賊賢害民', '九貢,祀貢,嬪貢,器貢,物貢',
    '九兩,牧,長,師,儒,宗', '營國,九里,九經九緯,匠人,明堂', '孔子,九經,脩身,尊賢,親親,懷諸侯', '黃帝,伶倫,黃鐘,度量衡', '原數,決疑,五行,吉凶', '筮法,揲蓍,五十,分二,掛一', '數,辭,吉凶,惠迪從逆', '一吉九凶,三祥七災,八休二咎,四吝六悔',
]
assert len(UPPER_LABELS) == len(UPPER_KEYWORDS) == 32
assert len(LOWER_LABELS) == len(LOWER_KEYWORDS) == 32
UPPER_VARIANTS = {
    15: '「鬼神」之「鬼」在底本網頁為圖像替字，依 alt 錄字；未據他本改字，待書影核驗。',
    28: '本段「為鬼為神」之「鬼」在底本網頁為圖像替字，依 alt 錄字；待書影核驗。',
}
LOWER_VARIANTS = {
    1: '九野夾注「其星鬼栁」之「鬼」在底本網頁為圖像替字，依 alt 錄字；待書影核驗。',
    11: '黃鐘數見「五萬九千○○四十九」等表述，照底本保留，不自行改算或刪補。',
    14: '底本「以御錯□正負」含方框缺字符號，原樣保留，不猜補。',
    27: '底本作「來百工財財用足」，疑有重文或脫字，照錄不改；「不眩」之「眩」依網頁圖像 alt 錄字，待書影核驗。',
}

soup = BeautifulSoup(SOURCE.read_text(encoding='utf-8'), 'html.parser')
root = soup.select_one('.mw-parser-output')
assert root is not None
for img in root.find_all('img'):
    img.replace_with(img.get('alt', '') or '〔圖像無替字〕')
for br in root.find_all('br'):
    br.replace_with('\n')
lines = [line.strip() for line in root.get_text('', strip=False).splitlines() if line.strip()]
heads = ['洪範皇極內篇上', '洪範皇極內篇中', '洪範皇極內篇下']
positions = [lines.index(h) for h in heads]
upper = lines[positions[0] + 1:positions[1]]
zhong = lines[positions[1] + 1:positions[2]]
lower_natural = lines[positions[2] + 1:lines.index('性理大全書卷二十四', positions[2] + 1)]
assert len(upper) == len(zhong) == 32 and len(lower_natural) == 6
assert len(lower_natural[0]) == 3194

# 下篇首段：每段截至一個原夾注右括號，末段為九經；總27個檢索單元。
first = lower_natural[0]
lower_first_parts = []
pos = 0
for match in re.finditer('〈[^〉]*〉', first):
    lower_first_parts.append(first[pos:match.end()])
    pos = match.end()
lower_first_parts.append(first[pos:])
assert len(lower_first_parts) == 27
assert ''.join(lower_first_parts) == first
lower = lower_first_parts + lower_natural[1:]
assert len(lower) == 32 and lower[-1].endswith('凶咎災吝有命不摯')


def entry(section, i, text, label, keywords, variant=None):
    note = variant or '本段照網絡校錄底本收錄；未另校改，預留四庫書影及他本互校。'
    if section == '下' and i <= 27:
        note += ' 本條為下篇首自然段無損主題切片，與相鄰條目拼接可還原底本長段。'
    return '\n'.join([
        f'<!--ENTRY:{ {"上":"shang", "下":"xia"}[section] }-{i:02d}|洪範皇極內篇{section}·{i:02d} {label}|0.8-->',
        '典籍來源：宋蔡沈《洪範皇極內篇》，載《性理大全書（四庫全書本）》卷二十四；維基文庫網絡校錄。',
        f'卷次：洪範皇極內篇{section}',
        f'原文：{text}',
        '古注摘要：本段含底本〈〉原夾注；不另增今注，不以主題標引替代古注。' if '〈' in text else '古注摘要：本段未見獨立古注，不擬補注。',
        '門類：數字術數',
        '古例/占斷記錄：本段保留原引文與數理、占筮資料；不補造占例，不生成現實斷語。',
        f'版本異文：{note}',
        f'關鍵詞：{keywords}', '',
    ])

parts = ['# 蔡沈《洪範皇極內篇》上中下全篇校錄稿', '',
         f'- 典籍來源：宋蔡沈《洪範皇極內篇》，載《性理大全書（四庫全書本）》卷二十四。維基文庫網絡校錄：{URL}',
         '- 分段口徑：上篇32段、中篇32段；下篇6個底本自然段，其中首段3194字按26組原夾注及九經無損切為27個檢索單元，下篇合計32條。全篇96條。',
         '- 質量邊界：trust=0.8；網絡校錄不冒充書影定本，疑字、缺字符、圖像替字均留版本異文，預留人工書影校驗。',
         '- 分書說明：蔡沈《洪範皇極內篇》與明熊宗立《洪範九疇數解》各自獨立，不混署、不並書。', '']
for i, (text, label, kw) in enumerate(zip(upper, UPPER_LABELS, UPPER_KEYWORDS), 1):
    parts.append(entry('上', i, text, label, kw, UPPER_VARIANTS.get(i)))
# 中段直接復用P8已驗證語料，避免二次轉寫差異。
raw_zhong = ZHONG.read_text(encoding='utf-8')
marks = list(re.finditer(r'<!--ENTRY:[^>]+-->', raw_zhong))
assert len(marks) == 32
for i, mark in enumerate(marks):
    parts.append(raw_zhong[mark.start():marks[i + 1].start() if i + 1 < len(marks) else len(raw_zhong)].strip() + '\n')
for i, (text, label, kw) in enumerate(zip(lower, LOWER_LABELS, LOWER_KEYWORDS), 1):
    parts.append(entry('下', i, text, label, kw, LOWER_VARIANTS.get(i)))

full = '\n'.join(parts)
assert len(re.findall(r'<!--ENTRY:', full)) == 96
(OUT / 'hongfan-huangji-neipian-transcript.md').write_text(full, encoding='utf-8')
(OUT / 'hongfan-huangji-neipian-full-source.txt').write_text(
    '蔡沈《洪範皇極內篇》上中下純文本快照\n'
    f'來源：{URL}\n'
    '說明：上中下各32/32/6個底本自然段；快照不切下篇長段。檢索語料另對下篇首段作無損主題切片。\n\n'
    + '洪範皇極內篇上\n\n' + '\n\n'.join(upper)
    + '\n\n洪範皇極內篇中\n\n' + '\n\n'.join(zhong)
    + '\n\n洪範皇極內篇下\n\n' + '\n\n'.join(lower_natural) + '\n', encoding='utf-8')
print(f'全篇語料96條：上{len(upper)} 中{len(zhong)} 下{len(lower)}；下篇長段{len(lower_first_parts)}片無損拼接=PASS')
