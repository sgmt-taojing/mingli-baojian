#!/usr/bin/env node
/**
 * metadata-repair.js — 元数据补齐专项（2026-10-19，第二十九轮）
 * 1. keywords 空补齐（1,060 条）：由 title + domain + module 派生，不杜撰正文。
 * 2. 空标题补齐（2 条）：取正文前 12 字 + module 前缀。
 * 3. 乱码 junk 自动打标：CJK 占比 <30% 且含 mojibake 特征字符（ÿ/ѡ/֡/˙）——
 *    编码错乱的 PDF/PCS 转储，不可读不可检索；标签可逆不删数据。
 *    （抽样核实：nihaisha-tcm 儒医心镜、shanghan-lun §节、classics 听课笔记、
 *    mingli-cross-moved 网盘案例，全条乱码。）
 * 说明：短标题「空亡」「月刃格」类为正常术语词条不动；mengzhan 千条短内容为原子断语（设计如此）。
 * 用法：node scripts/metadata-repair.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

// 1. keywords 补齐
const noKw = db.prepare(`SELECT entry_id, module, title, domain FROM kb_formal WHERE keywords IS NULL OR keywords=''`).all();
const updKw = db.prepare(`UPDATE kb_formal SET keywords=?, updated_at=datetime('now','localtime') WHERE entry_id=?`);
let kwDone = 0;
if (!dry) db.exec('BEGIN');
for (const r of noKw) {
  const parts = [r.domain, r.module, ...(r.title || '').split(/[·・\-—#§\s]+/)].filter(p => p && p.length >= 2 && p.length <= 12);
  const kw = [...new Set(parts)].slice(0, 6).join(' ');
  if (!kw) continue;
  if (!dry) updKw.run(kw, r.entry_id);
  kwDone++;
}
// 2. 空标题补齐
const noTitle = db.prepare(`SELECT entry_id, module, substr(content,1,12) c FROM kb_formal WHERE title IS NULL OR title=''`).all();
const updTitle = db.prepare(`UPDATE kb_formal SET title=?, updated_at=datetime('now','localtime') WHERE entry_id=?`);
for (const r of noTitle) {
  const t = `${r.module}·${(r.c || '佚名').replace(/\n/g, '')}`;
  if (!dry) updTitle.run(t, r.entry_id);
  console.log(`空标题补齐：${r.entry_id} → 「${t}」`);
}
// 3. 乱码 junk 打标（CJK 占比规则，确定性可复跑）
const suspects = db.prepare(`SELECT entry_id, content FROM kb_formal
  WHERE (content LIKE '%ÿ%' OR content LIKE '%ѡ%' OR content LIKE '%֡%' OR content LIKE '%˙%')`).all();
const tagIns = db.prepare(`INSERT OR IGNORE INTO kb_corpus_tag (entry_id, tag, score, signals) VALUES (?, 'junk', 0.95, '["metadata-repair:mojibake编码错乱"]')`);
let junk = 0, keep = 0;
for (const r of suspects) {
  const c = (r.content || '').slice(0, 500);
  const cjk = (c.match(/[一-鿿]/g) || []).length;
  const ratio = c.length ? cjk / c.length : 0;
  if (ratio < 0.3) { if (!dry) tagIns.run(r.entry_id); junk++; }
  else keep++;
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `keywords 补齐 ${kwDone} 条；空标题补齐 ${noTitle.length} 条`);
console.log((dry ? '[DRY] ' : '') + `乱码嫌疑 ${suspects.length} 条 → junk ${junk} 条（CJK<30%），保留 ${keep} 条（含中文主体）`);
if (!dry) {
  const j = db.prepare(`SELECT COUNT(*) n FROM kb_corpus_tag WHERE tag='junk'`).get();
  console.log(`junk 标签总数现 ${j.n}`);
}
