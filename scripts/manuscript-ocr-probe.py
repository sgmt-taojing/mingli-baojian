#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OCR 方向探测：每份取一页，横/竖语言包各跑一次，比高置信词数定方向。"""
import json, re, subprocess, sys, importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('me', ROOT / 'scripts' / 'manuscript-extract.py')
me = importlib.util.module_from_spec(spec); spec.loader.exec_module(me)
import pymupdf

TESS = '/opt/homebrew/bin/tesseract'
SETS = {'horiz': 'chi_sim+chi_tra', 'vert': 'chi_tra_vert+chi_sim_vert'}


def score(png, lang):
    r = subprocess.run([TESS, str(png), 'stdout', '-l', lang, '--psm', '6', 'tsv'],
                       capture_output=True, text=True, timeout=120)
    words = 0
    conf_sum = 0.0
    for line in r.stdout.splitlines()[1:]:
        p = line.split('\t')
        if len(p) == 12 and p[11].strip():
            try:
                c = float(p[10])
            except ValueError:
                continue
            if c > 30 and re.search(r'[一-鿿]', p[11]):
                words += 1
                conf_sum += c
    return words, conf_sum / words if words else 0


def main():
    names = sys.argv[1:]
    items = json.loads(me.QUEUE.read_text(encoding='utf-8'))
    tmp = ROOT / '.openclaw' / 'tmp' / 'probe.png'
    tmp.parent.mkdir(parents=True, exist_ok=True)
    for it in items:
        if not any(n in it['name'] for n in names):
            continue
        try:
            doc = pymupdf.open(it['archive_path'])
            pi = min(10, doc.page_count - 1)
            doc.load_page(pi).get_pixmap(dpi=200).save(str(tmp))
            doc.close()
            res = {}
            for k, lang in SETS.items():
                res[k] = score(str(tmp), lang)
            win = max(res, key=lambda k: (res[k][0], res[k][1]))
            print(f"{win:5s} | 横{res['horiz'][0]:4d}词/{res['horiz'][1]:.0f} 竖{res['vert'][0]:4d}词/{res['vert'][1]:.0f} | {it['name']}", flush=True)
        except Exception as e:
            print(f"ERR   | {it['name']} | {str(e)[:60]}", flush=True)
    if tmp.exists():
        tmp.unlink()


if __name__ == '__main__':
    main()
