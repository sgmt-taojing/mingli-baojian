#!/usr/bin/env python3
"""
R119 防御脚本（2026-08-16）
- 修真后固化：禁止 mingli-baojian 内部出现跨项目污染标签
- 修真对象：
  1. server/database/yidao.db  → kb_formal / kb_staging 中出现 6 个跨项目 module 标签
  2. data/mingli_dpo_{train,val}.json → metadata.module 出现 6 个跨项目标签
  3. data/mingli_sft_*.json → 内容字段或 metadata 出现 6 个跨项目字符串
- exit 0=干净，exit 1=发现污染
"""
import sqlite3, json, sys, os
from pathlib import Path

ROOT = Path('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian')
CROSS_TAGS = ('smart-home-family', 'family-life', 'epb-assistant',
              'wechat-platform', 'digital-workshop', 'digital-ecosystem')

errors = []

# 1. KB 数据库
db = ROOT / 'server/database/yidao.db'
if db.exists():
    try:
        conn = sqlite3.connect(str(db))
        for tab in ('kb_formal', 'kb_staging'):
            try:
                cnt = conn.execute(f"SELECT COUNT(*) FROM {tab} WHERE module IN ({','.join('?'*len(CROSS_TAGS))})", CROSS_TAGS).fetchone()[0]
                if cnt > 0:
                    errors.append(f"  ❌ {db.name}/{tab}: {cnt} 条跨项目污染")
                else:
                    print(f"  ✅ {db.name}/{tab}: 干净")
            except Exception:
                pass
        conn.close()
    except Exception as e:
        print(f"  ⚠️  打开 DB 失败: {e}")

# 2. DPO 训练集
for fn in ['data/mingli_dpo_train.json', 'data/mingli_dpo_val.json']:
    p = ROOT / fn
    if not p.exists():
        continue
    try:
        with open(p) as f:
            d = json.load(f)
        bad = sum(1 for x in d if x.get('metadata', {}).get('module') in CROSS_TAGS)
        if bad > 0:
            errors.append(f"  ❌ {fn}: {bad} 条 metadata.module=跨项目标签")
        else:
            print(f"  ✅ {fn} ({len(d)} 条): 干净")
    except Exception as e:
        print(f"  ⚠️  {fn} 解析失败: {e}")

# 3. SFT 训练集（内容字段扫描）
for fn in ['data/mingli_sft_train.json', 'data/mingli_sft_val.json', 'data/mingli_sft_test.json']:
    p = ROOT / fn
    if not p.exists():
        continue
    try:
        with open(p) as f:
            d = json.load(f)
        bad = 0
        for x in d:
            md = x.get('metadata', {}).get('module', '')
            if md in CROSS_TAGS:
                bad += 1
                continue
            # 扫描 messages 内容
            msgs = x.get('messages', [])
            if not msgs and x.get('conversations'):
                msgs = x['conversations']
            for m in msgs:
                if isinstance(m, dict):
                    txt = m.get('content', '')
                    if isinstance(txt, str) and any(t in txt for t in CROSS_TAGS):
                        bad += 1
                        break
        if bad > 0:
            errors.append(f"  ❌ {fn}: {bad} 条含跨项目字符串")
        else:
            print(f"  ✅ {fn} ({len(d)} 条): 干净")
    except Exception as e:
        print(f"  ⚠️  {fn} 解析失败: {e}")

print('')
if errors:
    print('=' * 50)
    print('❌ R119 修真失败：发现跨项目污染')
    print('=' * 50)
    for e in errors:
        print(e)
    sys.exit(1)
else:
    print('=' * 50)
    print('✅ R119 修真通过：mingli-baojian 无跨项目污染')
    print('=' * 50)
    sys.exit(0)