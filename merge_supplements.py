#!/usr/bin/env python3
"""Merge supplement content into knowledge base, properly escaping strings"""

import subprocess
import json
import re

# Read supplement entries
with open('knowledge/supplement-group2.js', 'r', encoding='utf-8') as f:
    supp = f.read()

# Parse entries: { path: "...", content: "..." }
# The content uses \n for newlines (escaped in the JS source)
entries = []
# More robust parsing
pattern = r'path:\s*"([^"]+)"\s*,\s*\n\s*content:\s*"((?:[^"\\]|\\.)*)"\s*}'
for m in re.finditer(pattern, supp):
    path = m.group(1)
    content = m.group(2)
    # The content has \n as literal backslash-n in the source
    # We want to keep them as \n in the JS string (escaped newlines)
    entries.append((path, content))

print(f'Parsed {len(entries)} entries')

# Get current short entries from KB
result = subprocess.run(
    ['node', '-e', '''
const kb = require('./knowledge/authoritative-knowledge-base.js');
const data = kb.AUTHORITATIVE_KNOWLEDGE || kb.default || kb;
const entries = [];
function scan(obj, path) {
  if (typeof obj === 'string' && obj.length >= 50 && obj.length < 1000) {
    entries.push({path, text: obj, len: obj.length});
  } else if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) obj.forEach((item, i) => scan(item, path + '[' + i + ']'));
    else for (const [k, v] of Object.entries(obj)) scan(v, path ? path + '.' + k : k);
  }
}
Object.keys(data).forEach(key => scan(data[key], key));
entries.forEach(e => console.log(JSON.stringify(e)));
'''],
    capture_output=True, text=True
)

current = []
for line in result.stdout.strip().split('\n'):
    if line:
        try:
            current.append(json.loads(line))
        except:
            pass

print(f'Found {len(current)} short entries in KB')

# Read the JS file
with open('knowledge/authoritative-knowledge-base.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Match and replace
matched = 0
unmatched_paths = []

for spath, scontent in entries:
    found = False
    for ce in current:
        if ce['path'] == spath:
            old_text = ce['text']
            if old_text in js:
                # The supplement content already has \n as escaped newlines
                # We need to also escape any double quotes in the content
                escaped_content = scontent.replace('"', '\\"')
                # But \n should stay as \n (already escaped)
                js = js.replace(old_text, escaped_content, 1)
                matched += 1
                found = True
                break
    if not found:
        unmatched_paths.append(spath)

print(f'Replaced: {matched}')
if unmatched_paths:
    print(f'Unmatched: {len(unmatched_paths)}')
    for u in unmatched_paths[:5]:
        print(f'  {u}')

# Write
with open('knowledge/authoritative-knowledge-base.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('Done')
