// Run: node analyze-v3.js
// Use require to load the module properly
const path = require('path');
const AK = require('./authoritative-knowledge-base.js');

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

let total = 0;
for (const section of sections) {
  if (!AK[section]) {
    console.log(`Section ${section} not found`);
    continue;
  }
  const entries = [];
  findShortStrings(AK[section], section, entries);
  results[section] = entries;
  total += entries.length;
  console.log(`\n=== ${section}: ${entries.length} entries ===`);
  for (const e of entries) {
    console.log(`  [${e.length}] ${e.path}`);
    console.log(`    "${e.preview}..."`);
  }
}
console.log(`\n=== TOTAL: ${total} entries ===`);
