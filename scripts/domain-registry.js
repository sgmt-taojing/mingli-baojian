#!/usr/bin/env node
/**
 * domain-registry.js — domain 注册表统一 + 复核清单定归（2026-10-19，第二十八轮）
 * 1. 词汇表统一：mingli→命理、reference→参考、tech→参考（已核查无代码依赖取值，
 *    api-server-v2.js 的 'mingli' 命中均为 mode 字段，与 domain 无关）。
 * 2. 复核清单定归（抽样核实后）：monthly_cure→民俗（月令吉方吉物化解）、
 *    yanzhi→参考（JS知识源dump，另列为 junk 候选进裁决队列）、
 *    distill_wenmo_*→八字（节气四柱/流日/流时/真太阳时排法）、
 *    distill_fusion_*→命理（医命融合研究笔记）。
 * 3. general/epb 系列 509 条已裁决 junk、检索不可见，留 NULL 不粉饰。
 * 用法：node scripts/domain-registry.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

const RENAME = [['mingli', '命理'], ['reference', '参考'], ['tech', '参考']];
const ASSIGN = {
  '民俗': ['monthly_cure'],
  '参考': ['yanzhi'],
  '八字': ['distill_wenmo_jieqi', 'distill_wenmo_liuri', 'distill_wenmo_liushi', 'distill_wenmo_zhensolar'],
  '命理': ['distill_fusion_kline_yunqi', 'distill_fusion_paipan_code', 'distill_fusion_sanpan_yixian', 'distill_fusion_zhensolar_liushi']
};

if (!dry) db.exec('BEGIN');
for (const [from, to] of RENAME) {
  const n = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE domain=?`).get(from).n;
  if (!dry && n) db.prepare(`UPDATE kb_formal SET domain=?, updated_at=datetime('now','localtime') WHERE domain=?`).run(to, from);
  console.log(`改名 ${from} → ${to}: ${n} 条`);
}
for (const [domain, mods] of Object.entries(ASSIGN)) {
  for (const m of mods) {
    const n = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE module=? AND (domain IS NULL OR domain='')`).get(m).n;
    if (!n) continue;
    if (!dry) db.prepare(`UPDATE kb_formal SET domain=?, updated_at=datetime('now','localtime') WHERE module=? AND (domain IS NULL OR domain='')`).run(domain, m);
    console.log(`定归 ${m} → ${domain}: ${n} 条`);
  }
}
if (!dry) db.exec('COMMIT');

console.log('\n=== 最终 domain 注册表 ===');
db.prepare(`SELECT domain, COUNT(*) n FROM kb_formal WHERE domain IS NOT NULL AND domain!='' GROUP BY domain ORDER BY n DESC`).all()
  .forEach(r => console.log(`  ${r.domain}: ${r.n}`));
const rest = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE domain IS NULL OR domain=''`).get();
console.log(`留空（junk 不可见）：${rest.n} 条`);
