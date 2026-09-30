#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""BaziQA new100 题库性别回填（R-BQA-GENDER · 2026-10-01 Kimi）

背景：构建脚本硬编码 gender='unknown'，eval 渲染层把 unknown 兜底成「女」——
男性命主的大运顺逆全反，assist2 引擎注入因此被污染（dev36 实测 1/36 雪崩）。
本脚本从 Wikidata P21 回填真实性别，原地升级 celebrity-new100_zh.json（先备份）。
Q6105=男 Q6581072=女；查不到保持 unknown。
用法：/usr/bin/python3 scripts/fix-baziqa-gender-20261001.py
"""
import json, re, shutil, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'training' / 'baziqa' / 'data' / 'celebrity-new100_zh.json'
BAK = DATA.with_suffix('.json.bak-gender-20261001')

def fetch_gender(qid):
    url = f'https://www.wikidata.org/wiki/Special:EntityData/{qid}.json'
    req = urllib.request.Request(url, headers={'User-Agent': 'mingli-baojian-eval/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        claims = d['entities'][qid]['claims'].get('P21', [])
        if not claims:
            return None
        gid = claims[0]['mainsnak']['datavalue']['value']['id']
        return {'Q6581097': 'male', 'Q6581072': 'female', 'Q6105': 'male'}.get(gid)
    except Exception as e:
        print(f'  [warn] {qid}: {e}')
        return None

def main():
    people = json.load(open(DATA))
    shutil.copy(DATA, BAK)
    fixed = kept = 0
    for p in people:
        m = re.match(r'wd-(Q\d+)', p.get('person_id', ''))
        if not m:
            kept += 1; continue
        g = fetch_gender(m.group(1))
        if g:
            p['profile']['gender'] = g; fixed += 1
            print(f"  {p['name']}: {g}")
        else:
            kept += 1
        time.sleep(0.3)
    json.dump(people, open(DATA, 'w'), ensure_ascii=False, indent=1)
    print(f'--- fixed={fixed} kept={kept} 备份={BAK}')

if __name__ == '__main__':
    sys.exit(main())
