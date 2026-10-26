#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P19 · 《断易大全》Commons 书影单线程断点续传。

只获取公开古籍书影，不修改原项目中的截断片段，不写入知识库。
网络不稳定时保留有效分段；429 退避，不并发请求，不无限重试。

用法：python scripts/fetch-duanyi-daquan-scan.py [--max-seconds 240]
"""
import argparse
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'corpus/source-scans/duanyi-daquan'
PARTS = OUT / 'chunk1m'
COMPLETE = OUT / 'SSID-13319395-complete.pdf'
URL = ('https://upload.wikimedia.org/wikipedia/commons/9/9d/'
       'SSID-13319395_%E5%8D%9C%E7%AD%AE%E6%BA%90%E6%B5%81%E6%96%B7%E6%98%93%E5%A4%A7%E5%85%A8.pdf')
TOTAL = 54666851
CHUNK = 1024 * 1024


def ranges():
    return [(start, min(start + CHUNK, TOTAL) - 1)
            for start in range(0, TOTAL, CHUNK)]


def valid_part(index, start, end):
    path = PARTS / f'part{index:03d}.bin'
    return path.exists() and path.stat().st_size == end - start + 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--max-seconds', type=int, default=240)
    args = parser.parse_args()
    PARTS.mkdir(parents=True, exist_ok=True)
    items = ranges()
    deadline = time.monotonic() + args.max_seconds

    # 保留此前已成功取得的首段，避免重复请求。
    first = OUT / 'SSID-13319395-first-1m.bin'
    first_part = PARTS / 'part000.bin'
    if first.exists() and first.stat().st_size == CHUNK and not first_part.exists():
        first_part.write_bytes(first.read_bytes())

    for pass_no in (1, 2):
        for index, (start, end) in enumerate(items):
            if valid_part(index, start, end):
                continue
            if time.monotonic() >= deadline:
                break
            path = PARTS / f'part{index:03d}.bin'
            result = subprocess.run([
                'curl', '--http1.1', '-sS', '--fail', '--max-time', '30',
                '--range', f'{start}-{end}', '-o', str(path), URL,
            ], capture_output=True)
            if result.returncode == 0 and valid_part(index, start, end):
                print(f'完成 {index + 1}/{len(items)}', flush=True)
            else:
                path.unlink(missing_ok=True)
                error = result.stderr.decode('utf-8', 'replace').strip()
                print(f'暂缺 {index + 1}：{error[-160:]}', flush=True)
                # 明确尊重限流；其他网络错误也退避，不作紧密重试。
                time.sleep(60 if '429' in error else 15)
            time.sleep(2)
        count = sum(valid_part(i, start, end) for i, (start, end) in enumerate(items))
        print(f'第 {pass_no} 轮：{count}/{len(items)} 个有效分段', flush=True)
        if count == len(items) or time.monotonic() >= deadline:
            break

    missing = [i for i, (start, end) in enumerate(items) if not valid_part(i, start, end)]
    if missing:
        print(f'尚未完整：缺 {len(missing)} 段；下次运行将从断点继续。')
        return 2

    temporary = OUT / 'SSID-13319395-complete.assembling.pdf'
    with temporary.open('wb') as target:
        for index in range(len(items)):
            target.write((PARTS / f'part{index:03d}.bin').read_bytes())
    assert temporary.stat().st_size == TOTAL
    temporary.replace(COMPLETE)

    from pypdf import PdfReader
    reader = PdfReader(COMPLETE)
    assert len(reader.pages) == 287, len(reader.pages)
    print(f'完整书影：{COMPLETE}；{TOTAL} bytes；287 页。')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
