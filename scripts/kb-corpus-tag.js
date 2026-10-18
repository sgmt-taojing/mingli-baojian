#!/usr/bin/env node
/**
 * kb-corpus-tag.js — KB 语料卫生清洗：三类标签（ancient 古籍原文 / modern 现代讲义 / junk 垃圾）
 * 2026-10-18 立项：OOD 查询真实命中现代 junk（量子计算机/微波炉/ISBN 版权页），检索层已兜底，本脚本治本。
 *
 * 用法：
 *   node scripts/kb-corpus-tag.js scan           # 全量打标 → kb_corpus_tag 表（幂等重跑）
 *   node scripts/kb-corpus-tag.js sample [N]     # 分层抽样 N 条（默认500）→ kb_tag_review 人工校验队列
 *   node scripts/kb-corpus-tag.js stats          # 打标分布统计
 *
 * 规则（纯内容判定，module 仅作先验微调）：
 *   junk   硬信号：URL/ISBN/版权页/参考文献/论文摘要；或与古籍毫不相干的现代话题词≥2（量子/相对论/微波炉/计算机…）；或拉丁字符占比>12%
 *   ancient 古文密度高（之乎者也矣焉哉曰夫盖凡 等 ≥2.2/百字）且无现代语法标记
 *   modern 其余：白话讲义/现代解读（默认类）
 * 人工校验：sample 子命令分层抽样入 kb_tag_review；admin-corpus-review.html 逐条裁决 → 准确率回写 kb_corpus_tag.review_status
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const DB_PATH = process.env.YIDAO_DB_PATH || path.join(__dirname, '..', 'server', 'database', 'yidao.db');

const db = new DatabaseSync(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS kb_corpus_tag (
  entry_id TEXT PRIMARY KEY,
  tag TEXT NOT NULL CHECK(tag IN ('ancient','modern','junk')),
  score REAL NOT NULL DEFAULT 0,
  signals TEXT,
  tagged_at TEXT DEFAULT (datetime('now','localtime')),
  review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending','confirmed','rejected','corrected')),
  review_tag TEXT,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_corpus_tag ON kb_corpus_tag(tag);
CREATE TABLE IF NOT EXISTS kb_tag_review (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  rule_tag TEXT NOT NULL,
  verdict TEXT,
  reviewed_at TEXT,
  UNIQUE(batch, entry_id)
);
`);

// —— 规则词表 ——
const HARD_JUNK = /(https?:\/\/|www\.|ISBN|issn|版权所有|出版社.{0,6}(出版|发行)|定价[:：]|参考文献|作者简介|目录\s*第?[一二三四五六七八九十\d]+[章部]|Abstract|keywords?:|DOI[:：])/i;
const MODERN_TOPIC = /(量子|相对论|微波炉|计算机|互联网|智能手机|爱因斯坦|牛顿|基因工程|克隆|纳米|火箭|卫星|电动机|蒸汽机|资本主义|社会主义|市场经济|股票|基金|房地产|世界杯|奥运会|好莱坞|钢琴|小提琴|吉他|咖啡|可乐|维生素[ABC]|[12]\d{3}\s*年[代]?|二十世纪|20世纪|19世纪|二十一世纪)/;
const CLASSICAL_PARTICLE = /[之乎者也矣焉哉歟耶耳兮]/g;
const CLASSICAL_FUNC = /(子曰|夫|盖|凡|故曰|是以|然则|若夫|且夫|所谓|谓之|何也|者也|之属|其|乃|遂|咸|皆|靡)/g;
const MODERN_GRAMMAR = /(我们|你们|他们|的[一逐]步|也就是说|换句话说|简单来说|其实|因为.{0,12}所以|如果.{0,12}就|虽然.{0,12}但是|通过.{0,12}可以|非常|十分|特别|比较|已经|正在|将会|包括|例如|比如|根据.{0,8}(研究|调查|数据|统计)|问题|情况|方面|时候|地方|东西)/;

// 古籍先验 module（内容规则可覆盖）
const CLASSIC_MODS = new Set(['shanghan-lun','huangdi-neijing','bencao-gangmu','shennong-bencao','jinkui-yaolue','yizong-jinjian','jingyue','qianjin','yijing','classics','authoritative','mingyi-leian','tcm-classical','zangfu-bencao','classics-qa']);

function classify(entryId, module, summary, content) {
  const text = ((summary || '') + '\n' + (content || '')).slice(0, 3000);
  const len = text.replace(/\s/g, '').length || 1;
  const signals = [];

  // 硬垃圾
  const hardM = text.match(HARD_JUNK);
  if (hardM) { signals.push('hard:' + hardM[0].slice(0, 12)); return { tag: 'junk', score: 0.95, signals }; }

  // 拉丁占比
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const latinRatio = latin / len;
  if (latinRatio > 0.12) { signals.push('latin:' + latinRatio.toFixed(2)); return { tag: 'junk', score: 0.9, signals }; }

  // 现代话题词计数
  const topicHits = (text.match(new RegExp(MODERN_TOPIC.source, 'g')) || []).length;
  if (topicHits >= 3) { signals.push('topic×' + topicHits); return { tag: 'junk', score: 0.85, signals }; }

  // 古文密度
  const particles = (text.match(CLASSICAL_PARTICLE) || []).length;
  const funcs = (text.match(CLASSICAL_FUNC) || []).length;
  const ancientPer100 = (particles + funcs * 0.5) / len * 100;

  const modernHits = (text.match(new RegExp(MODERN_GRAMMAR.source, 'g')) || []).length;

  let tag, score;
  if (ancientPer100 >= 2.2 && modernHits <= 2) {
    tag = 'ancient'; score = Math.min(0.95, 0.6 + ancientPer100 / 20);
    signals.push('ancient/100:' + ancientPer100.toFixed(1));
  } else if (ancientPer100 >= 1.2 && topicHits === 0 && modernHits <= 4 && CLASSIC_MODS.has(module)) {
    tag = 'ancient'; score = 0.65;
    signals.push('ancient-prior:' + ancientPer100.toFixed(1) + '@' + module);
  } else {
    tag = 'modern'; score = 0.7;
    signals.push('modern:a' + ancientPer100.toFixed(1) + '/t' + topicHits + '/m' + modernHits);
  }
  return { tag, score, signals };
}

const cmd = process.argv[2] || 'scan';

if (cmd === 'scan') {
  const ins = db.prepare(`INSERT INTO kb_corpus_tag (entry_id, tag, score, signals) VALUES (?,?,?,?)
    ON CONFLICT(entry_id) DO UPDATE SET tag=excluded.tag, score=excluded.score, signals=excluded.signals,
    tagged_at=datetime('now','localtime')
    WHERE kb_corpus_tag.review_status='pending'`); // 人工裁决过的条目不被规则覆盖
  const rows = db.prepare(`SELECT entry_id, module, summary, content FROM kb_fts5`).all();
  let n = 0; const dist = { ancient: 0, modern: 0, junk: 0 };
  const t0 = Date.now();
  db.exec('BEGIN');
  for (const r of rows) {
    const c = classify(r.entry_id, r.module, r.summary, r.content);
    ins.run(r.entry_id, c.tag, c.score, JSON.stringify(c.signals));
    dist[c.tag]++; n++;
  }
  db.exec('COMMIT');
  console.log(`打标完成 ${n} 条，耗时 ${((Date.now()-t0)/1000).toFixed(1)}s`);
  console.log(`  ancient 古籍原文: ${dist.ancient} (${(dist.ancient/n*100).toFixed(1)}%)`);
  console.log(`  modern  现代讲义: ${dist.modern} (${(dist.modern/n*100).toFixed(1)}%)`);
  console.log(`  junk    垃圾:     ${dist.junk} (${(dist.junk/n*100).toFixed(1)}%)`);
} else if (cmd === 'sample') {
  const N = parseInt(process.argv[3]) || 500;
  const batch = 'B' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // 分层：三标签 × module 占比配额，优先打低分（score<0.75）的可疑条目 40%，随机 60%
  const tiers = [
    { sql: `SELECT entry_id, tag FROM kb_corpus_tag WHERE score < 0.75 ORDER BY RANDOM() LIMIT ?`, n: Math.round(N * 0.4) },
    { sql: `SELECT entry_id, tag FROM kb_corpus_tag ORDER BY RANDOM() LIMIT ?`, n: N - Math.round(N * 0.4) },
  ];
  const ins = db.prepare(`INSERT OR IGNORE INTO kb_tag_review (batch, entry_id, rule_tag) VALUES (?,?,?)`);
  let total = 0;
  db.exec('BEGIN');
  for (const t of tiers) {
    for (const r of db.prepare(t.sql).all(t.n)) { ins.run(batch, r.entry_id, r.tag); total++; }
  }
  db.exec('COMMIT');
  const dist = db.prepare(`SELECT rule_tag, COUNT(*) c FROM kb_tag_review WHERE batch=? GROUP BY rule_tag`).all(batch);
  console.log(`人工校验队列 ${batch} 已建：${total} 条`);
  dist.forEach(d => console.log(`  ${d.rule_tag}: ${d.c}`));
  console.log(`打开 http://127.0.0.1:8900/admin-corpus-review.html?batch=${batch} 逐条裁决`);
} else if (cmd === 'stats') {
  console.log('--- 打标分布 ---');
  db.prepare(`SELECT tag, COUNT(*) c, ROUND(AVG(score),2) avg FROM kb_corpus_tag GROUP BY tag`).all()
    .forEach(r => console.log(`  ${r.tag}: ${r.c} (avg ${r.avg})`));
  console.log('--- junk top modules ---');
  db.prepare(`SELECT f.module, COUNT(*) c FROM kb_corpus_tag t JOIN kb_fts5 f ON f.entry_id=t.entry_id WHERE t.tag='junk' GROUP BY f.module ORDER BY c DESC LIMIT 10`).all()
    .forEach(r => console.log(`  ${String(r.c).padStart(6)} ${r.module}`));
  console.log('--- 人工校验进度 ---');
  try {
    const p = db.prepare(`SELECT COUNT(*) total, COUNT(verdict) done, SUM(CASE WHEN verdict=rule_tag THEN 1 ELSE 0 END) agree FROM kb_tag_review`).get();
    console.log(`  ${p.done}/${p.total} 已裁决，规则一致率 ${p.done ? (p.agree/p.done*100).toFixed(1)+'%' : '—'}`);
  } catch(e) { console.log('  (无队列)'); }
}
