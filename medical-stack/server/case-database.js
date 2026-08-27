/**
 * 命理宝鉴·医道 病例数据库 V1.0
 * SQLite 本地存储，脱敏优先
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'tcm-cases.db');

let db;

function init() {
  const fs = require('fs');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      chief_complaint TEXT,
      extracted_terms TEXT,
      urgency_level TEXT,
      tongue_json TEXT,
      face_json TEXT,
      hand_json TEXT,
      inquiry_json TEXT,
      multischool_json TEXT,
      formula_name TEXT,
      formula_source TEXT,
      formula_confidence REAL,
      warnings_json TEXT,
      feedback TEXT,
      data_hash TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_cases_patient ON cases(patient_id);
    CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at);
    CREATE INDEX IF NOT EXISTS idx_cases_urgency ON cases(urgency_level);
    CREATE INDEX IF NOT EXISTS idx_cases_terms ON cases(extracted_terms);
    CREATE INDEX IF NOT EXISTS idx_cases_hash ON cases(data_hash);

    CREATE TABLE IF NOT EXISTS case_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT NOT NULL REFERENCES cases(id),
      source_case_id TEXT,
      similarity_score REAL,
      matched_terms TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      total_visits INTEGER DEFAULT 0,
      urgency_p0 INTEGER DEFAULT 0,
      urgency_p1 INTEGER DEFAULT 0,
      urgency_p2 INTEGER DEFAULT 0,
      urgency_p3 INTEGER DEFAULT 0,
      top_terms TEXT,
      top_formulas TEXT
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS cases_fts USING fts5(
      chief_complaint, extracted_terms, content='cases', content_rowid='rowid'
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS cases_ai AFTER INSERT ON cases BEGIN
      INSERT INTO cases_fts(rowid, chief_complaint, extracted_terms)
      VALUES (new.rowid, new.chief_complaint, new.extracted_terms);
    END;

    CREATE TRIGGER IF NOT EXISTS cases_ad AFTER DELETE ON cases BEGIN
      INSERT INTO cases_fts(cases_fts, rowid, chief_complaint, extracted_terms)
      VALUES ('delete', old.rowid, old.chief_complaint, old.extracted_terms);
    END;

    CREATE TRIGGER IF NOT EXISTS cases_au AFTER UPDATE ON cases BEGIN
      INSERT INTO cases_fts(cases_fts, rowid, chief_complaint, extracted_terms)
      VALUES ('delete', old.rowid, old.chief_complaint, old.extracted_terms);
      INSERT INTO cases_fts(rowid, chief_complaint, extracted_terms)
      VALUES (new.rowid, new.chief_complaint, new.extracted_terms);
    END;
  `);

  return db;
}

/**
 * 保存病例（脱敏：不保存原始图片，仅保存 JSON 特征 + 哈希）
 */
function saveCase(diagnosisReport, patientId = 'anonymous') {
  if (!db) init();
  
  const id = crypto.randomUUID();
  const dataHash = crypto.createHash('sha256')
    .update(JSON.stringify(diagnosisReport))
    .digest('hex')
    .slice(0, 16);

  const complaint = diagnosisReport.five_methods?.inquiry?.chief_complaint || '';
  const terms = (diagnosisReport.five_methods?.inquiry?.extracted_tcm_terms || []).join(',');

  const stmt = db.prepare(`
    INSERT INTO cases (id, patient_id, chief_complaint, extracted_terms, urgency_level,
      tongue_json, face_json, hand_json, inquiry_json, multischool_json,
      formula_name, formula_source, formula_confidence, warnings_json, data_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id, patientId, complaint, terms,
    diagnosisReport.urgency_level || 'P2',
    JSON.stringify(diagnosisReport.five_methods?.tongue || null),
    JSON.stringify(diagnosisReport.five_methods?.face || null),
    JSON.stringify(diagnosisReport.five_methods?.hand || null),
    JSON.stringify(diagnosisReport.five_methods?.inquiry || null),
    JSON.stringify(diagnosisReport.kb_multischool_opinions || {}),
    diagnosisReport.suggested_formula?.formula || null,
    diagnosisReport.suggested_formula?.source || null,
    diagnosisReport.suggested_formula?.confidence || 0,
    JSON.stringify(diagnosisReport.warnings || []),
    dataHash
  );

  // 更新每日统计
  updateDailyStats(diagnosisReport.urgency_level, terms);

  return { case_id: id, hash: dataHash };
}

/**
 * 佐证数据提取：根据当前症状找相似历史病例
 */
function findSimilarCases(terms, limit = 5) {
  if (!db) init();
  
  const termList = Array.isArray(terms) ? terms : terms.split(',').filter(Boolean);
  if (!termList.length) return [];

  // FTS5 搜索
  const ftsQuery = termList.map(t => `"${t}"`).join(' OR ');
  const results = db.prepare(`
    SELECT c.id, c.patient_id, c.chief_complaint, c.extracted_terms, 
           c.urgency_level, c.formula_name, c.formula_source,
           c.created_at, c.data_hash,
           fts.rank as relevance
    FROM cases_fts fts
    JOIN cases c ON c.rowid = fts.rowid
    WHERE cases_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(ftsQuery, limit);

  return results.map(r => ({
    case_id: r.id,
    hash: r.data_hash,
    chief_complaint: r.chief_complaint,
    terms: r.extracted_terms,
    urgency: r.urgency_level,
    formula: r.formula_name,
    formula_source: r.formula_source,
    created_at: r.created_at,
    relevance: r.relevance
  }));
}

/**
 * 趋势分析：统计某时间段内症状/方剂频次
 */
function getTrends(days = 30) {
  if (!db) init();

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN urgency_level='P0_EMERGENCY' THEN 1 ELSE 0 END) as p0,
      SUM(CASE WHEN urgency_level='P1_SUGGEST_VISIT' THEN 1 ELSE 0 END) as p1,
      SUM(CASE WHEN urgency_level='P2_HEALTH_TIP' THEN 1 ELSE 0 END) as p2,
      SUM(CASE WHEN urgency_level='P3_NORMAL' THEN 1 ELSE 0 END) as p3
    FROM cases
    WHERE created_at >= datetime('now', '-${days} days')
  `).get();

  // Top 症状
  const topTerms = db.prepare(`
    SELECT extracted_terms, COUNT(*) as cnt
    FROM cases
    WHERE created_at >= datetime('now', '-${days} days')
    AND extracted_terms != ''
    GROUP BY extracted_terms
    ORDER BY cnt DESC
    LIMIT 10
  `).all();

  // Top 方剂
  const topFormulas = db.prepare(`
    SELECT formula_name, formula_source, COUNT(*) as cnt
    FROM cases
    WHERE created_at >= datetime('now', '-${days} days')
    AND formula_name IS NOT NULL
    GROUP BY formula_name
    ORDER BY cnt DESC
    LIMIT 10
  `).all();

  return { stats, topTerms, topFormulas, period_days: days };
}

/**
 * 每日统计
 */
function updateDailyStats(urgency, terms) {
  const today = new Date().toISOString().slice(0, 10);
  
  db.prepare(`
    INSERT INTO daily_stats (date, total_visits, urgency_p0, urgency_p1, urgency_p2, urgency_p3)
    VALUES (?, 1, 0, 0, 0, 0)
    ON CONFLICT(date) DO UPDATE SET
      total_visits = total_visits + 1,
      urgency_p0 = urgency_p0 + CASE WHEN ? = 'P0_EMERGENCY' THEN 1 ELSE 0 END,
      urgency_p1 = urgency_p1 + CASE WHEN ? = 'P1_SUGGEST_VISIT' THEN 1 ELSE 0 END,
      urgency_p2 = urgency_p2 + CASE WHEN ? = 'P2_HEALTH_TIP' THEN 1 ELSE 0 END,
      urgency_p3 = urgency_p3 + CASE WHEN ? = 'P3_NORMAL' THEN 1 ELSE 0 END,
      top_terms = ?
  `).run(today, urgency, urgency, urgency, urgency, terms);
}

/**
 * 获取每日统计趋势
 */
function getDailyStats(days = 7) {
  if (!db) init();
  return db.prepare(`
    SELECT * FROM daily_stats
    WHERE date >= date('now', '-${days} days')
    ORDER BY date ASC
  `).all();
}

/**
 * 患者历史
 */
function getPatientHistory(patientId, limit = 20) {
  if (!db) init();
  return db.prepare(`
    SELECT id, created_at, chief_complaint, urgency_level, formula_name, data_hash
    FROM cases
    WHERE patient_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(patientId, limit);
}

/**
 * 脱敏导出
 */
function exportAnonymized(since = null) {
  if (!db) init();
  const sinceClause = since ? "WHERE created_at >= ?" : "";
  const params = since ? [since] : [];
  
  return db.prepare(`
    SELECT data_hash, urgency_level, extracted_terms, formula_name, formula_source, created_at
    FROM cases
    ${sinceClause}
    ORDER BY created_at DESC
  `).all(...params);
}

module.exports = {
  init, saveCase, findSimilarCases, getTrends, getDailyStats,
  getPatientHistory, exportAnonymized
};
