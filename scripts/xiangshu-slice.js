#!/usr/bin/env node
/**
 * xiangshu-slice.js — 面相典籍条目化（2026-10-19，第二十六轮）
 * 源：corpus/xiangshu-tjc/卷631-650.txt = 《钦定古今图书集成·博物汇编·艺术典·相术部》
 *   彙考一~十六（631-646）＋總論/名流列傳（647）＋藝文/紀事（648-649）＋雜錄（650）
 *   内含《神相全编》全帙、《相儿经》《人相篇》等——面相门类权威汇卷。
 * 病灶：《麻衣神相》《水镜相法》全书缺册（挂账待源），但相术部汇卷已在 corpus 未活化，
 *   「看面相知富贵」类白话查询召回薄弱。
 * 切法：彙考卷按 §§ 节标题 §§ 切条（节>420字按句读再分，≤400字/条）；
 *   647-650 无节标记，按句读聚合成 60~300 字单元。
 * 清洗：去导航行（← → 姊妹计划 &#8203;）、去「编辑]」、去每卷目录块、去书眉。
 * 铁律：只切分项目内已有文本，一字不改；入库 module='xiangshu'，domain='相术'，
 *   trust 0.8，audit_status='tjc-sliced'（可追溯），src_id='SRC-TJC-XIANGSHU'。
 * 用法：node scripts/xiangshu-slice.js [--dry]
 */
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'corpus', 'xiangshu-tjc');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(ROOT, 'server', 'database', 'yidao.db');
const dry = process.argv.includes('--dry');
const db = new DatabaseSync(DB_PATH);

const CN = '一二三四五六七八九十';
function partOf(text) {
  const m = text.match(/相術部(彙考[一二三四五六七八九十]+|總論|名流列傳|藝文[一二]?|紀事[一二]?|雜錄)/);
  return m ? m[1] : '';
}

// 行级清洗 + 目录块剔除 + 子书名跟踪
function cleanLines(raw) {
  const lines = raw.split('\n');
  const out = [];
  let inToc = false;
  let subBook = '';
  for (let line of lines) {
    line = line.replace(/&#8203;/g, '').trim();
    if (!line) continue;
    if (/←|→|姊妹计划/.test(line)) continue;                    // 网页导航
    if (/目錄$/.test(line)) { inToc = true; continue; }        // 目录块开始
    if (inToc) { if (/^藝術典第六百/.test(line)) inToc = false; continue; }
    if (/欽定古今圖書集成/.test(line)) continue;               // 书眉
    if (/^藝術典第六百\d+卷$/.test(line)) continue;
    const sb = line.match(/^(\S{2,20})编辑\]$/);               // 子书名行：相兒經编辑]
    if (sb && !sb[1].startsWith('相術部')) { subBook = sb[1]; continue; }
    line = line.replace(/编辑\]$/, '').trim();                 // 节内「编辑]」噪声
    if (!line) continue;
    out.push({ line, subBook });
  }
  return out;
}

// 彙考卷：按 §§ 节 §§ 切；无 §§ 卷：句读聚合
function sliceVol(items) {
  const units = [];
  let curTitle = '', curBook = '', cur = '';
  const flush = () => {
    if (cur.replace(/\s+/g, '').length >= 20) units.push({ title: curTitle, book: curBook, text: cur });
    cur = '';
  };
  for (const { line, subBook } of items) {
    const sec = line.match(/^§§\s*(.+?)\s*§§$/);
    if (sec) { flush(); curTitle = sec[1]; curBook = subBook || curBook; continue; }
    if (subBook && subBook !== curBook && !curTitle) curBook = subBook;
    if (!curTitle) { // 无节卷：句读聚合
      cur += line;
      if (cur.length >= 260) { curTitle = curBook || '雜錄'; flush(); curTitle = ''; }
      continue;
    }
    cur += (cur ? '' : '') + line;
    if (cur.length > 420) {
      // 超长节：按句读分块 ≤400 字
      const sents = cur.split(/(?<=。|！|？|；)/);
      let buf = '', idx = 1;
      for (const s of sents) {
        if (buf.length + s.length > 400 && buf.length >= 60) {
          units.push({ title: curTitle + '·' + idx++, book: curBook, text: buf }); buf = '';
        }
        buf += s;
      }
      cur = buf; // 尾段留到下次 flush 或节末
      if (cur.length >= 60) { units.push({ title: curTitle + '·' + idx, book: curBook, text: cur }); cur = ''; }
    }
  }
  flush();
  return units;
}

const insFormal = db.prepare(`INSERT OR IGNORE INTO kb_formal
  (entry_id, module, title, content, src_id, category, summary, trust_score, keywords, domain, status, audit_status, promoted_at, created_at, updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'),datetime('now','localtime'),datetime('now','localtime'))`);
const insFts = db.prepare(`INSERT INTO kb_fts5 (entry_id, module, summary, content, tags, category) VALUES (?,?,?,?,?,?)`);

const seen = new Set();
let made = 0, skipped = 0;
const perVol = {};
if (!dry) db.exec('BEGIN');
for (let v = 631; v <= 650; v++) {
  const fp = path.join(SRC_DIR, `卷${v}.txt`);
  if (!fs.existsSync(fp)) { console.log(`缺源：卷${v}.txt`); continue; }
  const raw = fs.readFileSync(fp, 'utf8');
  const part = partOf(raw) || `卷${v}`;
  const items = cleanLines(raw);
  for (const u of sliceVol(items)) {
    const text = u.text.replace(/\s+/g, '');
    if (text.length < 20) continue;
    const fp40 = text.slice(0, 40);
    if (seen.has(fp40)) { skipped++; continue; }
    seen.add(fp40);
    const eid = 'KB-XIANG-' + crypto.createHash('md5').update(fp40).digest('hex').slice(0, 8);
    const sec = (u.title || '佚名').replace(/〈[^〉]*〉/g, '').slice(0, 24);
    const title = `图书集成相术部·${u.book || part}·${sec}（卷${v}）`.slice(0, 80);
    const summary = text.slice(0, 120);
    const tags = ['面相', '相术', '图书集成', u.book, sec.replace(/·\d+$/, '')].filter(Boolean).join(' ');
    if (!dry) {
      const r = insFormal.run(eid, 'xiangshu', title, text, 'SRC-TJC-XIANGSHU', 'tjc-xiangshu',
        summary, 0.8, tags, '相术', 'active', 'tjc-sliced');
      if (r.changes) insFts.run(eid, 'xiangshu', summary, text, tags, 'tjc-xiangshu');
    }
    perVol[`卷${v}·${part}`] = (perVol[`卷${v}·${part}`] || 0) + 1;
    made++;
  }
}
if (!dry) db.exec('COMMIT');
console.log((dry ? '[DRY] ' : '') + `相术部条目化完成：新增 ${made} 条，去重跳过 ${skipped} 条`);
Object.entries(perVol).forEach(([b, n]) => console.log(`  ${b}: ${n}`));
if (!dry) {
  const tagIns = db.prepare(`INSERT OR IGNORE INTO kb_corpus_tag (entry_id, tag, score, signals) VALUES (?, 'ancient', 0.8, '["xiangshu-slice:图书集成相术部"]')`);
  const n = db.prepare(`SELECT entry_id FROM kb_formal WHERE src_id='SRC-TJC-XIANGSHU'`).all();
  db.exec('BEGIN');
  for (const r of n) tagIns.run(r.entry_id);
  db.exec('COMMIT');
  console.log(`语料标签补齐：tjc-xiangshu ${n.length} 条 → ancient`);
  const c = db.prepare(`SELECT COUNT(*) n FROM kb_formal WHERE module='xiangshu'`).get();
  console.log(`xiangshu 模块现共 ${c.n} 条`);
}
