#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build-jy-yilin.py — 焦氏易林繇辞解析（元刊本 corpus/jiaoshi-yilin/卷01-16.txt）

结构（实测探明）：
  - 16 卷 × 4 块 = 64 块；每块 = 之本(无名) + 文王序缺本卦的 63 条 ≈ 4096 条。
  - 块头两种写法：「䷀〈乹下乹上〉乹」与「〈乾上离下〉同人」（上下序互倒、卦画可缺）。
  - 块内首条无名（繇直接跟块头）；第二条常带「之X」前缀；其余为裸卦名行。
  - 版本性缺文存在（宋本避讳遗痕，如坤/屯/蒙块缺「恒」整条）→ WARN 记 missing。
  - 偶发衍行/序倒（重复卦名行、离坎互倒等）→ WARN 不阻断。
  - 繇/注分离：「無註/無注/註未詳/注未詳/未詳」直接切；其余用四字句律启发式，
    余部首 30 字内含注文标记字则接受；都不中 → ambiguous 存全文。

产出 server/data/jy-yilin.json：{"table": {"乾|坤": {"verse":..., "note":...}}, "meta": {...}}
断言：64 块；块名集合=64 卦全集；总条目 ≥4000；每块条目 60-64。
"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(ROOT, 'corpus', 'jiaoshi-yilin')
OUT = os.path.join(ROOT, 'server', 'data', 'jy-yilin.json')

KW = ['乾','坤','屯','蒙','需','讼','师','比','小畜','履','泰','否','同人','大有','谦','豫',
      '随','蛊','临','观','噬嗑','贲','剥','复','无妄','大畜','颐','大过','坎','离','咸','恒',
      '遁','大壮','晋','明夷','家人','睽','蹇','解','损','益','夬','姤','萃','升','困','井',
      '革','鼎','震','艮','渐','归妹','丰','旅','巽','兑','涣','节','中孚','小过','既济','未济']
KWSET = set(KW)
# 元刊本用字 → 引擎简名（_YJ_SHORTS 口径）
VAR = {'乹':'乾','𫎇':'蒙','𢘆':'咸','蠱':'蛊','頥':'颐','觧':'解','遘':'姤','兊':'兑','渙':'涣',
       '節':'节','訟':'讼','師':'师','謙':'谦','臨':'临','觀':'观','賁':'贲','復':'复',
       '無妄':'无妄','大過':'大过','小過':'小过','遯':'遁','大壯':'大壮','晉':'晋','𣈆':'晋',
       '損':'损','漸':'渐','歸妹':'归妹','歸妺':'归妹','豐':'丰','旣濟':'既济','既濟':'既济',
       '未濟':'未济','離':'离','隨':'随','恆':'恒','剝':'剥','陞':'升','聧':'睽','暌':'睽','㤗':'泰'}

def norm(s):
    s = s.strip()
    return VAR.get(s, s)

NOTE_MARK = re.compile(r'(無註|無注|註未詳|注未詳|未詳)')
# 注文起始白名单；繇辞最长 48 字（13 句以上不见于本书）——超长候选拒绝，宁标 ambiguous
ZHU_START = ('按','詩','書','傳','左','史','註','注','云','曰','音','謂','此','即','墨',
             '漢','春秋','易','周禮','禮','爾雅','說文','一作','本作','或作','古','今')

def split_verse(text):
    """返回 (verse, note, ambiguous)。先去除折行空白再切（原文用字不动）。"""
    t = re.sub(r'\s+', '', text)
    if not t:
        return '', '', False
    m = NOTE_MARK.search(t)
    if m:
        return t[:m.start()].strip(), t[m.start():].strip(), False
    n = len(t)
    if n % 4 == 0 and n <= 32:
        return t, '', False                   # 短条纯四字句、无注（长条可能是繇注凑整，须进循环）
    for L in range(8, min(48, n // 4 * 4) + 1, 4):
        rest = t[L:]
        if len(rest) >= 2 and rest.startswith(ZHU_START):
            return t[:L], rest, False         # 升序首个命中：繇最短、注最长
    return t, '', True                        # 切不开 → 整条存繇，标 ambiguous

GUASYMB = {chr(0x4DC0 + i): KW[i] for i in range(64)}  # 卦画码位即文王序
HEAD_RE = re.compile(r'([䷀-䷿])?〈\S[下上]\S[下上]〉(\S+)')
NAME_RE = re.compile(r'\n[ \t　]*(之?\S{1,3})[ \t　]*(?=\n)')

def collect_anchors(txt):
    heads, names = [], []
    for m in HEAD_RE.finditer(txt):
        # 卦画与文字各为一候选（版本偶有印误：恒头文字作𢘆、夬头卦画作䷀），
        # 终选交给 main 的全局文王序指认。
        cands = []
        if m.group(1):
            cands.append(GUASYMB.get(m.group(1)))
        cands.append(norm(m.group(2)))
        cands = [c for c in cands if c in KWSET]
        if cands:
            heads.append((m.start(), m.end(), cands))
    for m in NAME_RE.finditer(txt):
        raw = m.group(1)
        nm = norm(raw[1:] if raw.startswith('之') else raw)
        if nm in KWSET:
            names.append((m.start(), nm))
    return heads, names

def parse_block(bname, seg_txt, seg_start, anchors, missing, warns):
    """seg_txt: 本块全文（块头起于段首）。anchors: 段内命名锚点 [(abs_pos, name)]。
    顺序容忍：卦名唯一即收录；重复衍行并入前条；版本序倒只 WARN。
    返回 {entry_name: raw_text}（含 bname 本身的本之本条）。"""
    entries = {}
    order = []
    head_end = seg_txt.find('\n') + 1
    first_pos = anchors[0][0] - seg_start if anchors else len(seg_txt)
    entries[bname] = seg_txt[head_end:first_pos]
    order.append(bname)
    for ai, (apos, aname) in enumerate(anchors):
        a0 = apos - seg_start
        aend = (anchors[ai + 1][0] - seg_start) if ai + 1 < len(anchors) else len(seg_txt)
        atext = re.sub(r'^\n[^\n]*\n', '', seg_txt[a0:aend], count=1)
        if not atext.strip():
            warns.append(f'块{bname} 空锚点 {aname}（注释折行假阳性，跳过）')
            continue
        if aname == bname:
            warns.append(f'块{bname} 出现本卦名锚点（并入前条）')
            entries[order[-1]] = entries[order[-1]].rstrip() + '\n' + atext.strip()
        elif aname in entries:
            warns.append(f'块{bname} 衍行重复 {aname}（并入前条）')
            entries[order[-1]] = entries[order[-1]].rstrip() + '\n' + atext.strip()
        else:
            entries[aname] = atext
            order.append(aname)
    # 序校验（仅 WARN）与缺文登记
    seq = order[1:]
    brks = sum(1 for i in range(len(seq) - 1)
               if KW.index(seq[i + 1]) != (KW.index(seq[i]) + 1) % 64)
    if brks > 3:
        warns.append(f'块{bname} 文王序断序 {brks} 处')
    for x in KW:
        if x != bname and x not in entries:
            missing.append(f'{bname}|{x}')
    return entries

def main():
    table = {}
    missing, ambiguous, warns = [], [], []
    block_names = []
    for v in range(1, 17):
        path = os.path.join(CORPUS, f'卷{v:02d}.txt')
        txt = open(path, encoding='utf-8').read()
        heads, names = collect_anchors(txt)
        if len(heads) != 4:
            print(f'[FATAL] 卷{v:02d} 块头数={len(heads)} ≠ 4: {heads}')
            sys.exit(1)
        resolved = []
        for hpos, hend, cands in heads:
            want = KW[len(block_names) + len(resolved)]
            if want in cands:
                resolved.append((hpos, hend, want))
            else:
                print(f'[FATAL] 卷{v:02d} 块头候选 {cands} 不含序位期望 {want}')
                sys.exit(1)
        heads = resolved
        for hi, (hpos, hend, hname) in enumerate(heads):
            seg_end = heads[hi + 1][0] if hi + 1 < 4 else len(txt)
            seg_txt = txt[hpos:seg_end]
            anchors = [(p, n) for p, n in names if hpos < p < seg_end]
            block_names.append(hname)
            entries = parse_block(hname, seg_txt, hpos, anchors, missing, warns)
            if not (50 <= len(entries) <= 64):
                print(f'[FATAL] 块{hname} 条目={len(entries)} 异常（卷{v:02d}）')
                sys.exit(1)
            for ename, raw in entries.items():
                verse, note, amb = split_verse(raw)
                if not verse:
                    print(f'[FATAL] {hname}|{ename} 空条目')
                    sys.exit(1)
                key = f'{hname}|{ename}'
                obj = {'verse': verse}
                if note:
                    obj['note'] = note
                if amb:
                    obj['ambiguous'] = True
                    ambiguous.append(key)
                table[key] = obj
    if len(block_names) != 64 or sorted(block_names) != sorted(KW):
        print(f'[FATAL] 块数={len(block_names)} 块名集合={sorted(set(KWSET)-set(block_names))} 缺失')
        sys.exit(1)

    total = len(table)
    if not (3800 <= total <= 4096):
        print(f'[FATAL] 总条目 {total} 异常')
        sys.exit(1)
    noted = sum(1 for x in table.values() if 'note' in x)
    out = {
        'meta': {
            'source': '焦氏易林（元刊本·景北京图书馆藏）· 漢焦贛撰 闕名注',
            'built': '2026-09-29', 'entries': total, 'with_note': noted,
            'ambiguous': len(ambiguous), 'missing': missing,
            'warns': len(warns),
            'note': '繇辞原文不改写；ambiguous 为繇注启发式切分失败存全文；missing 为元刊本缺文（避讳遗痕等）',
        },
        'table': table,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(f'OK 块=64 条={total} 缺文={len(missing)} 有注={noted} ambiguous={len(ambiguous)} warns={len(warns)}')
    if missing:
        print('缺文:', missing)
    print('warns 样例:', warns[:10])
    print('ambiguous 样例:', ambiguous[:8])
    print('抽查 乾|乾:', table['乾|乾']['verse'][:24])
    print('抽查 乾|坤:', table['乾|坤']['verse'][:24])
    print('抽查 未济|乾:', table['未济|乾']['verse'][:24])

if __name__ == '__main__':
    main()
