#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-taixuan-taiyi.py — 《集註太玄經》卷一~十 + 《太乙金鏡式經(四庫全書本)》卷01~10（2026-09-27 · D类P2）
复用 xieji 骨架。产出 corpus/taixuan/卷NN.txt 与 corpus/taiyi/卷NN.txt"""
import json, re, subprocess, time, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UA = 'mingli-baojian-classics-collector/1.0 (local knowledge base)'
PROXY = 'http://127.0.0.1:7890'
API = 'https://zh.wikisource.org/w/api.php'
CN10 = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

def fetch_parsed(title, retry=4):
    url = API + '?action=parse&format=json&prop=text&page=' + urllib.parse.quote(title)
    for i in range(retry):
        r = subprocess.run(['curl', '-s', '-m', '60', '-x', PROXY, '-A', UA, url],
                           capture_output=True, timeout=70)
        try:
            return json.loads(r.stdout.decode('utf-8', 'replace'))['parse']['text']['*']
        except Exception:
            time.sleep(18 * (i + 1))
    return ''

def clean(html):
    html = re.sub(r'<style[\s\S]*?</style>', '', html)
    html = re.sub(r'<script[\s\S]*?</script>', '', html)
    html = re.sub(r'<span class="mw-editsection">[\s\S]*?</span>', '', html)
    html = re.sub(r'</(p|div|tr|li)>', '\n', html)
    html = re.sub(r'<br\s*/?>', '\n', html)
    txt = re.sub(r'<[^>]+>', '', html)
    txt = txt.replace('&#8203;', '').replace('　', ' ')
    txt = re.sub(r'\[编辑\]', '', txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def run(title_fn, outdir, key, maxn=10):
    out = ROOT / 'corpus' / outdir
    out.mkdir(parents=True, exist_ok=True)
    done = fail = 0
    for v in range(1, maxn + 1):
        f = out / f'卷{v:02d}.txt'
        if f.exists() and f.stat().st_size > 1500:
            print(f'{outdir}卷{v:02d}: 已存在跳过', flush=True); done += 1; continue
        txt = clean(fetch_parsed(title_fn(v)))
        if len(txt) < 1500 or key not in txt:
            print(f'{outdir}卷{v:02d}: ✗ 无效（{len(txt)} 字）', flush=True); fail += 1
            time.sleep(2.5); continue
        f.write_text(txt, encoding='utf-8')
        print(f'{outdir}卷{v:02d}: ✓ {len(txt)} 字', flush=True); done += 1
        time.sleep(2.5)
    print(f'{outdir}: {done} 成功 / {fail} 失败')

if __name__ == '__main__':
    run(lambda v: f'集註太玄經/卷{CN10[v-1]}', 'taixuan', '太玄')
    run(lambda v: f'太乙金鏡式經 (四庫全書本)/卷{v:02d}', 'taiyi', '太乙')
