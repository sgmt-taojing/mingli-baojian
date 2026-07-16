// Part 1: Extract line boundaries and build replacement strings
// This script reads the file, finds section boundaries, and prepares for replacement

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'authoritative-knowledge-base.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find section boundaries
let liushisiguaStart = -1, baguaStart = -1, wuxingStart = -1, shishenStart = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^  liushisigua:/)) liushisiguaStart = i;
  if (lines[i].match(/^  bagua:/)) baguaStart = i;
  if (lines[i].match(/^  wuxing:/)) wuxingStart = i;
  if (lines[i].match(/^  shishen:/)) shishenStart = i;
}

console.log('liushisigua line:', liushisiguaStart + 1);
console.log('bagua line:', baguaStart + 1);
console.log('wuxing line:', wuxingStart + 1);
console.log('shishen line:', shishenStart + 1);

// The sections are:
// liushisigua: from line liushisiguaStart to baguaStart-1 (which is "  },")
// bagua: from line baguaStart to wuxingStart-1
// wuxing: from line wuxingStart to shishenStart-1

console.log('\nLines around bagua end:');
for (let i = baguaStart - 3; i <= baguaStart; i++) console.log(i+1, ':', lines[i]);
console.log('\nLines around wuxing end:');
for (let i = wuxingStart - 3; i <= wuxingStart; i++) console.log(i+1, ':', lines[i]);
console.log('\nLines around shishen start:');
for (let i = shishenStart - 3; i <= shishenStart + 1; i++) console.log(i+1, ':', lines[i]);
