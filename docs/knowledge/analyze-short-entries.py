#!/usr/bin/env python3
"""Analyze short entries (50-999 chars) in the 6 target domains."""
import re, json

with open('authoritative-knowledge-base.js', 'r') as f:
    content = f.read()

# Extract the AUTHORITATIVE_KNOWLEDGE object
# We need to find string entries in fengshui, tizhi, shishen, nayin, shensha, hechong
# Find all string values and their line numbers

target_domains = ['fengshui', 'tizhi', 'shishen', 'nayin', 'shensha', 'hechong']

# Find the start line of each domain
domain_starts = {}
for domain in target_domains:
    # Look for "domain:" pattern at top level (with 2-space indent)
    pattern = rf'^  {domain}:'
    for i, line in enumerate(content.split('\n'), 1):
        if re.match(pattern, line):
            domain_starts[domain] = i
            break

print("Domain start lines:", json.dumps(domain_starts, indent=2))

# Now identify short string entries
# Strategy: find all string values and their context
# Strings that are between 50-999 chars in length

# Parse the JS-like object to find all string values with their paths
lines = content.split('\n')
total_short = 0

for domain, start_line in sorted(domain_starts.items(), key=lambda x: x[1]):
    in_domain = False
    domain_end = None
    next_domains = sorted([v for k,v in domain_starts.items() if v > start_line])
    if next_domains:
        domain_end = next_domains[0]
    
    # Read lines from start_line to domain_end
    domain_text = '\n'.join(lines[start_line-1:domain_end-1]) if domain_end else '\n'.join(lines[start_line-1:])
    
    # Find all string values (anything in quotes) that are between 50-999 chars
    # The pattern: "key": "value" or "plain_string"
    string_pattern = re.compile(r'"([^"]*?)"\s*:\s*"((?:[^"\\]|\\.)*)"', re.DOTALL)
    
    matches = string_pattern.findall(domain_text)
    
    short_entries = []
    for key, value in matches:
        if 50 <= len(value) < 1000:
            short_entries.append({
                'key': key,
                'length': len(value),
                'preview': value[:80] + ('...' if len(value) > 80 else '')
            })
    
    if short_entries:
        total_short += len(short_entries)
        print(f"\n--- {domain} ({len(short_entries)} short entries) ---")
        for e in short_entries[:20]:  # First 20
            print(f"  key={e['key']}, len={e['length']}: {e['preview']}")
        if len(short_entries) > 20:
            print(f"  ... and {len(short_entries) - 20} more")
    else:
        print(f"\n--- {domain}: NO short entries found ---")

print(f"\n=== TOTAL SHORT ENTRIES: {total_short} ===")
