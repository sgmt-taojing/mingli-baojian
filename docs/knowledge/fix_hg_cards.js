const fs = require('fs');
const path = require('path');

const root = '/Users/tom/.openclaw-autoclaw/workspace/projects/mingli-baojian';
const filePath = path.join(root, 'divination-hub.html');
let html = fs.readFileSync(filePath, 'utf8');

// Find the occurrence of "三十四卦" (lower section start)
const marker = '三十四卦';
const markerIdx = html.indexOf(marker);

if (markerIdx === -1) {
  console.error('未找到下经标记');
  process.exit(1);
}

console.log('找到下经位置:', markerIdx);

// Split into upper and lower parts
const upperPart = html.slice(0, markerIdx);
const lowerPart = html.slice(markerIdx);

// Replace in lower part only: hg-card-0..33 -> hg-card-30..63
// and toggleHexagramDetail(0..33) -> toggleHexagramDetail(30..63)
let newLower = lowerPart;
for (let i = 33; i >= 0; i--) {
  const newIdx = i + 30;
  // Replace hg-card-i with hg-card-newIdx
  const regex = new RegExp(`hg-card-${i}\\b`, 'g');
  newLower = newLower.replace(regex, `hg-card-${newIdx}`);
  // Replace toggleHexagramDetail(i) with toggleHexagramDetail(newIdx)
  const regex2 = new RegExp(`toggleHexagramDetail\\(${i}\\)`, 'g');
  newLower = newLower.replace(regex2, `toggleHexagramDetail(${newIdx})`);
}

const newHtml = upperPart + newLower;

// Verify no duplicates
const ids = [...newHtml.matchAll(/id=["']hg-card-(\d+)["']/g)].map(m => parseInt(m[1]));
const idSet = new Set(ids);
console.log('hg-card 数量:', ids.length, '唯一数量:', idSet.size);
console.log('最大ID:', Math.max(...ids), '最小ID:', Math.min(...ids));

if (ids.length !== idSet.size) {
  console.error('仍有重复ID');
  process.exit(1);
}

fs.writeFileSync(filePath, newHtml);
console.log('已修复64卦卡片ID重复问题');

// Save a backup
const backupPath = path.join(root, 'divination-hub.html.bak.' + Date.now());
fs.writeFileSync(backupPath, html);
console.log('备份已保存:', backupPath);
