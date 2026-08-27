/* kb-sqlite.js — KB SQLite 镜像读取适配层（R785）
 *
 * tcm-synced-kb.json 是唯一写入口；本模块提供三条只读路径：
 *   tryLoadIndex(jsonMtime)  快路径：只读列字段，不解析 payload，供检索索引构建
 *   loadFull()               全量还原 {module:[item]}（兼容 /api/tcm/kb/full 等稀有场景）
 *   tryLoad(jsonMtime)       新鲜则 loadFull，否则 null
 * 镜像过期或任何异常一律返回 null，调用方回退 JSON 老路径，绝不影响服务。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'tcm-kb.sqlite');

function openFresh(jsonMtimeMs) {
  if (!fs.existsSync(DB_PATH)) return null;
  try {
    const db = new DatabaseSync(DB_PATH, { readOnly: true });
    const m = db.prepare("SELECT v FROM meta WHERE k='json_mtime'").get();
    if (!m || Number(m.v) < jsonMtimeMs) { db.close(); return null; }
    return db;
  } catch { return null; }
}

function tryLoadIndex(jsonMtimeMs) {
  const db = openFresh(jsonMtimeMs);
  if (!db) return null;
  try {
    const counts = {};
    for (const r of db.prepare('SELECT module, COUNT(*) c FROM entries GROUP BY module').all()) {
      counts[r.module] = r.c;
    }
    const rows = db.prepare(
      'SELECT eid, module, title, title_initials AS initials, title_pinyin AS pinyin, content_head AS content, keywords, confidence FROM entries'
    ).all();
    db.close();
    return { modules: Object.keys(counts), counts, rows };
  } catch {
    try { db.close(); } catch {}
    return null;
  }
}

function loadFull() {
  let db;
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
    const data = {};
    for (const row of db.prepare('SELECT module, payload FROM entries').all()) {
      (data[row.module] || (data[row.module] = [])).push(JSON.parse(row.payload));
    }
    db.close();
    return data;
  } catch {
    try { if (db) db.close(); } catch {}
    return null;
  }
}

function tryLoad(jsonMtimeMs) {
  const db = openFresh(jsonMtimeMs);
  if (!db) return null;
  try { db.close(); } catch {}
  return loadFull();
}

function loadModules(names) {
  let db;
  try {
    db = new DatabaseSync(DB_PATH, { readOnly: true });
    const stmt = db.prepare('SELECT payload FROM entries WHERE module=?');
    const out = {};
    for (const name of names) {
      out[name] = stmt.all(name).map(r => JSON.parse(r.payload));
    }
    db.close();
    return out;
  } catch {
    try { if (db) db.close(); } catch {}
    return null;
  }
}

module.exports = { tryLoadIndex, loadFull, tryLoad, loadModules, DB_PATH };
