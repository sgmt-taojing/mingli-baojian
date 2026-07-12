#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix bazi and liuyao intros - clean rewrite"""
import codecs

def fix_file():
    with codecs.open('/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian/authoritative-knowledge-base.js', 'r', 'utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    print(f"Total lines: {len(lines)}")

    # ==========================================================================
    # Find BAZI intro start and end
    # ==========================================================================
    bazi_intro_start = None
    bazi_intro_end = None
    
    for i, line in enumerate(lines):
        # Find line that starts bazi overview intro
        if '"intro":' in line and '八字命理学是中国传统命理' in line:
            bazi_intro_start = i
            print(f"BAZI intro start: line {i+1}")
            # This line is the start - now find where it ends
            # The intro ends at a line that ends with '",' (closing quote + comma)
            # but NOT at the overview closing brace
            # Check if current line already ends with '",'
            if line.rstrip().endswith('",'):
                # Single-line intro (valid JS)
                print(f"BAZI: single-line intro (valid), length: {len(line)}")
            else:
                # Multi-line, find end
                for j in range(i+1, i+15):
                    if lines[j].strip() == '},' or (lines[j].strip().endswith('",') and not lines[j].startswith('//')):
                        bazi_intro_end = j - 1
                        print(f"BAZI intro end: line {j} (blank line {j+1} or closing line)")
                        break
            break

    # ==========================================================================
    # Find LIUYAO intro start and end
    # ==========================================================================
    liuyao_intro_start = None
    liuyao_intro_end = None
    
    for i, line in enumerate(lines):
        if '"intro":' in line and '六爻是中国历史最悠久' in line:
            liuyao_intro_start = i
            print(f"LIUYAO intro start: line {i+1}")
            if line.rstrip().endswith('",'):
                print(f"LIUYAO: single-line intro (valid)")
            else:
                for j in range(i+1, i+15):
                    if lines[j].strip() == '},' or (lines[j].strip().endswith('",') and not lines[j].startswith('//')):
                        liuyao_intro_end = j - 1
                        print(f"LIUYAO intro end: line {j}")
                        break
            break

    # ==========================================================================
    # Show current intro content for debugging
    # ==========================================================================
    if bazi_intro_start is not None:
        print(f"\nBAZI intro lines ({bazi_intro_start+1} to {bazi_intro_end+1 if bazi_intro_end else '?'}):")
        for i in range(bazi_intro_start, (bazi_intro_end or bazi_intro_start) + 3):
            print(f"  {i+1}: {repr(lines[i][:60])}")

    if liuyao_intro_start is not None:
        print(f"\nLIUYAO intro lines ({liuyao_intro_start+1} to {liuyao_intro_end+1 if liuyao_intro_end else '?'}):")
        for i in range(liuyao_intro_start, (liuyao_intro_end or liuyao_intro_start) + 3):
            print(f"  {i+1}: {repr(lines[i][:60])}")

if __name__ == '__main__':
    fix_file()
