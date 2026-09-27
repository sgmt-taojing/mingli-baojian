#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fetch-xieji-wikisource.py — 《欽定協紀辨方書（四庫全書本）》卷01-36 净本抓取（2026-09-27 · D类P1）
复用 fetch-xiangshu-tjc.py v2 骨架：action=parse 渲染接口 + 代理 127.0.0.1:7890。
v3 修正：剥 <style>/<script>（四库本页内嵌样式块）。
产出：corpus/xieji-bianfang/卷NN.txt
纪律：2.5s/请求；429/超时退避 18s×4；已存在跳过（幂等）。
"""
import json, re, subprocess, time, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'corpus' / 'xieji-bianfang'
OUT.mkdir(parents=True, exist_ok=True)
UA = 'mingli-baojian-classics-collector/1.0 (local knowledge base)'
PROXY = 'http://127.0.0.1:7890'
API = 'https://zh.wikisource.org/w/api.php'
BASE = '欽定協紀辨方書 (四庫全書本)/卷{:02d}'

def fetch_parsed(title, retry=4):
    url = API + '?action=parse&format=json&prop=text&page=' + urllib.parse.quote(title)
    for i in range(retry):
        r = subprocess.run(['curl', '-s', '-m', '60', '-x', PROXY, '-A', UA, url],
                           capture_output=True, timeout=70)
        try:
            d = json.loads(r.stdout.decode('utf-8', 'replace'))
            return d['parse']['text']['*']
        except Exception:
            time.sleep(18 * (i + 1))
    return ''

def clean(html):
    html = re.sub(r'<style[\s\S]*?</style>', '', html)
    html = re.sub(r'<script[\s\S]*?</script>', '', html)
    html = re.sub(r'<span class="mw-editsection">[\s\S]*?</span>', '', html)
    # 段落界保留：<p>/<br>/<div>/<td> 转换行
    html = re.sub(r'</(p|div|tr|li)>', '\n', html)
    html = re.sub(r'<br\s*/?>', '\n', html)
    txt = re.sub(r'<[^>]+>', '', html)
    txt = txt.replace('　', ' ')
    txt = re.sub(r'\[编辑\]', '', txt)
    txt = re.sub(r'[ \t]+', ' ', txt)
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    return txt.strip()

def main():
    done = fail = 0
    for v in range(1, 37):
        f = OUT / f'卷{v:02d}.txt'
        if f.exists() and f.stat().st_size > 2000:
            print(f'卷{v:02d}: 已存在跳过', flush=True)
            done += 1
            continue
        txt = clean(fetch_parsed(BASE.format(v)))
        # 卷20-31 为「月表」（逐日神煞表），正文稀疏属正常，800 字即收
        if len(txt) < 800 or '協紀' not in txt:
            print(f'卷{v:02d}: ✗ 无效（{len(txt)} 字），留待重跑', flush=True)
            fail += 1
            time.sleep(2.5)
            continue
        f.write_text(txt, encoding='utf-8')
        print(f'卷{v:02d}: ✓ {len(txt)} 字', flush=True)
        done += 1
        time.sleep(2.5)
    print(f'完成: {done} 成功 / {fail} 失败')

if __name__ == '__main__':
    main()
