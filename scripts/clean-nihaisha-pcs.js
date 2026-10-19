#!/usr/bin/env node
/**
 * clean-nihaisha-pcs.js — nihaisha_pcs 乱码前缀剥除（2026-10-19，第三十三轮）
 * 抽样判读：医案正文可读（倪醫師病案紀錄/诊疗日志），仅开头几行为编码错乱垃圾
 *   （「急勰橢橢砢砢,t$X!籠0^o」类），73/1274 条含此前缀。
 * 规则：剥除开头 CJK 占比 <40% 的行，直到首个可读行；正文不动。
 * ziwei+fengshui 同轮核验：无水印无时间戳、已全部打标，无需清洗，仅更新注册表 note。
 * 用法：node scripts/clean-nihaisha-pcs.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

function lineCJK(l) { const c = l.replace(/\s/g, ''); if (!c.length) return 1; return ((c.match(/[一-鿿]/g) || []).length) / c.length; }
// Big5 错码特征字 + 正文锚点（抽样验证：1000 条含错码前缀，994 可切，6 不可切留原样）
const MOJI = /[勰橢墭偻偱驠篰飑砢嘐嬅亁憮孧孁甊寚嫰谠緥堲訬鸸鴑鮠劢櫲欪殶濞瀖煊葜濒澩璦県磸怣獎ｱ]/;
const ANCHORS = ['倪醫師病案紀錄', '倪医师病案', '倪海厦', '倪海廈', '天机道', '天機道', '天纪', '天紀', '诊疗日志', '診療日誌', '听课笔记', '聽課筆記', '手纹诊治', '手穴'];
function mojibakeCut(c) {
  let idx = -1;
  for (const a of ANCHORS) { const i = c.indexOf(a); if (i >= 0 && (idx < 0 || i < idx)) idx = i; }
  if (idx >= 0) return idx;
  const re = /[一-鿿]{6,}/g; let m;
  while ((m = re.exec(c))) { if (!MOJI.test(m[0]) && /[，。：、（「]/.test(c.slice(m.index, m.index + 50))) return m.index; }
  return -1;
}

const rows = db.prepare(`SELECT entry_id, content FROM kb_formal WHERE module='nihaisha_pcs'`).all();
const upd = db.prepare(`UPDATE kb_formal SET content=?, audit_status='prefix-cleaned', updated_at=datetime('now','localtime') WHERE entry_id=?`);
let cleaned = 0;
const samples = [];
if (!dry) db.exec('BEGIN');
for (const r of rows) {
  const lines = (r.content || '').split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() && lineCJK(lines[i]) < 0.4) i++;
  if (i > 0 && i < lines.length) {
    if (samples.length < 2) samples.push({ before: lines.slice(0, i).join('⏎').slice(0, 50), after: lines[i].slice(0, 50) });
    if (!dry) upd.run(lines.slice(i).join('\n'), r.entry_id);
    cleaned++;
    continue;
  }
  // 行内错码前缀：锚点/连读规则切割（正文不动）
  const joined = lines.join('\n');
  if (MOJI.test(joined.slice(0, 100))) {
    const cut = mojibakeCut(joined);
    if (cut > 0) {
      if (samples.length < 4) samples.push({ before: joined.slice(0, cut).replace(/\n/g, '⏎').slice(0, 40), after: joined.slice(cut, cut + 40) });
      if (!dry) upd.run(joined.slice(cut), r.entry_id);
      cleaned++;
    }
  }
}
if (!dry && cleaned > 0) {
  db.prepare(`DELETE FROM kb_fts5 WHERE entry_id IN (SELECT entry_id FROM kb_formal WHERE module='nihaisha_pcs')`).run();
  db.prepare(`INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category)
    SELECT entry_id, module, COALESCE(summary,''), content, COALESCE(keywords,''), COALESCE(category,'')
    FROM kb_formal WHERE module='nihaisha_pcs'`).run();
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `乱码前缀剥除 ${cleaned} 条`);
samples.forEach(s => console.log('  剥除:「' + s.before + '」→ 正文自「' + s.after + '」起'));
if (!dry) {
  db.prepare(`UPDATE kb_module_registry SET note='乱码前缀已清洗', updated_at=datetime('now','localtime') WHERE module='nihaisha_pcs'`).run();
  db.prepare(`UPDATE kb_module_registry SET note='抽样合格：可读课稿，无需清洗', updated_at=datetime('now','localtime') WHERE module='ziwei+fengshui'`).run();
  console.log('注册表 note 已同步（两模块）');
}
