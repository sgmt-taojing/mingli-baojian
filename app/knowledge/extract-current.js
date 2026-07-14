// extract-current-values.js - Extract current values for all entries
const AK = require('./authoritative-knowledge-base.js');
const fs = require('fs');

const sections = ['liuyao', 'meihua', 'liuren', 'liushisigua', 'bagua'];

function findShortStrings(obj, path, results) {
  if (typeof obj === 'string') {
    if (obj.length >= 50 && obj.length <= 999) {
      results.push({path: path, length: obj.length, current: obj});
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

const allEntries = {};
for (const section of sections) {
  if (!AK[section]) continue;
  const entries = [];
  findShortStrings(AK[section], section, entries);
  allEntries[section] = entries;
  console.log(`Section ${section}: ${entries.length} entries`);
}

fs.writeFileSync('all_short_entries.json', JSON.stringify(allEntries, null, 2));
console.log('Written to all_short_entries.json');
