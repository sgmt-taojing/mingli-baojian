#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
A11Y 批量修复 — 节点 4：select-name + label
- 给 <input>/<select> 缺 label/aria-label 的加 aria-label（保留现有 placeholder/options）
- 给 meta viewport 加 user-scalable=yes
- aria-allowed-attr 暂不自动修（ml-tap 是自定义组件）
"""
import re, glob, sys

# 待修页面（按报告）
TARGETS = [
  'admin-glass-dashboard.html',
  'export-guard.html',
  'glass-console.html',
  'lifeplan-detail.html',
  'master-zidise-illness.html',
  'wechat-h5.html',
  'wechat-hub.html',
  'components-demo.html',
  'divination-shop.html',
  'doctor-elder.html',
  'kb-explorer.html',
  'master-disease.html',
  'master-elder.html',
  'merchant-apply.html',
  'music-detail.html',
  'tcm-symptom.html',
  'youthplan-detail.html',
  'fengshui.html',
]

# select/input id → 中文 label
SELECT_LABELS = {
  'testMethod': '请求方法',
  'broadcastUrgency': '广播紧急度',
  'wxBaziHour': '八字时辰',
  # 通用兜底：找不到的用 id 自身中文转
}

total_fix = 0

for page in TARGETS:
  fp = f'app/{page}'
  with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()
  orig = content
  fixes = []

  # 修复 1：select/input 缺 label 加 aria-label（按报告里的 id）
  for sel_id in SELECT_LABELS:
    label_text = SELECT_LABELS[sel_id]
    # 找 <select id="xxx" ... >  看有无 aria-label / <label for
    pat = rf'(<select[^>]*\bid="{sel_id}"[^>]*?)(>)'
    m = re.search(pat, content)
    if m and 'aria-label' not in m.group(1):
      new_attr = m.group(1) + f' aria-label="{label_text}"' + m.group(2)
      content = content.replace(m.group(0), new_attr, 1)
      fixes.append(f'+ aria-label {sel_id}={label_text}')

  # 修复 2：通用 select-name 兜底
  # 遍历 <select ... id="X" ... > 检查
  for m in re.finditer(r'<select\b[^>]*?>', content):
    tag = m.group(0)
    if 'aria-label' in tag or 'aria-labelledby' in tag:
      continue
    # 找是否有对应的 <label for=
    id_m = re.search(r'\bid="([^"]+)"', tag)
    if not id_m:
      continue
    sel_id = id_m.group(1)
    if not re.search(rf'<label[^>]*\bfor="{sel_id}"', content):
      # 加 aria-label 用 id
      label = SELECT_LABELS.get(sel_id, sel_id.replace('_', ' '))
      new_tag = tag.replace('<select', f'<select aria-label="{label}"', 1)
      content = content.replace(tag, new_tag, 1)
      fixes.append(f'+ select aria-label {sel_id}')

  # 修复 3：input 缺 label
  for m in re.finditer(r'<input\b[^>]*?>', content):
    tag = m.group(0)
    if 'aria-label' in tag or 'aria-labelledby' in tag:
      continue
    id_m = re.search(r'\bid="([^"]+)"', tag)
    if not id_m:
      continue
    inp_id = id_m.group(1)
    if not re.search(rf'<label[^>]*\bfor="{inp_id}"', content):
      label = SELECT_LABELS.get(inp_id, inp_id.replace('_', ' '))
      new_tag = tag.replace('<input', f'<input aria-label="{label}"', 1)
      content = content.replace(tag, new_tag, 1)
      fixes.append(f'+ input aria-label {inp_id}')

  # 修复 4：meta viewport 加 user-scalable=yes
  if 'meta name="viewport"' in content:
    m = re.search(r'<meta\s+name="viewport"\s+content="([^"]*)"', content)
    if m and 'user-scalable' not in m.group(1):
      new_content = m.group(1)
      if 'maximum-scale' in new_content:
        new_content = re.sub(r'maximum-scale=[0-9.]+', 'maximum-scale=5', new_content)
      else:
        new_content += ', maximum-scale=5'
      if 'user-scalable' not in new_content:
        new_content += ', user-scalable=yes'
      content = content.replace(m.group(0), f'<meta name="viewport" content="{new_content}"')
      fixes.append('+ viewport user-scalable')

  if content != orig:
    with open(fp, 'w', encoding='utf-8') as f:
      f.write(content)
    total_fix += len(fixes)
    print(f'✅ {page}: {len(fixes)} 修复')
    for f_msg in fixes[:5]:
      print(f'    {f_msg}')
  else:
    print(f'⏭ {page}: 无需修复')

print(f'\n=== 总计 {total_fix} 项修复 ===')