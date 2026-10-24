#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从已保存的维基文库 HTML 截取蔡沈《洪范皇极内篇中》，生成可复核语料。

只按底本 <br> 划分自然段；图像替字采用网页 alt 字，不据语义改字。
"""
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'corpus/hongfan-jiuchou-shujie/Wikisource-XingliDaquan-juan24-source.html'
OUT = ROOT / 'corpus/hongfan-huangji-neipian'
URL = 'https://zh.wikisource.org/zh-hant/性理大全書_(四庫全書本)/卷24'
LABELS = [
    '圖書象數', '奇耦迭運', '象數體用', '流行成性', '正時之道',
    '五行五德', '一九八十一', '一歲九數', '奇偶相參', '順逆始終',
    '九九行數', '五常守中', '九十體用', '生成之數', '十百千萬',
    '天干地支', '物則事理', '正數間數', '數由人興', '禮儀威儀',
    '皇極五福', '敬貫始終', '道與仁義', '五品五氣', '五行生克與養生',
    '耳目口鼻', '原沖中終', '原潛之義', '三極之道', '時貴休囚',
    '數終復一', '陰陽柔剛',
]
KEYWORDS = [
    '河圖,洛書,八卦,九疇,象數', '河圖,洛書,奇耦,陰陽,五行', '象數,體用,天地,生化', '流行,成性,陰陽,生生', '正時,動靜,君子',
    '五行,五德,仁義禮智信', '一九,八十一,四時', '九數,八節,冬至,陰陽', '奇偶,九數,變化', '順數,逆數,始終',
    '九九行數,八十一,六千五百六十一', '中,五常,九數', '洛書,九,十,五行', '生數,成數,雨暘寒燠風', '天下之數,十百千萬',
    '天數,地數,天干,地支', '物則,事理,誠,數', '正數,間數,吉凶', '數由人興,聖人,國家', '禮儀三百,威儀三千',
    '皇極,五福,箕子', '敬,聖學,義利', '道,仁義,天地', '五品,五氣,五質', '五行,相生,相剋,伏伐,養生,理氣',
    '耳目口鼻,五聲,五色,五味', '原沖中終,仁義禮智信', '原,潛,君子,見幾', '一一,五五,九九,太和', '時,休囚,君子',
    '數終復一,生生,終始,乘數,八十一', '數原,數究,陰陽,柔剛,十二',
]
VARIANTS = {
    11: '底本有「百六十二」「四百有五」等省字及數字表述，照錄不改；待四庫書影核字。',
    13: '底本作「非九不生」，語義存疑；本輯不據語感改字，留待書影與他本互校。',
    22: '底本「顛倒」後原以圖像替字「眩」顯示，本輯依網頁 alt 錄為「眩」；待書影核字。',
    31: '段末乘數夾注見「二二十一」等疑誤，照底本保留，不自行刪補。',
}
assert len(LABELS) == len(KEYWORDS) == 32

soup = BeautifulSoup(SOURCE.read_text(encoding='utf-8'), 'html.parser')
root = soup.select_one('.mw-parser-output')
assert root is not None
for img in root.find_all('img'):
    alt = img.get('alt', '')
    img.replace_with(alt if alt else '〔圖像無替字〕')
for br in root.find_all('br'):
    br.replace_with('\n')
lines = [line.strip() for line in root.get_text('', strip=False).splitlines() if line.strip()]
start = lines.index('洪範皇極內篇中')
end = lines.index('洪範皇極內篇下', start + 1)
paragraphs = lines[start + 1:end]
assert len(paragraphs) == 32, f'中段應為32個自然段，實得{len(paragraphs)}'
assert paragraphs[0].startswith('河圖體圓而用方')
assert paragraphs[-1].endswith('粲然於天地之間矣')

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'hongfan-huangji-neipian-zhong-source.txt').write_text(
    '蔡沈《洪範皇極內篇中》中段純文本快照\n'
    f'來源：維基文庫《性理大全書（四庫全書本）》卷二十四，{URL}\n'
    '說明：網絡校錄本；按底本換行分32段；圖像替字依網頁alt錄字；未稱書影定本。\n\n'
    + '\n\n'.join(paragraphs) + '\n', encoding='utf-8')

parts = ['# 蔡沈《洪範皇極內篇中》校錄稿', '',
         f'- 典籍來源：宋蔡沈《洪範皇極內篇》卷中；載《性理大全書（四庫全書本）》卷二十四。維基文庫網絡校錄：{URL}',
         '- 校錄邊界：只截取「洪範皇極內篇中」至「洪範皇極內篇下」之前；按底本換行得32段。',
         '- 版本說明：trust=0.8；網絡校錄不冒充書影定本，疑字、省字、圖像替字均留版本異文，預留人工書影校驗。',
         '- 分書說明：蔡沈《洪範皇極內篇》與明熊宗立《洪範九疇數解》各自獨立，不混署、不並書。', '']
for i, (text, label, keywords) in enumerate(zip(paragraphs, LABELS, KEYWORDS), 1):
    variant = VARIANTS.get(i, '本段照網絡校錄底本收錄；未另校改，預留四庫書影及他本互校。')
    parts.extend([
        f'<!--ENTRY:zhong-{i:02d}|洪範皇極內篇中·{i:02d} {label}|0.8-->',
        '典籍來源：宋蔡沈《洪範皇極內篇》，載《性理大全書（四庫全書本）》卷二十四；維基文庫網絡校錄。',
        '卷次：洪範皇極內篇中',
        f'原文：{text}',
        '古注摘要：本段為蔡沈正文；〈〉內為底本原夾注，未另增今注。' if '〈' in text else '古注摘要：本段未見獨立古注，不擬補注。',
        '門類：數字術數',
        '古例/占斷記錄：本段未另列古例；保留原數理論述，不補造占例。',
        f'版本異文：{variant}',
        f'關鍵詞：{keywords}', '',
    ])
(OUT / 'hongfan-huangji-neipian-zhong-transcript.md').write_text('\n'.join(parts), encoding='utf-8')
print(f'生成中段語料 {len(paragraphs)} 條；首段 {len(paragraphs[0])} 字；總原文 {sum(map(len, paragraphs))} 字')
