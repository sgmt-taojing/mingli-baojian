#!/usr/bin/env node
/**
 * Safe expansion of bagua, liushisigua, wuxing sections
 * Strategy: read file as lines, splice in new sections, write to temp, validate, replace
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'authoritative-knowledge-base.js');
const tmpPath = path.join(__dirname, 'authoritative-knowledge-base.js.tmp');

// Read original file
const content = fs.readFileSync(filePath, 'utf8');
const originalSize = Buffer.byteLength(content, 'utf8');

// Read the new section content from generated files
const newBagua = fs.readFileSync(path.join(__dirname, 'new_bagua.txt'), 'utf8');
const newLiushisigua = fs.readFileSync(path.join(__dirname, 'new_liushisigua.txt'), 'utf8');
const newWuxing = fs.readFileSync(path.join(__dirname, 'new_wuxing.txt'), 'utf8');

// Find exact positions using regex
// We need to replace:
// 1. liushisigua section (from "  liushisigua: {" to the line before "  bagua: {")
// 2. bagua section (from "  bagua: {" to the line before "  wuxing: {")
// 3. wuxing section (from "  wuxing: {" to the line before "  shishen: {")

const liushisiguaStart = content.indexOf('  liushisigua: {');
const baguaStart = content.indexOf('  bagua: {');
const wuxingStart = content.indexOf('  wuxing: {');
const shishenStart = content.indexOf('  shishen: {');

if (liushisiguaStart === -1 || baguaStart === -1 || wuxingStart === -1 || shishenStart === -1) {
  console.error('ERROR: Could not find section boundaries');
  process.exit(1);
}

console.log('Found all section boundaries:');
console.log('  liushisigua at byte', liushisiguaStart);
console.log('  bagua at byte', baguaStart);
console.log('  wuxing at byte', wuxingStart);
console.log('  shishen at byte', shishenStart);

// Build the new content
// Everything before liushisigua + new liushisigua + new bagua + new wuxing + everything from shishen onwards
const beforeLiushisigua = content.substring(0, liushisiguaStart);
const fromShishen = content.substring(shishenStart);

// Each new section text should end with proper separator (newline already included)
const newContent = beforeLiushisigua + newLiushisigua + '\n' + newBagua + '\n' + newWuxing + '\n' + fromShishen;

// Write to temp file
fs.writeFileSync(tmpPath, newContent, 'utf8');
const newSize = Buffer.byteLength(newContent, 'utf8');

console.log(`\nFile size: ${originalSize} -> ${newSize} bytes (delta: ${newSize - originalSize})`);

// Validate syntax
try {
  // Copy to a .js file for validation, then remove
  const valPath = tmpPath + '.js';
  fs.copyFileSync(tmpPath, valPath);
  try {
    require('child_process').execSync(`node -c "${valPath}"`, { stdio: 'pipe' });
  } finally {
    try { fs.unlinkSync(valPath); } catch(e) {}
  }
  console.log('✓ Syntax validation passed');
} catch (e) {
  console.error('✗ Syntax validation FAILED:', e.stderr?.toString() || e.message);
  process.exit(1);
}

// Validate structure
try {
  const checkContent = fs.readFileSync(tmpPath, 'utf8');
  const checks = [
    { name: 'bagua', pattern: /bagua:\s*\{/ },
    { name: 'liushisigua', pattern: /liushisigua:\s*\{/ },
    { name: 'wuxing', pattern: /wuxing:\s*\{/ },
    { name: 'shishen', pattern: /shishen:\s*\{/ },
    { name: 'bagua.leiXiang', pattern: /leiXiang:/ },
    { name: 'bagua.xiantian_vs_houtian', pattern: /xiantian_vs_houtian:/ },
    { name: 'bagua.bagua_binary', pattern: /bagua_binary:/ },
    { name: 'wuxing.wuxing_complete_table', pattern: /wuxing_complete_table:/ },
    { name: 'wuxing.wuxing_wangshuai', pattern: /wuxing_wangshuai:/ },
    { name: 'wuxing.wuxing_application', pattern: /wuxing_application:/ },
    { name: 'wuxing.shengke.fansheng', pattern: /fansheng:/ },
    { name: 'wuxing.shengke.fanke', pattern: /fanke:/ },
  ];
  let allOk = true;
  for (const c of checks) {
    if (c.pattern.test(checkContent)) {
      console.log(`  ✓ ${c.name} found`);
    } else {
      console.error(`  ✗ ${c.name} NOT found`);
      allOk = false;
    }
  }
  if (!allOk) {
    console.error('Structure validation FAILED');
    process.exit(1);
  }
  console.log('✓ Structure validation passed');
} catch (e) {
  console.error('Structure validation error:', e.message);
  process.exit(1);
}

// Atomic replace
fs.renameSync(tmpPath, filePath);
console.log(`\n✓ File replaced successfully: ${filePath}`);
console.log(`  Original: ${(originalSize/1024).toFixed(1)} KB`);
console.log(`  New: ${(newSize/1024).toFixed(1)} KB`);
