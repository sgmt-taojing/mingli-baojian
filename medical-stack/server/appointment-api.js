'use strict';
/**
 * appointment-api.js — G12 轻预约挂号（medical-stack 侧）
 *
 * 规格（四项目同构约定，供 tcm/family 对齐）：
 *   GET  /api/appointments/slots?date=YYYY-MM-DD   — 当日号源（时段/容量/已约/剩余）
 *   POST /api/appointments                         — 创建预约 {patient_name, phone, date, slot, complaint?}
 *   POST /api/appointments/:id/checkin             — 到诊签到（booked → checked_in）
 *   POST /api/appointments/:id/cancel              — 取消（booked → cancelled）
 *   GET  /api/appointments?phone=1xxxxxxxxxx       — 按手机号查我的预约（G14 双身份复用）
 *
 * 规则：
 *   - 号源模板：上午 09:00-11:00 / 下午 14:00-16:00，每 30min 一档，每档容量 3
 *   - 爽约自动标记：签到截止 = 时段结束 + 30min；逾期未签到 → no_show（读路径懒标记 + 15min 定时）
 *   - 通知走 G10 短信适配层（mock 先行：data/sms-outbox/，标「模拟外发」）
 *   - 不做号源收费；短信只含流程性通知（适配层命理断语守卫兜底）
 */
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const sms = require('./sms_adapter.js');

const DB_PATH = path.join(__dirname, '..', 'data', 'appointments.db');
const SLOT_TEMPLATE = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
const SLOT_CAPACITY = 3;
const NO_SHOW_GRACE_MIN = 30;

let db;
function init() {
  const fs = require('fs');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    slot TEXT NOT NULL,
    complaint TEXT,
    status TEXT NOT NULL DEFAULT 'booked',
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    checked_in_at TEXT,
    cancelled_at TEXT
  )`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_appt_date_slot ON appointments(date, slot, status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_appt_phone ON appointments(phone)`);
}

function slotEndTs(date, slot) {
  const [h, m] = slot.split(':').map(Number);
  const t = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return t.getTime() + 30 * 60 * 1000; // 时段 30min
}

/** 爽约懒标记：时段结束+宽限已过 且仍 booked → no_show */
function sweepNoShow() {
  const rows = db.prepare(`SELECT id, date, slot FROM appointments WHERE status='booked'`).all();
  const now = Date.now();
  const upd = db.prepare(`UPDATE appointments SET status='no_show' WHERE id=?`);
  let n = 0;
  for (const r of rows) {
    if (now > slotEndTs(r.date, r.slot) + NO_SHOW_GRACE_MIN * 60 * 1000) { upd.run(r.id); n++; }
  }
  return n;
}

function registerRoutes(app) {
  init();
  setInterval(sweepNoShow, 15 * 60 * 1000).unref();

  // 号源查询
  app.get('/api/appointments/slots', (req, res) => {
    const date = String(req.query.date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ ok: false, error: 'date 须为 YYYY-MM-DD' });
    sweepNoShow();
    const rows = db.prepare(`SELECT slot, COUNT(*) AS n FROM appointments WHERE date=? AND status IN ('booked','checked_in') GROUP BY slot`).all(date);
    const used = Object.fromEntries(rows.map(r => [r.slot, r.n]));
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const slots = SLOT_TEMPLATE.map(slot => {
      const booked = used[slot] || 0;
      const past = date < today || (date === today && now > slotEndTs(date, slot) - 30 * 60 * 1000);
      return { slot, capacity: SLOT_CAPACITY, booked, remaining: Math.max(0, SLOT_CAPACITY - booked), bookable: !past && booked < SLOT_CAPACITY };
    });
    res.json({ ok: true, date, slots, capacity_per_slot: SLOT_CAPACITY });
  });

  // 创建预约
  app.post('/api/appointments', (req, res) => {
    const { patient_name, phone, date, slot, complaint } = req.body || {};
    if (!patient_name || !/^1\d{10}$/.test(String(phone || ''))) return res.status(400).json({ ok: false, error: 'patient_name 与合法 phone 必填' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || !SLOT_TEMPLATE.includes(slot)) {
      return res.status(400).json({ ok: false, error: `date 须为 YYYY-MM-DD，slot 限 ${SLOT_TEMPLATE.join('/')}` });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) return res.status(400).json({ ok: false, error: '不能预约过去的日期' });
    sweepNoShow();
    const dup = db.prepare(`SELECT id FROM appointments WHERE phone=? AND date=? AND slot=? AND status='booked'`).get(phone, date, slot);
    if (dup) return res.status(409).json({ ok: false, error: '同时段已有进行中的预约', id: dup.id });
    const used = db.prepare(`SELECT COUNT(*) AS n FROM appointments WHERE date=? AND slot=? AND status IN ('booked','checked_in')`).get(date, slot).n;
    if (used >= SLOT_CAPACITY) return res.status(409).json({ ok: false, error: '该时段已约满' });
    const id = 'appt-' + crypto.randomBytes(6).toString('hex');
    db.prepare(`INSERT INTO appointments (id, patient_name, phone, date, slot, complaint) VALUES (?,?,?,?,?,?)`)
      .run(id, String(patient_name).slice(0, 40), phone, date, slot, String(complaint || '').slice(0, 500));
    const s = sms.sendNotice(phone, 'appointment_created', { date, slot });
    res.json({ ok: true, id, status: 'booked', sms: s.ok ? (s.mock ? '已通知（模拟外发）' : '已通知') : `通知失败：${s.error}` });
  });

  // 到诊签到
  app.post('/api/appointments/:id/checkin', (req, res) => {
    const row = db.prepare(`SELECT * FROM appointments WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: '预约不存在' });
    if (row.status === 'checked_in') return res.json({ ok: true, id: row.id, status: 'checked_in', already: true });
    if (row.status !== 'booked') return res.status(409).json({ ok: false, error: `当前状态 ${row.status}，不可签到` });
    db.prepare(`UPDATE appointments SET status='checked_in', checked_in_at=datetime('now','localtime') WHERE id=?`).run(row.id);
    res.json({ ok: true, id: row.id, status: 'checked_in' });
  });

  // 取消预约
  app.post('/api/appointments/:id/cancel', (req, res) => {
    const row = db.prepare(`SELECT * FROM appointments WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: '预约不存在' });
    if (row.status === 'cancelled') return res.json({ ok: true, id: row.id, status: 'cancelled', already: true });
    if (row.status !== 'booked') return res.status(409).json({ ok: false, error: `当前状态 ${row.status}，不可取消` });
    db.prepare(`UPDATE appointments SET status='cancelled', cancelled_at=datetime('now','localtime') WHERE id=?`).run(row.id);
    const s = sms.sendNotice(row.phone, 'appointment_cancel', { date: row.date, slot: row.slot });
    res.json({ ok: true, id: row.id, status: 'cancelled', sms: s.ok ? (s.mock ? '已通知（模拟外发）' : '已通知') : `通知失败：${s.error}` });
  });

  // 我的预约（手机号维度，G14 信众×患者双身份只读视图复用）
  app.get('/api/appointments', (req, res) => {
    const phone = String(req.query.phone || '');
    if (!/^1\d{10}$/.test(phone)) return res.status(400).json({ ok: false, error: 'phone 必填且须为 11 位手机号' });
    sweepNoShow();
    const rows = db.prepare(`SELECT id, patient_name, date, slot, status, complaint, created_at, checked_in_at, cancelled_at
      FROM appointments WHERE phone=? ORDER BY date DESC, slot DESC LIMIT 50`).all(phone);
    res.json({ ok: true, count: rows.length, appointments: rows });
  });

  console.log('📅 G12 轻预约挂号已挂载（/api/appointments/*，爽约自动标记 15min 巡检）');
}

module.exports = { registerRoutes };
