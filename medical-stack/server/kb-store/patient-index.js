/* patient-index.js — 患者主索引 EMPI（R789）
 *
 * 解决「患者是谁」这个地基问题：
 *   处方/随访/病历此前 patient_id 一律 'anonymous'，跨次就诊无法归集。
 *   本模块维护一份独立的可写 SQLite（data/patients.sqlite），以姓名指纹
 *   （sha256(规范化姓名) + 出生年）去重，签发/建档/随访时统一解析出
 *   稳定 patient_id，实现同一患者多次就诊的连续归集。
 *
 * 隐私纪律：不落明文姓名，只存脱敏姓名（张*明）+ 指纹 + 证件哈希。
 * 任何异常一律返回 null，调用方回退老行为（anonymous / seed 数据），绝不影响服务。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const pinyin = (() => { try { return require('./pinyin'); } catch { return { variants: () => [''], isLatin: () => false }; } })();

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'patients.sqlite');

let _db = null;
function db() {
  if (_db) return _db;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    _db = new DatabaseSync(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        patient_id   TEXT PRIMARY KEY,
        name_fp      TEXT NOT NULL,
        name_masked  TEXT,
        gender       TEXT,
        birth_year   INTEGER,
        phone_masked TEXT,
        id_hash      TEXT,
        created_at   TEXT,
        last_visit   TEXT,
        visit_count  INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_patients_fp ON patients(name_fp, birth_year);
    `);
    // R789 修订：库内档存全名（与 seed-emr.json 同安全域，本地库），脱敏只在 API 输出层；
    // 否则「张*明」无法支撑医生按姓名子串检索。老库自动补列。
    try { _db.exec('ALTER TABLE patients ADD COLUMN name_full TEXT'); } catch (e) { /* 列已存在 */ }
    // R790：首字母变体列（多音字展开，空格分隔），支持「zcm」式检索
    try { _db.exec('ALTER TABLE patients ADD COLUMN name_initials TEXT'); } catch (e) { /* 列已存在 */ }
    try { _db.exec('CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name_full)'); } catch (e) {}
    return _db;
  } catch (e) {
    console.error('[patient-index] 打开失败:', e.message);
    _db = null;
    return null;
  }
}

function normName(name) {
  return String(name || '').replace(/\s+/g, '').trim();
}

function maskName(name) {
  const n = normName(name);
  if (!n) return '';
  if (n.length === 1) return n;
  if (n.length === 2) return n[0] + '*';
  return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1];
}

function maskPhone(phone) {
  const p = String(phone || '').replace(/\D/g, '');
  if (p.length < 7) return '';
  return p.slice(0, 3) + '****' + p.slice(-4);
}

function fp(name) {
  return crypto.createHash('sha256').update(normName(name)).digest('hex').slice(0, 24);
}

/* upsert：按 姓名指纹+出生年 去重；无出生年则按指纹去重。
 * 命中已有患者 → 更新可变字段并返回；未命中 → 新建 empi- 主索引号。 */
function upsertPatient(info) {
  const d = db();
  if (!d) return null;
  try {
    const name = normName(info && info.name);
    if (!name) return null;
    const nameFp = fp(name);
    const by = parseInt(info.birthYear || info.birth_year, 10) || null;
    const now = new Date().toISOString();

    let row;
    if (by) {
      // 带出生年：优先 指纹+出生年 精确命中；落空则回填「指纹同、尚未录出生年」的旧档
      row = d.prepare('SELECT * FROM patients WHERE name_fp=? AND birth_year=?').get(nameFp, by)
         || d.prepare('SELECT * FROM patients WHERE name_fp=? AND (birth_year IS NULL OR birth_year=0)').get(nameFp);
    } else {
      // 不带出生年：纯指纹命中（任何出生年），同名不同人靠出生年后续分流
      row = d.prepare('SELECT * FROM patients WHERE name_fp=? ORDER BY last_visit DESC').get(nameFp);
    }
    if (row) {
      d.prepare(`UPDATE patients SET
          gender = COALESCE(?, gender),
          birth_year = COALESCE(?, birth_year),
          name_full = COALESCE(name_full, ?),
          phone_masked = COALESCE(NULLIF(?, ''), phone_masked),
          id_hash = COALESCE(NULLIF(?, ''), id_hash),
          last_visit = ?, visit_count = visit_count + 1
        WHERE patient_id=?`).run(
        info.gender || null, by, name,
        maskPhone(info.phone), info.idCard ? crypto.createHash('sha256').update(String(info.idCard)).digest('hex').slice(0, 24) : '',
        now, row.patient_id);
      return { ...row, birth_year: by || row.birth_year, gender: info.gender || row.gender, last_visit: now, visit_count: row.visit_count + 1, existed: true };
    }

    const pid = 'empi-' + crypto.randomBytes(6).toString('hex');
    const rec = {
      patient_id: pid, name_fp: nameFp, name_masked: maskName(name), name_full: name,
      name_initials: pinyin.variants(name, 8).join(' ').slice(0, 120),
      gender: info.gender || null, birth_year: by,
      phone_masked: maskPhone(info.phone),
      id_hash: info.idCard ? crypto.createHash('sha256').update(String(info.idCard)).digest('hex').slice(0, 24) : null,
      created_at: now, last_visit: now, visit_count: 1
    };
    d.prepare(`INSERT INTO patients (patient_id, name_fp, name_masked, name_full, name_initials, gender, birth_year, phone_masked, id_hash, created_at, last_visit, visit_count)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(rec.patient_id, rec.name_fp, rec.name_masked, rec.name_full, rec.name_initials, rec.gender, rec.birth_year,
           rec.phone_masked, rec.id_hash, rec.created_at, rec.last_visit, rec.visit_count);
    return rec;
  } catch (e) {
    console.error('[patient-index] upsert 失败:', e.message);
    return null;
  }
}

/* resolve：处方/随访等只拿到 patient_name 的场景，统一解析出稳定 patient_id。
 * 已传合法 empi- id → 直接采信；否则按姓名 upsert。失败回退原值。 */
function resolvePatientId(patientId, patientName, extra) {
  const pid = String(patientId || '').trim();
  if (pid && pid !== 'anonymous') return pid;
  const rec = upsertPatient({ name: patientName, ...(extra || {}) });
  return rec ? rec.patient_id : (pid || 'anonymous');
}

function getPatient(patientId) {
  const d = db();
  if (!d) return null;
  try { return d.prepare('SELECT * FROM patients WHERE patient_id=?').get(String(patientId)) || null; }
  catch { return null; }
}

/* 列表/检索：q 支持三种形态——
 *   中文子串 → 匹配库内全名；纯拉丁 → 首字母变体逐一同比（前缀即中）；
 *   其余 → patient_id 前缀。脱敏只在输出层做。 */
function listPatients(q, limit) {
  const d = db();
  if (!d) return [];
  try {
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    if (q) {
      const t = String(q).trim();
      const like = '%' + t + '%';
      if (pinyin.isLatin(t)) {
        // 拉丁查询：name_initials 是空格分隔变体串，LIKE 边界对齐（前补空格保词首）
        const rows = d.prepare(`SELECT * FROM patients WHERE patient_id LIKE ? OR
                                (' ' || COALESCE(name_initials,'') || ' ') LIKE ?
                                ORDER BY last_visit DESC LIMIT ?`)
          .all(like, '% ' + t.toLowerCase() + '%', lim);
        return rows;
      }
      return d.prepare(`SELECT * FROM patients WHERE name_full LIKE ? OR patient_id LIKE ?
                        ORDER BY last_visit DESC LIMIT ?`).all(like, like, lim);
    }
    return d.prepare('SELECT * FROM patients ORDER BY last_visit DESC LIMIT ?').all(lim);
  } catch { return []; }
}

function count() {
  const d = db();
  if (!d) return 0;
  try { return d.prepare('SELECT COUNT(*) c FROM patients').get().c; } catch { return 0; }
}

module.exports = { upsertPatient, resolvePatientId, getPatient, listPatients, count, maskName, fp, DB_PATH };
