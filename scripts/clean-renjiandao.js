#!/usr/bin/env node
/**
 * clean-renjiandao.js — ziwei+fengshui+qimen 模块清洗（2026-10-19，第三十二轮）
 * 抽样人工判读 20 条：16 条为可读倪师人间道/易经讲解/紫微案例（仅含水印噪声），
 *   4 条为 PDF 碎片垃圾。结论：不是乱码重灾区，是清洗问题，撤销模块级 junk 候选。
 * 清洗规则（只剥水印噪声，不动正文断语）：
 *   1. 去独立水印行：倪海厦 / 人间道 / 天行健君子以自强不息 / 地势坤君子以厚德载物 / 第N页
 *   2. 去视频时间戳 [1957s] 等
 *   3. 收敛连续空行
 *   4. 【…pdf】PN 碎片且 CJK 连读<15% → junk（可逆）
 *   5. 未打标条目补 modern（倪师课稿=现代讲义），review_status pending 进复核
 * 用法：node scripts/clean-renjiandao.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

const WATERMARK = /^(倪海[厦廈]|人[间間]道|天行健君子以自[强強]不息|地[势勢]坤君子以厚德[载載]物|第\d+页|天纪|天机道)$/;
function clean(text) {
  return (text || '').split('\n')
    .map(l => l.replace(/\[\d{2,5}s\]/g, '').trim())
    .filter(l => l && !WATERMARK.test(l))
    .join('\n');
}
function readable(t) {
  const c = t.replace(/\s/g, '');
  if (!c.length) return 0;
  return ((c.match(/[一-鿿]{6,}/g) || []).reduce((a, r) => a + r.length, 0)) / c.length;
}

const rows = db.prepare(`SELECT entry_id, title, content, summary FROM kb_formal WHERE module='ziwei+fengshui+qimen'`).all();
const upd = db.prepare(`UPDATE kb_formal SET content=?, summary=?, audit_status='watermark-cleaned', updated_at=datetime('now','localtime') WHERE entry_id=?`);
const junkIns = db.prepare(`INSERT OR REPLACE INTO kb_corpus_tag (entry_id, tag, score, signals, review_status) VALUES (?, 'junk', 0.9, '["clean-renjiandao:PDF碎片低可读"]', 'pending')`);
const modIns = db.prepare(`INSERT OR IGNORE INTO kb_corpus_tag (entry_id, tag, score, signals) VALUES (?, 'modern', 0.7, '["clean-renjiandao:倪师课稿"]')`);

let cleaned = 0, fragJunk = 0, tagged = 0, unchanged = 0;
const before = [], after = [];
if (!dry) db.exec('BEGIN');
for (const r of rows) {
  const isFrag = /\.pdf】P\d+/.test(r.title || '');
  if (isFrag && readable(r.content) < 0.15) {
    if (!dry) junkIns.run(r.entry_id);
    fragJunk++; continue;
  }
  const nc = clean(r.content);
  const ns = clean(r.summary || '').slice(0, 160);
  if (nc !== r.content) {
    if (before.length < 2) { before.push(r.content.slice(0, 80)); after.push(nc.slice(0, 80)); }
    if (!dry) upd.run(nc, ns, r.entry_id);
    cleaned++;
  } else unchanged++;
  if (!dry) { const t = modIns.run(r.entry_id); if (t.changes) tagged++; }
}
// FTS 虚表无 entry_id 索引，逐行 UPDATE 是全表扫描——改为整模块一次删一次插
if (!dry && cleaned > 0) {
  db.prepare(`DELETE FROM kb_fts5 WHERE entry_id IN (SELECT entry_id FROM kb_formal WHERE module='ziwei+fengshui+qimen')`).run();
  db.prepare(`INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category)
    SELECT entry_id, module, COALESCE(summary,''), content, COALESCE(keywords,''), COALESCE(category,'')
    FROM kb_formal WHERE module='ziwei+fengshui+qimen'`).run();
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `清洗完成：水印剥除 ${cleaned} 条，未变 ${unchanged} 条，PDF碎片 junk ${fragJunk} 条，modern 补标 ${tagged} 条`);
if (dry) { console.log('清洗前:', before[0]); console.log('清洗后:', after[0]); }
// 同步注册表 note
if (!dry) {
  db.prepare(`UPDATE kb_module_registry SET note='已清洗水印/时间戳；PDF碎片junk', updated_at=datetime('now','localtime') WHERE module='ziwei+fengshui+qimen'`).run();
  console.log('注册表 note 已更新（撤销乱码重灾区候选）');
}
