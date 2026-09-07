#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync-kb-assets.py — tcm → medical-stack KB 数据资产自动吸收（链 2d，2026-09-07）

背景：09-07 检索分叉事故——formula-symptom-index.json 等症状通道资产漂移致双侧检索
系统性分叉（处理器哈希一致但结果不同），L2.6 巡检层只能发现，本脚本负责自动对齐。

机制（与镜像链同规：哈希幂等、变了才动）：
  1. 逐资产比对 sha256：tcm 有 ms 无 → 复制；哈希不同 → 复制覆盖
  2. 任一资产变更 → launchctl kickstart medical-api（8972 需重启加载新资产）
  3. 重启后冒烟：GET /api/tcm/health + 一条金案查询（痈 疽 → 医宗金鉴 top5）
  4. 全程输出 JSON 行到 stdout（链条日志 /tmp/tcm-import.log 可查）

纪律：只同步不训练；资产清单与 tcm-capability-diff.py L2.6 KB_ASSETS 保持一致。
兼容：链条以 /usr/bin/python3（3.9）运行，禁 3.10+ 语法。
"""

import hashlib
import json
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TCM_KB = ROOT.parent / 'tcm-agent' / 'server' / 'kb'
MS_KB = ROOT / 'medical-stack' / 'server' / 'kb'

# 单一真源：medical-stack/patches/kb-assets.json（tcm-capability-diff.py L2.6 同读）
def load_assets():
    reg = ROOT / 'medical-stack' / 'patches' / 'kb-assets.json'
    try:
        d = json.loads(reg.read_text(encoding='utf-8'))
        return [a['file'] for a in d.get('assets', [])]
    except Exception:
        return ['formula-symptom-index.json', 'symptom-aliases.json', 'recall-demotions.json',
                't2s-map.js', 'symptom-index.js', 'tcm-classics.json', 'syndrome-supplement.json']

KB_ASSETS = load_assets()

SMOKE_QUERY = '痈 疽'           # E16 金案：症状通道+共现加成双重依赖资产新鲜度
SMOKE_EXPECT = '医宗金鉴'        # top5 须含金鉴外科条目


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def log(obj):
    obj['ts'] = time.strftime('%Y-%m-%dT%H:%M:%S')
    obj['action'] = 'kb-assets-sync'
    print(json.dumps(obj, ensure_ascii=False))


def smoke():
    try:
        q = urllib.parse.quote(SMOKE_QUERY)
        req = urllib.request.Request(
            'http://127.0.0.1:8972/api/tcm/kb/search?q=%s&limit=5' % q,
            headers={'X-Skip-Interceptor': '1', 'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read().decode('utf-8'))
        hay = json.dumps(d.get('results', [])[:5], ensure_ascii=False)
        return SMOKE_EXPECT in hay
    except Exception as e:
        return 'error: %s' % str(e)[:80]


def main():
    changed = []
    missing_src = []
    for a in KB_ASSETS:
        tf, mf = TCM_KB / a, MS_KB / a
        if not tf.exists():
            missing_src.append(a)
            continue
        if mf.exists() and sha(tf) == sha(mf):
            continue
        MS_KB.mkdir(parents=True, exist_ok=True)
        mf.write_bytes(tf.read_bytes())
        changed.append(a)

    if not changed:
        log({'status': 'skipped', 'reason': 'assets in sync',
             'missing_src': missing_src or None})
        return 0

    # 有变更 → 重启 8972 加载新资产
    uid = subprocess.check_output(['id', '-u']).decode().strip()
    rc = subprocess.call(['launchctl', 'kickstart', '-k',
                          'gui/%s/com.mingli-baojian.medical-api' % uid])
    time.sleep(6)
    sm = smoke()
    log({'status': 'synced', 'changed': changed, 'restart_rc': rc, 'smoke': sm,
         'missing_src': missing_src or None})
    # 冒烟失败非零退出（链条告警可查），但不回滚——资产同步本身是向最新对齐
    return 0 if sm is True else 1


if __name__ == '__main__':
    sys.exit(main())
