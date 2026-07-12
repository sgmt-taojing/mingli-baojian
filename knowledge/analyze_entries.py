"""Analyze authoritative-knowledge-base.js to find entries in 5 sections with string length 50-999."""
import re

with open("authoritative-knowledge-base.js", "r") as f:
    content = f.read()

# Find section boundaries
sections = ["liuyao", "meihua", "liuren", "liushisigua", "bagua"]
section_positions = {}
for s in sections:
    match = re.search(rf'\n\s+{s}:\s*\{{', content)
    if match:
        section_positions[s] = match.start()

# Find the next top-level key after each section to determine end
section_ends = {}
for s in sections:
    start = section_positions[s]
    # Find next top-level key that starts a new section
    remaining = content[start+1:]
    next_match = re.search(r'\n\s+\w+:\s*\{', remaining)
    if next_match:
        section_ends[s] = start + 1 + next_match.start()
    else:
        section_ends[s] = len(content)

for s in sections:
    sect_content = content[section_positions[s]:section_ends[s]]
    print(f"\n{'='*60}")
    print(f"Section: {s} (length: {len(sect_content)} chars)")
    print(f"{'='*60}")
    
    # Find all string values in this section
    # Look for patterns like key: "value" or key: 'value' or key: `value`
    # Also strings in arrays like ["value", "value2"]
    strings = []
    # Single-line strings
    for m in re.finditer(r"(['\"])((?:(?!\1).)*)\1", sect_content):
        val = m.group(2)
        if 50 <= len(val) <= 999:
            # Get context - what key this belongs to
            before = sect_content[max(0, m.start()-200):m.start()]
            # Find the closest key name
            key_match = re.search(r'(\w+)\s*:\s*$', before.rstrip())
            key = key_match.group(1) if key_match else "unknown"
            strings.append({"key": key, "val": val, "len": len(val), "pos": section_positions[s] + m.start()})
    
    print(f"\nFound {len(strings)} entries with length 50-999:")
    for item in strings[:50]:  # Show first 50
        print(f"  [{item['len']}] {item['key']}: {item['val'][:80]}...")
    if len(strings) > 50:
        print(f"  ... and {len(strings) - 50} more")
    
    # Find multiline/template strings
    multiline = []
    for m in re.finditer(r'`([^`]*)`', sect_content):
        val = m.group(1)
        if 50 <= len(val) <= 999:
            before = sect_content[max(0, m.start()-200):m.start()]
            key_match = re.search(r'(\w+)\s*:\s*$', before.rstrip())
            key = key_match.group(1) if key_match else "unknown"
            multiline.append({"key": key, "val": val[:80], "len": len(val), "pos": section_positions[s] + m.start()})
    
    print(f"\nMultiline strings length 50-999: {len(multiline)}")
    for item in multiline[:20]:
        print(f"  [{item['len']}] {item['key']}: {item['val']}...")
