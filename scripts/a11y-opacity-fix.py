#!/usr/bin/env python3
"""Batch raise low opacity values in CSS for color-contrast compliance.
Only targets `opacity:N` property declarations, NOT keyframe animation values."""
import re, sys, pathlib

# Only raise opacity below 0.7 to 0.78 (AA safe threshold on #080808 bg)
THRESHOLD = 0.70
TARGET = 0.78
TARGET_6 = 0.80  # for .6 range

def fix_line(line):
    # Skip keyframe animation lines (contain {x%} or animation)
    stripped = line.strip()
    if stripped.startswith(('0%,', '100%,', '50%', 'from', 'to', '@keyframes')):
        return line
    # Skip lines that are inside animation property
    if 'animation' in line and 'opacity' in line:
        return line

    # Match opacity:.NN or opacity:.N (CSS shorthand, no leading 0)
    def replacer(m):
        val_str = m.group(1)
        try:
            val = float(val_str)
        except ValueError:
            return m.group(0)
        if val < 0.45:
            return f'opacity:{TARGET}'
        elif val < 0.55:
            return f'opacity:{TARGET}'
        elif val < THRESHOLD:
            return f'opacity:{TARGET_6}'
        return m.group(0)

    return re.sub(r'opacity:(\.\d+)', replacer, line)

files = [
    'app/css/divination-hub-inline.css',
    'app/css/divination-hub.css',
    'app/css/pro-panel.css',
]

base = pathlib.Path('/Users/tom/kimi/projects/mingli-baojian')
total_changes = 0
for f in files:
    p = base / f
    if not p.exists():
        print(f'SKIP {f} (not found)')
        continue
    lines = p.read_text(encoding='utf-8').splitlines(keepends=True)
    new_lines = []
    changes = 0
    for line in lines:
        new = fix_line(line)
        if new != line:
            changes += 1
        new_lines.append(new)
    if changes:
        p.write_text(''.join(new_lines), encoding='utf-8')
        print(f'{f}: {changes} lines changed')
        total_changes += changes
    else:
        print(f'{f}: no changes')

print(f'Total: {total_changes} lines changed')
