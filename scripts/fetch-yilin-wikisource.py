#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch-yilin-wikisource.py — 《焦氏易林（四部叢刊本）》卷第一至十六 抓取（2026-09-27 · D类P1）
复用 fetch-xieji 骨架；卷名为中文数字。产出 corpus/jiaoshi-yilin/卷NN.txt"""
import json, re, subprocess, time, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'corpus' / 'jiaoshi-yilin'
OUT.mkdir(parents=True, exist_ok=True)
UA = 'mingli-baojian-classics-collector/1.0 (local knowledge base)'
PROXY = 'http://127.0.0.1:7890'
API = 'https://zh.wikisource.org/w/api.php'
CN = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六']

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
    txt = txt.replace('&#8203;', '')  # 零宽空格
    txt = txt.replace('　', ' ')
    txt = re.sub(r'\[编辑\]', '', txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def main():
    done = fail = 0
    for i, cn in enumerate(CN, 1):
        f = OUT / f'卷{i:02d}.txt'
        if f.exists() and f.stat().st_size > 2000:
            print(f'卷{i:02d}: 已存在跳过', flush=True); done += 1; continue
        txt = clean(fetch_parsed(f'焦氏易林 (四部叢刊本)/卷第{cn}'))
        if len(txt) < 2000 or '易林' not in txt:
            print(f'卷{i:02d}: ✗ 无效（{len(txt)} 字）', flush=True); fail += 1
            time.sleep(2.5); continue
        f.write_text(txt, encoding='utf-8')
        print(f'卷{i:02d}: ✓ {len(txt)} 字', flush=True); done += 1
        time.sleep(2.5)
    print(f'完成: {done} 成功 / {fail} 失败')

if __name__ == '__main__':
    main()
