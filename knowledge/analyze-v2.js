// Run with: node analyze-v2.js
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('authoritative-knowledge-base.js', 'utf-8');

// Extract the object after "const AUTHORITATIVE_KNOWLEDGE = "
const match = content.match(/const AUTHORITATIVE_KNOWLEDGE\s*=\s*(\{[\s\S]*\})/);
if (!match) {
  console.log("Failed to find AUTHORITATIVE_KNOWLEDGE");
  process.exit(1);
}

// We need to evaluate the object. Let's do it safely.
const objStr = match[1];
const obj = eval('(' + objStr + ')');

const sections = ['liuyao', 'meihua', 'liuren', 'liushisigua', 'bagua'];
const results = {};

function findShortStrings(obj, path, results) {
  if (typeof obj === 'string') {
    if (obj.length >= 50 && obj.length <= 999) {
      results.push({path: path, length: obj.length, preview: obj.substring(0, 80)});
    }
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => {
      findShortStrings(item, path + '[' + idx + ']', results);
    });
    return;
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      findShortStrings(obj[key], path + '.' + key, results);
    }
  }
}

for (const section of sections) {
  if (!obj[section]) {
    console.log(`Section ${section} not found`);
    continue;
  }
  const entries = [];
  findShortStrings(obj[section], section, entries);
  results[section] = entries;
  console.log(`\n=== ${section}: ${entries.length} entries with length 50-999 ===`);
  for (const e of entries) {
    console.log(`  [${e.length}] ${e.path}`);
    console.log(`    "${e.preview}..."`);
  }
}
