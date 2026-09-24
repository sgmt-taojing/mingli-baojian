#!/usr/bin/env python3
"""
企业微信群机器人推送发送器 v1（2026-09-24 · 接管 Qclaw 微信推送 · 方案C）

用法：
  python3 scripts/send-wecom.py --title "晨间推送" < message.txt
  python3 scripts/send-wecom.py --title "每日口诀" --file out.txt
  echo "测试" | python3 scripts/send-wecom.py

配置（凭据不进 git）：
  server/config/wecom-webhook.local.json  →  {"webhook": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=XXXX"}
  或环境变量 WECOM_WEBHOOK

行为：
  - 未配置 webhook → mock 模式：写 data/push-outbox/<时间戳>.jsonl，标注「模拟外发」，退出码 0
  - 已配置 → 真实外发；markdown 单条 ≤4096 字节（UTF-8），超限按行切分多条发送
  - 每条间隔 1s（机器人限频 20 条/分钟）；失败重试 1 次；任何失败最终退出码 1
  - 全程写日志到 stdout（供 launchd 日志捕获）
"""
import argparse
import datetime
import json
import os
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(ROOT, 'server', 'config', 'wecom-webhook.local.json')
OUTBOX_DIR = os.path.join(ROOT, 'data', 'push-outbox')
MAX_BYTES = 4000  # 留 96 字节余量（上限 4096）


def load_webhook():
    url = os.environ.get('WECOM_WEBHOOK', '').strip()
    if url:
        return url
    try:
        with open(CONFIG_FILE, encoding='utf-8') as f:
            return json.load(f).get('webhook', '').strip()
    except Exception:
        return ''


def chunk_text(text, max_bytes=MAX_BYTES):
    """按行切分，保证每片 UTF-8 字节数 ≤ max_bytes；超长单行硬切。"""
    chunks, cur, cur_bytes = [], [], 0
    for line in text.split('\n'):
        lb = len(line.encode('utf-8')) + 1
        if lb > max_bytes:  # 超长单行硬切
            if cur:
                chunks.append('\n'.join(cur)); cur, cur_bytes = [], 0
            buf = ''
            for ch in line:
                cb = len(ch.encode('utf-8'))
                if len(buf.encode('utf-8')) + cb > max_bytes:
                    chunks.append(buf); buf = ''
                buf += ch
            if buf:
                chunks.append(buf)
            continue
        if cur_bytes + lb > max_bytes and cur:
            chunks.append('\n'.join(cur)); cur, cur_bytes = [], 0
        cur.append(line); cur_bytes += lb
    if cur:
        chunks.append('\n'.join(cur))
    return [c for c in chunks if c.strip()]


def mock_outbox(title, chunks):
    os.makedirs(OUTBOX_DIR, exist_ok=True)
    ts = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    path = os.path.join(OUTBOX_DIR, f'{ts}.jsonl')
    with open(path, 'a', encoding='utf-8') as f:
        for i, c in enumerate(chunks):
            f.write(json.dumps({
                'ts': datetime.datetime.now().isoformat(timespec='seconds'),
                'channel': 'wecom-bot', 'mode': 'mock', 'note': '模拟外发',
                'title': title, 'part': f'{i+1}/{len(chunks)}', 'content': c,
            }, ensure_ascii=False) + '\n')
    print(f'[send-wecom] MOCK 模拟外发 {len(chunks)} 条 → {path}')
    return True


def send_one(webhook, content):
    body = json.dumps({'msgtype': 'markdown', 'markdown': {'content': content}},
                      ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(webhook, data=body,
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        r = json.loads(resp.read().decode('utf-8'))
    return r.get('errcode') == 0, r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--title', default='命理宝鉴推送')
    ap.add_argument('--file', help='从文件读内容；缺省读 stdin')
    args = ap.parse_args()

    text = open(args.file, encoding='utf-8').read() if args.file else sys.stdin.read()
    text = text.strip()
    if not text:
        print('[send-wecom] 内容为空，跳过发送')
        return 0

    chunks = chunk_text(text)
    webhook = load_webhook()
    if not webhook:
        mock_outbox(args.title, chunks)
        return 0

    ok_all = True
    for i, c in enumerate(chunks):
        payload = c if len(chunks) == 1 else f'**{args.title}（{i+1}/{len(chunks)}）**\n\n{c}'
        ok, r = send_one(webhook, payload)
        if not ok:  # 重试 1 次
            time.sleep(2)
            ok, r = send_one(webhook, payload)
        print(f'[send-wecom] 第 {i+1}/{len(chunks)} 条: {"OK" if ok else "FAIL " + json.dumps(r, ensure_ascii=False)}')
        ok_all = ok_all and ok
        if i < len(chunks) - 1:
            time.sleep(1)
    return 0 if ok_all else 1


if __name__ == '__main__':
    sys.exit(main())
