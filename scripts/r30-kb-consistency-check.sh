#!/bin/bash
# R30 KB 一致性治理脚本
# 验证 server/kb-store/ 与 manifest.json 一致性

set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

python3 << 'EOF'
import json, os, hashlib, sys

with open('server/kb-store/manifest.json') as f:
    m = json.load(f)

errors = 0
warnings = 0
for entry in m['files']:
    dst = entry.get('dst')
    expected_md5 = entry.get('md5')
    expected_size = entry.get('size')
    if not dst:
        print(f'  ⚠️ no dst: {entry.get("filename")}')
        warnings += 1
        continue
    if not os.path.exists(dst):
        print(f'  ❌ MISSING: {dst}')
        errors += 1
        continue
    actual_md5 = hashlib.md5(open(dst, 'rb').read()).hexdigest()
    actual_size = os.path.getsize(dst)
    if actual_md5 != expected_md5:
        print(f'  ⚠️ MD5 漂移: {dst} ({actual_md5[:8]} != {expected_md5[:8]})')
        warnings += 1
    if actual_size != expected_size:
        print(f'  ⚠️ size 漂移: {dst} ({actual_size} != {expected_size})')
        warnings += 1

# 找 disk 多余文件
declared = {e['dst'] for e in m['files'] if e.get('dst')}
extra = []
for d in ['admin','registered','premium','professional','member','public']:
    p = f'server/kb-store/{d}'
    if os.path.exists(p):
        for f in os.listdir(p):
            if f.endswith('.js'):
                full = f'server/kb-store/{d}/{f}'
                if full not in declared:
                    full_path = f'server/kb-store/{full}'
                    extra.append(full_path)

for p in extra:
    print(f'  ⚠️ DISK 多了 manifest 没声明: {p}')
    warnings += 1

print()
print(f'=== R30 KB 一致性: {errors} errors / {warnings} warnings ===')
if errors == 0 and warnings == 0:
    print('✅ 一致性 PASS')
    sys.exit(0)
else:
    print('⚠️  需修复')
    sys.exit(1)
EOF
