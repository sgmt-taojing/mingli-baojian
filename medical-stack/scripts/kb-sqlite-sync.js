#!/usr/bin/env node
/* kb-sqlite-sync.js — JSON 权威库 → SQLite 镜像同步（R785）
 *
 * 设计：tcm-synced-kb.json 仍是唯一写入口（同步/隔离/重命名脚本全部写 JSON），
 * SQLite 是只读镜像。json mtime > sqlite 记录的源 mtime 时重建。
 * api-server 加载 KB 时优先读镜像，省掉 126MB JSON.parse。
 *
 * 用法：
 *   node scripts/kb-sqlite-sync.js           # 过期才重建
 *   node scripts/kb-sqlite-sync.js --force   # 强制重建
 *   node scripts/kb-sqlite-sync.js --verify  # 校验镜像与 JSON 行数/抽样一致
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const pinyin = require('../server/kb-store/pinyin');

const ROOT = path.join(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'server', 'kb-store', 'tcm-synced-kb.json');
const DB_PATH = path.join(ROOT, 'server', 'kb-store', 'tcm-kb.sqlite');

function jsonMtime() { return fs.statSync(JSON_PATH).mtimeMs; }

function dbMtime() {
  if (!fs.existsSync(DB_PATH)) return 0;
  try {
    const db = new DatabaseSync(DB_PATH, { readOnly: true });
    const row = db.prepare("SELECT v FROM meta WHERE k='json_mtime'").get();
    db.close();
    return row ? Number(row.v) : 0;
  } catch { return 0; }
}

function rebuild() {
  const t0 = Date.now();
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  const tmp = DB_PATH + '.tmp';
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  const db = new DatabaseSync(tmp);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT);
    CREATE TABLE entries (
      module TEXT NOT NULL,
      eid TEXT,
      title TEXT,
      title_initials TEXT,
      title_pinyin TEXT,
      content_head TEXT,
      keywords TEXT,
      confidence REAL,
      payload TEXT NOT NULL
    );
    CREATE INDEX idx_entries_module ON entries(module);
    CREATE INDEX idx_entries_initials ON entries(title_initials);
  `);
  const ins = db.prepare('INSERT INTO entries (module, eid, title, title_initials, title_pinyin, content_head, keywords, confidence, payload) VALUES (?,?,?,?,?,?,?,?,?)');
  let n = 0;
  db.exec('BEGIN');
  for (const [mod, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      if (!it || typeof it !== 'object') continue;
      const kw = Array.isArray(it.keywords) ? it.keywords.join(' ') : String(it.keywords || '');
      const title = String(it.title || '').slice(0, 200);
      // R825 修真：1.5 万条早期蒸馏条目无 id 字段，按内容哈希合成稳定 eid
      // （症状索引等 eid 键控功能依赖全量覆盖；规则与 python 构建器一致）
      const eid = String(it.id || it.entry_id ||
        crypto.createHash('sha1').update(mod + '|' + title + '|' + String(it.content || '')).digest('hex').slice(0, 12));
      // R790：预算首字母变体（多音字展开，空格分隔）与主全拼，检索期零计算
      const initials = pinyin.variants(title, 8).join(' ').slice(0, 300);
      const full = pinyin.full(title).slice(0, 200);
      ins.run(mod, eid, title, initials, full,
        String(it.content || '').slice(0, 3000),
        kw, Number(it.confidence || it.trust_score || 0.5), JSON.stringify(it));
      n++;
    }
  }
  db.exec('COMMIT');
  db.prepare('INSERT INTO meta (k, v) VALUES (?, ?)').run('json_mtime', String(jsonMtime()));
  db.prepare('INSERT INTO meta (k, v) VALUES (?, ?)').run('entries', String(n));
  db.prepare('INSERT INTO meta (k, v) VALUES (?, ?)').run('built_at', new Date().toISOString());
  db.exec('ANALYZE');
  db.close();
  fs.renameSync(tmp, DB_PATH);
  const mb = (fs.statSync(DB_PATH).size / 1048576).toFixed(1);
  console.log(`✓ SQLite 镜像重建：${n} 条，${mb}MB，耗时 ${Date.now() - t0}ms → ${DB_PATH}`);
}

function verify() {
  const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  let jsonTotal = 0;
  const perMod = {};
  for (const [mod, items] of Object.entries(data)) {
    if (!Array.isArray(items)) continue;
    perMod[mod] = items.length;
    jsonTotal += items.length;
  }
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  const dbTotal = db.prepare('SELECT COUNT(*) c FROM entries').get().c;
  let mismatch = [];
  for (const [mod, cnt] of Object.entries(perMod)) {
    const c = db.prepare('SELECT COUNT(*) c FROM entries WHERE module=?').get(mod).c;
    if (c !== cnt) mismatch.push(`${mod}: json=${cnt} sqlite=${c}`);
  }
  // 抽样 payload 往返一致性
  const sample = db.prepare('SELECT module, payload FROM entries ORDER BY RANDOM() LIMIT 20').all();
  let sampleBad = 0;
  for (const s of sample) {
    const obj = JSON.parse(s.payload);
    const arr = data[s.module] || [];
    if (!arr.some(it => JSON.stringify(it) === JSON.stringify(obj))) sampleBad++;
  }
  db.close();
  const ok = dbTotal === jsonTotal && mismatch.length === 0 && sampleBad === 0;
  console.log(`校验：JSON ${jsonTotal} 条 vs SQLite ${dbTotal} 条；分区不一致 ${mismatch.length}；抽样 20 条不一致 ${sampleBad}`);
  if (mismatch.length) console.log('  ' + mismatch.slice(0, 5).join('\n  '));
  console.log(ok ? '✓ 镜像与权威库一致' : '✗ 镜像不一致，需要重建');
  process.exitCode = ok ? 0 : 1;
}

const arg = process.argv[2];
if (arg === '--verify') verify();
else if (arg === '--force' || jsonMtime() > dbMtime()) rebuild();
else console.log('镜像已是最新，跳过');
