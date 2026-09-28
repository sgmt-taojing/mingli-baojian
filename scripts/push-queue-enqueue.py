#!/usr/bin/env python3
"""
push-queue-enqueue.py — 推送内容入队器（2026-09-26 · 裁判 · ADR-027）

用法：printf '%s' "$内容" | python3 scripts/push-queue-enqueue.py --title "标题"

行为：
- 从 stdin 读全文，按 UTF-8 字节 ≤1800 切段（行边界优先，段首标 (k/n)）
- 每段写 data/push-queue/<时间戳>-<k>n.json，由 wecom-aibot daemon 扫描外发
- 全部入队成功 rc=0；任何失败 rc=1（push-run.sh 依赖此码决定是否报错）
"""
import argparse
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUEUE = os.path.join(ROOT, 'data', 'push-queue')
MAX_BYTES = 1800


def split_segments(text, max_bytes=MAX_BYTES):
    """结构优先切段：内容含 ━━━SPLIT━━━ 标记行时按标记归并打包（每段 ≤预算）；
    无标记时按行边界切段。单段仍超限才按行/硬切。段首序号预留 16 字节。"""
    budget = max_bytes - 16
    marker = '━━━SPLIT━━━'
    if marker in text:
        blocks = [b.strip('\n') for b in text.split(marker) if b.strip()]
        segs, cur = [], ''
        for b in blocks:
            cand = (cur + '\n\n' + b) if cur else b
            if len(cand.encode('utf-8')) <= budget:
                cur = cand
            else:
                if cur:
                    segs.append(cur)
                cur = b
        if cur:
            segs.append(cur)
        # 个别块仍超限 → 对该块退化为行切
        out = []
        for s in segs:
            if len(s.encode('utf-8')) <= budget:
                out.append(s)
            else:
                out.extend(split_segments(s, max_bytes))
        return out
    lines = text.split('\n')
    segs, cur = [], ''
    for line in lines:
        cand = (cur + '\n' + line) if cur else line
        if len(cand.encode('utf-8')) <= budget:
            cur = cand
            continue
        if cur:
            segs.append(cur)
        # 单行超预算：硬切
        while len(line.encode('utf-8')) > budget:
            cut, b = 0, 0
            for ch in line:
                w = len(ch.encode('utf-8'))
                if b + w > budget:
                    break
                b += w
                cut += 1
            segs.append(line[:cut])
            line = line[cut:]
        cur = line
    if cur:
        segs.append(cur)
    return segs or ['']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--title', required=True)
    ap.add_argument('--to', default=None, help='定向 chatid（缺省广播到全部登记会话）')
    args = ap.parse_args()
    text = sys.stdin.read()
    if not text.strip():
        print('[enqueue] 内容为空，不入队', file=sys.stderr)
        return 1
    segs = split_segments(text)
    n = len(segs)
    os.makedirs(QUEUE, exist_ok=True)
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    for k, seg in enumerate(segs, 1):
        head = f"({k}/{n}) " if n > 1 else ''
        item = {'title': f"{args.title} {head}".strip(), 'content': head + seg,
                'enqueued_at': datetime.datetime.now().strftime('%F %T')}
        if args.to:
            item['chatid'] = args.to
        path = os.path.join(QUEUE, f'{ts}-{args.to + "-" if args.to else ""}{k}of{n}.json')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(item, f, ensure_ascii=False)
        print(f"[enqueue] {os.path.basename(path)} {len((head + seg).encode('utf-8'))}B" + (f" → {args.to}" if args.to else ''))
    print(f'[enqueue] 共 {n} 段入队，等待 daemon 外发')
    return 0


if __name__ == '__main__':
    sys.exit(main())
