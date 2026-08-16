#!/usr/bin/env python3
"""
R119 DPO 训练集修真（2026-08-16）
- 把 metadata.module ∈ {smart-home-family, family-life, epb-assistant,
  wechat-platform, digital-workshop, digital-ecosystem} 的 130 条迁出
- 归档到 data/archived-dpo/cross-project-20260816.json（保留可追溯）
- 重出 ChatML（兼容 LLaMA-Factory）
"""
import json, os, shutil
from pathlib import Path
from collections import Counter

ROOT = Path('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian')
CROSS_TAGS = ('smart-home-family', 'family-life', 'epb-assistant',
              'wechat-platform', 'digital-workshop', 'digital-ecosystem')
ARCHIVE_DIR = ROOT / 'data' / 'archived-dpo'
ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
ARCHIVE_FILE = ARCHIVE_DIR / 'cross-project-20260816.json'

# 1) 备份原文件
backup_dir = ROOT / '.openclaw/tmp'
backup_dir.mkdir(parents=True, exist_ok=True)
for fn in ['data/mingli_dpo_train.json', 'data/mingli_dpo_val.json']:
    src = ROOT / fn
    dst = backup_dir / f'{Path(fn).name}.pre-r119-bak'
    shutil.copy(src, dst)
    print(f'  📦 备份 {fn} → {dst.name}')

# 2) 修真 + 归档
archived_all = []
stats = {}
for fn in ['data/mingli_dpo_train.json', 'data/mingli_dpo_val.json']:
    path = ROOT / fn
    with open(path) as f:
        data = json.load(f)
    keep, removed = [], []
    for x in data:
        m = x.get('metadata', {}).get('module', '')
        if m in CROSS_TAGS:
            x['_archived_from'] = fn
            x['_archived_reason'] = f'r119-cross-project:{m}'
            removed.append(x)
        else:
            keep.append(x)
    stats[fn] = {'orig': len(data), 'keep': len(keep), 'removed': len(removed)}
    archived_all.extend(removed)
    with open(path, 'w') as f:
        json.dump(keep, f, ensure_ascii=False, indent=2)
    print(f'  ✅ {fn}: 留 {len(keep)} / 删 {len(removed)}')

with open(ARCHIVE_FILE, 'w') as f:
    json.dump(archived_all, f, ensure_ascii=False, indent=2)
print(f'  📦 归档 {len(archived_all)} 条 → {ARCHIVE_FILE.relative_to(ROOT)}')

# 3) 模块分布回查
print('\n=== 修真后 DPO 集模块分布 ===')
for fn in ['data/mingli_dpo_train.json', 'data/mingli_dpo_val.json']:
    path = ROOT / fn
    with open(path) as f:
        d = json.load(f)
    c = Counter(x.get('metadata', {}).get('module', 'NONE') for x in d)
    top = dict(c.most_common(8))
    print(f'  {fn} ({len(d)} 条): {top}')
    # 修真后的跨项目标签数
    cross = sum(v for k, v in c.items() if k in CROSS_TAGS)
    print(f'    跨项目残留: {cross} {"✅" if cross == 0 else "❌"}')

# 4) 跑 sft-compliance-check.py 验证（如果存在）
print('\n=== 修真结论 ===')
print(f'  删除 DPO 跨项目: {stats["data/mingli_dpo_train.json"]["removed"] + stats["data/mingli_dpo_val.json"]["removed"]} 条')
print(f'  mingli_dpo_train: {stats["data/mingli_dpo_train.json"]["keep"]} 条')
print(f'  mingli_dpo_val:   {stats["data/mingli_dpo_val.json"]["keep"]} 条')
print(f'  归档文件: data/archived-dpo/cross-project-20260816.json')
