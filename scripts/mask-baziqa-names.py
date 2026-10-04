#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
R-BQA-MASK（2026-10-04 · G26 治理项）：题库人名脱敏
终审报告（DELIVERY/new100-baseline-report-20260930.md）确认 70.7% 成绩含 11pp
题库泄漏水分——题干直书真实人名，模型靠史实记忆而非排盘推理解题。
本脚本把题库 json 中的人名整体替换为中性代号（缘主001…），产出 .masked.json，
映射表落 <bank>.name-map-sealed.json（training/ 已被 gitignore，不进仓库）。
用法：python3 scripts/mask-baziqa-names.py <bank.json> [更多 bank.json]
"""
import json, sys, os, copy

def mask_bank(path):
    people = json.load(open(path, encoding='utf-8'))
    assert isinstance(people, list), f'{path} 顶层应为数组'
    mapping = {}
    out = copy.deepcopy(people)
    # 第一遍建档：alias 分配（跨卷全名替换要用全量映射）
    for idx, p in enumerate(out, 1):
        name = p.get('name')
        if name and not name.startswith('缘主'):
            mapping[f'缘主{idx:03d}'] = {'name': name, 'person_id': p.get('person_id')}
    all_full_names = sorted({v['name'] for v in mapping.values()}, key=len, reverse=True)
    for idx, p in enumerate(out, 1):
        name = p.get('name')
        if not name or name.startswith('缘主'):
            continue
        alias = f'缘主{idx:03d}'
        mapping[alias] = {'name': name, 'person_id': p.get('person_id')}
        p['name'] = alias
        # 替换词表：全名 + 外文名各分段（≥3 字符，防 "Oprah Winfrey" 漏掉 "Oprah"）
        variants = {name}
        for part in name.replace('·', ' ').split():
            if len(part) >= 3:
                variants.add(part)
        # 长的先替换，避免 "Win" 类短词误伤
        variants = sorted(variants, key=len, reverse=True)
        def walk(o):
            if isinstance(o, str):
                for v in variants:
                    o = o.replace(v, alias)
                # 跨卷全名兜底：他人事件文本中的全名引用（如节目名 "Oprah Winfrey Interview"）
                for fn in all_full_names:
                    if fn != name and fn in o:
                        o = o.replace(fn, '缘主***')
                return o
            if isinstance(o, list):
                return [walk(x) for x in o]
            if isinstance(o, dict):
                return {k: walk(v) for k, v in o.items()}
            return o
        for k in list(p.keys()):
            if k != 'name':
                p[k] = walk(p[k])
    masked = path.replace('.json', '.masked.json')
    sealed = path.replace('.json', '.name-map-sealed.json')
    json.dump(out, open(masked, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    json.dump(mapping, open(sealed, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # 校验口径（G26）：全名零残留（硬线）；名分段跨卷提及仅统计（第二人称叙述，不构成可识别泄漏）
    txt = json.dumps(out, ensure_ascii=False)
    leaks = [v['name'] for v in mapping.values() if v['name'] in txt]
    part_hits = 0
    for v in mapping.values():
        for s in {p for p in v['name'].replace('·', ' ').split() if len(p) >= 3}:
            if s in txt:
                part_hits += 1
                break
    print(f'{os.path.basename(path)}: {len(mapping)} 人脱敏 → {os.path.basename(masked)}'
          f' | 全名校验: {"FAIL " + str(leaks[:3]) if leaks else "0 残留"}'
          f' | 名分段跨卷提及(参考): {part_hits}')
    return len(mapping), not leaks

if __name__ == '__main__':
    total, ok_all = 0, True
    for f in sys.argv[1:]:
        n, ok = mask_bank(f)
        total += n
        ok_all = ok_all and ok
    print(f'合计 {total} 人；校验 {"全绿" if ok_all else "有泄漏！"}')
    sys.exit(0 if ok_all else 1)
