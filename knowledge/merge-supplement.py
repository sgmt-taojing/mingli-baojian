#!/usr/bin/env python3
"""
合并补充内容到 authoritative-knowledge-base.js
读取 supplement-group3.js 中的扩展内容，找到对应条目并替换
"""
import re

# Read the original file
with open('authoritative-knowledge-base.js', 'r', encoding='utf-8') as f:
    original = f.read()

# Read the supplement file
with open('supplement-group3.js', 'r', encoding='utf-8') as f:
    supplement_content = f.read()

# Parse supplement file to extract domain -> key -> value mappings
# Each entry in supplement looks like:
#   "key_name": "expanded content...",

# Strategy: extract domain blocks and their entries
domains_processed = {
    'fengshui': ['五行分区', '一卦管三山', '天地人三元', '内盘', '木', '火', '土', '金', '水'],
    'tizhi': ['十二宫位', '十四主星', 'history', 'practical_value', '铜钱起卦法', '数字起卦法',
              '命运影响', 'analysis', '东四命', '游年九星', '三元九运', '九星',
              'meaning', 'interpretation', '身宫'],
    'shishen': ['官印相生', '杀印相生', '食神制杀', '食伤生财', '伤官见官', '伤官配印',
                '财生杀党', '比劫夺财', '财官双美', '枭神夺食', '官杀混杂', '杀刃相随',
                '印制伤官', '身杀两停', '伤官伤尽', '食神吐秀'],
    'nayin': ['纳音生克', '纳音合婚', '纳音与健康', '纳音断事', '本质区别', '排列规律',
              '应用区别', '主次关系'],
    'shensha': ['天德贵人'],
    'hechong': ['合化条件', '冲的力量', '刑的后果', '害的影响', '合冲刑害的优先级'],
}

# Parse supplement-group3.js for the actual expanded content
# Extract key:value pairs from each domain
import json

# Use regex to find domain blocks and their entries
supplement_data = {}
for domain in ['fengshui', 'tizhi', 'shishen', 'nayin', 'shensha', 'hechong']:
    # Find the domain block
    pattern = rf'const\s+(\w+)\s*=\s*({{\s*"([^"]*)":\s*"((?:[^"\\]|\\.)*)"\s*[,}}])'
    supplement_data[domain] = {}
    
    # Find domain section in the supplement file
    domain_pattern = rf"'{domain}':\s*\{{([^}}]*(?:\{{[^}}]*\}}[^}}]*)*)\}}"
    match = re.search(domain_pattern, supplement_content, re.DOTALL)
    if match:
        block = match.group(1)
        # Extract key-value pairs
        kv_pattern = re.compile(r"'([^']*)':\s*'((?:[^'\\]|\\'|\\\\|\\n)*)'", re.DOTALL)
        for m in kv_pattern.finditer(block):
            key = m.group(1)
            value = m.group(2)
            # Unescape
            value = value.replace("\\'", "'").replace('\\n', '\n').replace('\\\\', '\\')
            supplement_data[domain][key] = value

print(f"Parsed supplement data:")
for domain, entries in supplement_data.items():
    print(f"  {domain}: {len(entries)} entries loaded")

# Now merge: find each entry in original and replace
modified = original
total_replaced = 0

for domain, keys in domains_processed.items():
    domain_entries = supplement_data.get(domain, {})
    for key in keys:
        if key not in domain_entries:
            continue
        
        new_value = domain_entries[key]
        if len(new_value) < 1000:
            print(f"  WARNING: {domain}.{key} expanded length={len(new_value)} < 1000, skipping")
            continue
        
        # Find the key in the original file and replace its value
        # Need to locate the exact occurrence within the domain section
        # Strategy: find "key": "old_value" pattern and replace
        escaped_new = new_value.replace('\\', '\\\\').replace('\n', '\\n').replace('"', '\\"')
        
        # Find the key=value pair to replace
        # The key might appear multiple times, so we need domain context
        # Find the domain start position
        domain_start_pattern = f'\n  {domain}:'
        domain_pos = modified.find(domain_start_pattern)
        if domain_pos < 0:
            print(f"  WARNING: domain {domain} start not found")
            continue
        
        # Find key in the domain section
        # Look for "key": pattern after domain start
        key_pattern = f'"{key}":'
        search_start = domain_pos
        while True:
            pos = modified.find(key_pattern, search_start)
            if pos < 0:
                print(f"  WARNING: {domain}.{key} key not found after domain start")
                break
            
            # Extract the current value to verify it's in the right domain
            # Find the value start: after the opening quote
            value_start = pos + len(key_pattern) + 1  # skip " and space or " 
            if modified[value_start-1] == ' ':
                value_start = pos + len(key_pattern)  # no extra space
            
            # Find the value: it's between quotes
            # Jump to the opening quote
            qpos = modified.find('"', pos + len(key_pattern))
            if qpos < 0:
                break
            qpos += 1  # move past opening quote
            
            # Find the closing quote (handle escaped quotes)
            endpos = qpos
            while endpos < len(modified):
                if modified[endpos] == '\\':
                    endpos += 2
                elif modified[endpos] == '"':
                    break
                else:
                    endpos += 1
            
            old_value = modified[qpos:endpos]
            
            # Check if within our target length range (50-999)
            if 50 <= len(old_value) < 1000:
                # This is our target - replace it
                new_full = '"' + escaped_new + '"'
                modified = modified[:qpos] + escaped_new + modified[endpos:]
                total_replaced += 1
                print(f"  REPLACED: {domain}.{key} ({len(old_value)} -> {len(new_value)} chars)")
                break
            else:
                # This key exists but value is not in target range, keep looking
                search_start = endpos + 1
                continue

print(f"\n=== TOTAL REPLACED: {total_replaced} entries ===")

# Write the modified file
with open('authoritative-knowledge-base.js', 'w', encoding='utf-8') as f:
    f.write(modified)

print("authoritative-knowledge-base.js updated successfully!")
