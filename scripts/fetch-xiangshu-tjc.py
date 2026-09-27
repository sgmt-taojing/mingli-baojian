#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch-xiangshu-tjc.py — 《欽定古今圖書集成·藝術典·相術部》卷631-650 净本抓取 v2（2026-09-27 · Y5）
v2 修正：卷页是 <pages> 转录壳（ProofreadPage），须走 action=parse prop=text 取渲染全文；
         出网走代理 127.0.0.1:7890（直连间歇挂起/429）。
产出：corpus/xiangshu-tjc/卷631-650.txt（去标签净本，「篇名[编辑]」保留为切节锚点）
纪律：2.5s/请求；429/超时退避 18s×4；已存在跳过（幂等）。
"""
import json, re, subprocess, sys, time, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'corpus' / 'xiangshu-tjc'
OUT.mkdir(parents=True, exist_ok=True)
UA = 'mingli-baojian-classics-collector/1.0 (local knowledge base)'
PROXY = 'http://127.0.0.1:7890'
API = 'https://zh.wikisource.org/w/api.php'
BASE = '欽定古今圖書集成/博物彙編/藝術典/第{}卷'

def fetch_parsed(title, retry=4):
    url = API + '?action=parse&format=json&prop=text&page=' + urllib.parse.quote(title)
    for i in range(retry):
        r = subprocess.run(['curl', '-s', '-m', '60', '-x', PROXY, '-A', UA, url],
                           capture_output=True, timeout=70)
        raw = r.stdout.decode('utf-8', 'replace')
        try:
            d = json.loads(raw)
            html = d['parse']['text']['*']
            return html
        except Exception:
            time.sleep(18 * (i + 1))
    return ''

def clean(html):
    # 「篇名[编辑]」→ 节锚点（ingest 按此切节）
    html = re.sub(r'<span class="mw-editsection">[\s\S]*?</span>', '', html)
    html = re.sub(r'<h([23])[^>]*>([\s\S]*?)</h\1>', lambda m: f'\n\n§§ {re.sub(r"<[^>]+>", "", m.group(2)).strip()} §§\n\n', html)
    txt = re.sub(r'<[^>]+>', '', html)
    txt = txt.replace('\u3000', ' ')
    txt = re.sub(r'\[编辑\]', '', txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def main():
    done = fail = 0
    for v in range(631, 651):
        f = OUT / f'卷{v}.txt'
        if f.exists() and f.stat().st_size > 2000:
            print(f'卷{v}: 已存在跳过', flush=True)
            done += 1
            continue
        txt = clean(fetch_parsed(BASE.format(v)))
        # 有效正文门槛：含「相術部」且 >2000 字
        if len(txt) < 2000 or '相術部' not in txt:
            print(f'卷{v}: ✗ 无效（{len(txt)} 字），留待重跑', flush=True)
            fail += 1
            time.sleep(2.5)
            continue
        f.write_text(txt, encoding='utf-8')
        print(f'卷{v}: ✅ {len(txt)} 字', flush=True)
        done += 1
        time.sleep(2.5)
    print(f'═══ 完成 {done}/20，失败 {fail}')

if __name__ == '__main__':
    main()
