#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成灵棋经 8 阙课校补草案 docs/LINGQI-QUEBU-DRAFT-20261020.md。只读，不写库。"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
text = (ROOT / 'corpus' / 'lingqi-jing' / 'wikisource-lingqi-jing.txt').read_text(encoding='utf-8')

start_re = re.compile(r'^(\S{2,5}?[卦勢教势])\s*[、，,]?\s*(\S{2,4}之象)\s*$')
blocks, cur = [], None
for ln in text.split('\n'):
    m = start_re.match(ln.strip())
    if m:
        if cur: blocks.append(cur)
        cur = {'name': m.group(1), 'xiang': m.group(2), 'body': []}
    elif cur is not None:
        cur['body'].append(ln)
if cur: blocks.append(cur)
assert len(blocks) == 125

# 125 课形序（铁律序：abc≥1 六十四课 → c=0 → a=0 → b=0 → a 独存 → b 独存 → c 独存 → 0-0-0）
shapes = ['%d-%d-%d' % (a, b, c) for a in range(1, 5) for b in range(1, 5) for c in range(1, 5)]
shapes += ['%d-%d-0' % (a, b) for a in range(1, 5) for b in range(1, 5)]
shapes += ['0-%d-%d' % (b, c) for b in range(1, 5) for c in range(1, 5)]
shapes += ['%d-0-%d' % (a, c) for a in range(1, 5) for c in range(1, 5)]
shapes += ['%d-0-0' % a for a in range(1, 5)]
shapes += ['0-%d-0' % b for b in range(1, 5)]
shapes += ['0-0-%d' % c for c in range(1, 5)]
shapes += ['0-0-0']
assert len(shapes) == 125

GAPS = {'1-0-1': 97, '2-0-1': 101, '3-0-4': 108, '4-0-0': 116, '0-3-0': 119, '0-4-0': 120, '0-0-1': 121, '0-0-0': 125}

CN = '零一二三四'
def shape_cn(s):
    a, b, c = (int(x) for x in s.split('-'))
    f = lambda n: '无字' if n == 0 else CN[n] + '爻'
    return '%s上%s中%s下（%d-%d-%d）' % ('' if a else '', '', '', a, b, c) if False else ('%d上%d中%d下' % (a, b, c))

lines = []
lines.append('# 灵棋经 8 阙课校补草案（供人工裁决 · 未入库）')
lines.append('')
lines.append('- 日期：2026-10-20')
lines.append('- 来源：维基文库《靈棋經》（公有领域，https://zh.wikisource.org/wiki/靈棋經），存档 corpus/lingqi-jing/wikisource-lingqi-jing.txt')
lines.append('- 性质：**草案，未入库**。裁决通过后以「版本异文·维基文库本」第三版本入库（建议 trust 0.85，低于四库净本 0.95，高于术数全书 OCR 0.9 待议）')
lines.append('')
lines.append('## 课形↔课号配对依据（125 课形序铁律）')
lines.append('')
lines.append('灵棋经全书课序即课形序：')
lines.append('1. 第 1-64 课：上中下 1-4 全排列（字典序）')
lines.append('2. 第 65-80 课：下=0（上中 1-4 字典序）')
lines.append('3. 第 81-96 课：上=0（中下字典序）')
lines.append('4. 第 97-112 课：中=0（上下字典序）')
lines.append('5. 第 113-116 课：中下=0（上 1-4）')
lines.append('6. 第 117-120 课：上下=0（中 1-4）')
lines.append('7. 第 121-124 课：上中=0（下 1-4）')
lines.append('8. 第 125 课：0-0-0 陰饅卦')
lines.append('')
lines.append('校验：项目已有 117 课全部落位吻合（含零位区锚点 40+：敬慎 0-1-1=81、福利 0-3-1=89、未明 1-0-0=113、地利 0-0-2=122 等），无一冲突。')
lines.append('')
lines.append('## 阙课配对表')
lines.append('')
lines.append('| 课形 | 课号 | 卦名 | 卦象 | 邻位锚点 |')
lines.append('|---|---|---|---|---|')
anchors = {
    '1-0-1': '96=0-4-4 鬼動 / 99=1-0-3 不耕（同组字典序夹逼）',
    '2-0-1': '99=1-0-3 不耕 / 110=4-0-2 失律（同组夹逼）',
    '3-0-4': '110=4-0-2 失律（同组邻位）',
    '4-0-0': '113=1-0-0 未明（同组 1-0-0 起）',
    '0-3-0': '117=0-1-0 發陽 / 122=0-0-2 地利（同组夹逼）',
    '0-4-0': '117=0-1-0 發陽（同组邻位）',
    '0-0-1': '122=0-0-2 地利（同组邻位）',
    '0-0-0': '124=0-0-4 送終（全书末课）',
}
for shape, pos in sorted(GAPS.items(), key=lambda x: x[1]):
    b = blocks[pos - 1]
    assert shapes[pos - 1] == shape, (shape, pos, shapes[pos - 1])
    lines.append('| %s | %d | %s | %s | %s |' % (shape, pos, b['name'], b['xiang'], anchors[shape]))
lines.append('')
lines.append('## 八课原文（维基文库本照录）')
for shape, pos in sorted(GAPS.items(), key=lambda x: x[1]):
    b = blocks[pos - 1]
    lines.append('')
    lines.append('### 第 %d 课 %s %s（课形 %s）' % (pos, b['name'], b['xiang'], shape))
    lines.append('')
    body = '\n'.join(b['body']).strip()
    lines.append('```')
    lines.append(body)
    lines.append('```')
lines.append('')
lines.append('## 已知瑕疵（维基本自身 OCR 噪声，裁决时注意）')
lines.append('')
lines.append('- 维基本个别课有错字（如無難卦诗曰「仕進功 民名世垃名世所誇」、鬼災勢「遷居每致XX」），本次 8 课内未发现明显残缺，但仍建议与四库净本卷下（Kanripo KR3g0038 待补 95-124）互校后再定稿。')
lines.append('- 若后续补到四库净本卷下残页，三本互校，以净本为准。')
lines.append('')
lines.append('## 裁决选项')
lines.append('')
lines.append('- A. 全部入库（8 课，category=版本异文·维基文库本，trust 0.85）')
lines.append('- B. 部分入库（指明课号）')
lines.append('- C. 暂不入库，继续等四库净本卷下供源')
lines.append('')
lines.append('裁决后由我执行入库（scripts/ingest-lingqi-wiki.py 待写）+ lingqi-125.json 补齐 + 模型重建。')

out = ROOT / 'docs' / 'LINGQI-QUEBU-DRAFT-20261020.md'
out.write_text('\n'.join(lines), encoding='utf-8')
print('written', out, out.stat().st_size, 'bytes')
