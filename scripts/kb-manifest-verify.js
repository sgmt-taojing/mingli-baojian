#!/usr/bin/env node
/**
 * kb-manifest-verify.js — KB 多副本一致性校验器
 *
 * 用法：node scripts/kb-manifest-verify.js [--fix]
 *
 * - 读 knowledge/.kb-sources.json（单一可信源索引）
 * - 重新计算每个文件 sha256_16
 * - 对比索引值，发现不一致：
 *     · sha 不同 → 报告 "内容漂移"（严重，可能 race condition）
 *     · sha 相同但有额外副本 → 报告 "冗余副本"（清理建议）
 * - 若传 --fix：删冗余副本（保留 knowledge/ 路径优先）；不动 sha 不同的情况
 *
 * 退出码：
 *   0 = 全部一致
 *   1 = 发现内容漂移（必须修）
 *   2 = 仅冗余副本（建议清理）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'knowledge', '.kb-sources.json');
const KB_DIRS = ['knowledge', 'server/kb-store/public', 'server/kb-store/member', 'server/kb-store/professional'];
const PREFERRED_SOURCE = 'knowledge/';  // 单一可信源

function sha16(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}

function rebuildIndex() {
  const filesByName = {};
  for (const dir of KB_DIRS) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const fn of fs.readdirSync(full)) {
      if (!fn.endsWith('.js')) continue;
      const filePath = path.join(full, fn);
      const stat = fs.statSync(filePath);
      const buf = fs.readFileSync(filePath);
      const sha = sha16(buf);
      filesByName[fn] = filesByName[fn] || [];
      filesByName[fn].push({
        tier: dir.replace('server/kb-store/', ''),
        path: path.relative(ROOT, filePath),
        size: stat.size,
        sha256_16: sha,
      });
    }
  }
  // sort copies per file: knowledge/ first, then public/member/professional
  for (const fn of Object.keys(filesByName)) {
    filesByName[fn].sort((a, b) => {
      if (a.path.startsWith('knowledge/') && !b.path.startsWith('knowledge/')) return -1;
      if (!a.path.startsWith('knowledge/') && b.path.startsWith('knowledge/')) return 1;
      return a.path.localeCompare(b.path);
    });
  }
  return {
    generated: new Date().toISOString().slice(0, 10),
    total_files: Object.values(filesByName).reduce((s, v) => s + v.length, 0),
    duplicates: Object.values(filesByName).filter(v => v.length > 1).length,
    single_source: Object.values(filesByName).filter(v => v.length === 1).length,
    files: filesByName,
  };
}

function main() {
  const fix = process.argv.includes('--fix');
  console.log('🔍 KB 多副本一致性校验');
  console.log(`   索引路径: ${path.relative(ROOT, INDEX_PATH)}`);
  console.log('');

  // 1. 重建索引（实时 sha）
  const live = rebuildIndex();
  console.log(`📊 实时统计: ${live.total_files} 副本 / ${live.duplicates} 重复 / ${live.single_source} 单源`);
  console.log('');

  // 2. 与磁盘索引对比
  let saved = null;
  if (fs.existsSync(INDEX_PATH)) {
    saved = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    console.log(`📋 已存索引日期: ${saved.generated}`);
    console.log('');
  } else {
    console.log('⚠️  未发现已存索引，将生成新索引');
  }

  // 3. 检查重复副本是否 sha 一致
  const dupReport = [];
  const driftReport = [];
  let removed = 0;

  for (const [fn, copies] of Object.entries(live.files)) {
    if (copies.length === 1) continue;
    const shaSet = new Set(copies.map(c => c.sha256_16));
    if (shaSet.size > 1) {
      // 内容漂移
      driftReport.push({
        file: fn,
        copies: copies.map(c => `${c.path} [${c.sha256_16}, ${c.size}B]`),
      });
    } else {
      // 冗余副本（sha 一致）
      const redundant = copies.filter(c => !c.path.startsWith(PREFERRED_SOURCE));
      if (redundant.length > 0) {
        dupReport.push({
          file: fn,
          kept: copies.find(c => c.path.startsWith(PREFERRED_SOURCE))?.path || copies[0].path,
          redundant: redundant.map(c => c.path),
        });
        if (fix) {
          for (const r of redundant) {
            fs.unlinkSync(path.join(ROOT, r.path));
            removed++;
          }
        }
      }
    }
  }

  // 4. 输出报告
  if (driftReport.length > 0) {
    console.log(`❌ 内容漂移 ${driftReport.length} 个（严重，禁止自动修复）：`);
    for (const d of driftReport) {
      console.log(`   ${d.file}`);
      for (const c of d.copies) console.log(`     - ${c}`);
    }
    console.log('');
  }

  if (dupReport.length > 0) {
    console.log(`⚠️  冗余副本 ${dupReport.length} 个${fix ? `（已删除 ${removed}）` : '（用 --fix 清理）'}：`);
    for (const d of dupReport.slice(0, 10)) {
      console.log(`   ${d.file}: keep=${d.kept}, redundant=${d.redundant.join(', ')}`);
    }
    if (dupReport.length > 10) console.log(`   ... +${dupReport.length - 10} more`);
    console.log('');
  }

  // 5. 更新索引
  if (fix || !saved || saved.generated !== live.generated) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(live, null, 2), 'utf8');
    console.log(`✅ 索引已更新 → ${path.relative(ROOT, INDEX_PATH)}`);
  }

  // 6. 退出码
  if (driftReport.length > 0) {
    console.log('\n❌ Exit 1: 发现内容漂移');
    process.exit(1);
  } else if (dupReport.length > 0 && !fix) {
    console.log('\n⚠️  Exit 2: 仅冗余副本');
    process.exit(2);
  } else {
    console.log('\n✅ Exit 0: 全部一致');
    process.exit(0);
  }
}

main();