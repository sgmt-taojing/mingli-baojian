#!/usr/bin/env node
/**
 * mengzhan-slice.js — 梦占门类条目化（2026-10-19，第二十三轮）
 * 病灶：库内已有《梦占逸旨》（术数全书中卷 OCR）、玉匣记梦占、梅花梦境应等古籍内容，
 * 但封存在 8 页一块的 OCR 大块里（标题无梦关键词），「梦见X」查询零召回、诚实无记载。
 * 本脚本：按断语单元切条 → module='mengzhan' 入 kb_formal + kb_fts5，summary/tags 带「梦见X」短语。
 * 铁律：只切分项目内已有 OCR 原文，一字不改；OCR 错字原样保留，trust_score 0.7 标 ocr-unverified。
 * 用法：node scripts/mengzhan-slice.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

// 源条目：classics 含梦 OCR 大块 + 玉匣记 + 梅花 + monthly_cure 梦占
const sources = db.prepare(`
  SELECT entry_id, title, content FROM kb_formal
  WHERE (module IN ('classics','folklore','huangli') AND content LIKE '%梦%' AND LENGTH(content) > 800)
     OR (module = 'meihua' AND title LIKE '%梦境%')
     OR (module = 'monthly_cure' AND title LIKE '%梦%')
`).all();

function bookOf(t) {
  if (t.includes('玉匣记')) return '图注增补玉匣记';
  if (t.includes('梅花')) return '梅花易数';
  if (t.includes('术数全书·中') || t.includes('中册')) return '梦占逸旨（术数全书·中卷）';
  if (t.includes('术数全书·下') || t.includes('下册')) return '术数全书·下卷';
  if (t.includes('术数全书·上') || t.includes('上册')) return '术数全书·上卷';
  if (t.includes('术数全书')) return '术数全书';
  return '梦占古籍';
}
function pageOf(t) {
  const m = t.match(/OCR第([\d-]+)页/);
  return m ? 'OCR第' + m[1] + '页' : '';
}

// 断语切分：按句读，含「梦」的句子为断语核；与前后短句合并成 8~160 字单元
function sliceDreams(text) {
  const clean = text.replace(/---\s*PAGE BREAK\s*---/gi, '。')
    .replace(/【第\d+页】/g, '')          // 去页眉（防指纹失效致同断语重复入库）
    .replace(/梦占逸旨\s*\d+/g, '')        // 去书眉页码
    .replace(/\s+/g, '');
  const sents = clean.split(/(?<=。|！|？|；)/);
  const units = [];
  let cur = '';
  for (const s of sents) {
    if (s.includes('梦')) {
      // 每个「梦」句独立成条（断语原子化），不再多句链式合并——避免标题锚漂移
      if (cur) { units.push(cur); }
      cur = s;
    } else if (cur && cur.length < 100 && s.length <= 40 && !/[梦占验第页]/.test(s)) {
      cur += s; // 紧随的短句多为断语（主Y），并入
    } else if (cur && cur.length >= 8) {
      units.push(cur); cur = '';
    }
  }
  if (cur && cur.length >= 8) units.push(cur);
  return units.filter(u => u.includes('梦') && u.length >= 8 && u.length <= 300);
}

// 提取「梦见X」短语做检索锚（summary/tags 用）
const ANCHOR_STOP = new Set(['梦占', '解梦', '梦占逸', '占逸旨', '梦占逸旨']); // 书名/泛词不做锚
function dreamKey(u) {
  const m = u.match(/梦[见遇得化]?([一-龥]{1,6})/);
  if (!m) return null;
  const k = '梦' + (u.includes('梦见') ? '见' : '') + m[1];
  if (k.length < 4 || ANCHOR_STOP.has(k) || ANCHOR_STOP.has(m[1])) return null;
  if (k.includes('逸旨') || k.includes('梦占') || k.includes('解梦') || k.includes('断语')) return null; // 书名/泛词子串也拒
  return k;
}

// 标题锚：优先「梦见X」，否则取断语前 10 字（绝不重复书名）
function titleAnchor(u) {
  const key = dreamKey(u);
  if (key) return key;
  const s = u.replace(/^[”"，。、（(「『]+/, '').slice(0, 10);
  return s || '断语';
}

const insFormal = db.prepare(`INSERT OR IGNORE INTO kb_formal
  (entry_id, module, title, content, src_id, category, summary, trust_score, keywords, domain, status, audit_status, promoted_at, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'),datetime('now','localtime'),datetime('now','localtime'))`);
const insFts = db.prepare(`INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)`);

const seen = new Set();
let made = 0, skipped = 0;
const perBook = {};
if (!dry) db.exec('BEGIN');
for (const src of sources) {
  const book = bookOf(src.title), page = pageOf(src.title);
  for (const u of sliceDreams(src.content)) {
    // 去重：断语正文前 40 字指纹
    const fp = u.slice(0, 40);
    if (seen.has(fp)) { skipped++; continue; }
    seen.add(fp);
    const key = dreamKey(u);
    const eid = 'KB-MENG-' + crypto.createHash('md5').update(fp).digest('hex').slice(0, 8);
    const title = `梦占·${titleAnchor(u)}（${book}${page ? '·' + page : ''}）`;
    const summary = u.slice(0, 120);
    const tags = ['梦占', '解梦', key, book].filter(Boolean).join(' ');
    if (!dry) {
      const r = insFormal.run(eid, 'mengzhan', title, u, 'SRC-MENGZHAN-SLICE', '民俗',
        summary, 0.7, tags, '易卦', 'active', 'ocr-unverified');
      if (r.changes) insFts.run(eid, 'mengzhan', summary, u, tags, '民俗');
    }
    perBook[book] = (perBook[book] || 0) + 1;
    made++;
  }
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `梦占条目化完成：新增 ${made} 条，去重跳过 ${skipped} 条`);
Object.entries(perBook).forEach(([b, n]) => console.log(`  ${b}: ${n}`));
if (!dry) {
  // 新条目补打语料标签（ancient 居多）
  const tagIns = db.prepare(`INSERT OR IGNORE INTO kb_corpus_tag (entry_id, tag, score, signals) VALUES (?, 'ancient', 0.75, '["mengzhan-slice:古籍OCR断语"]')`);
  const n = db.prepare(`SELECT entry_id FROM kb_formal WHERE module='mengzhan'`).all();
  db.exec('BEGIN');
  for (const r of n) tagIns.run(r.entry_id);
  db.exec('COMMIT');
  console.log(`语料标签补齐：mengzhan ${n.length} 条 → ancient`);
}
