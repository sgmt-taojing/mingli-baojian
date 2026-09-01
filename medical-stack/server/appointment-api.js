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
const fs = require('fs');
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
  try { db.exec(`ALTER TABLE appointments ADD COLUMN doctor_name TEXT`); } catch (_) { /* 已存在 */ }
  // D6 召回闭环（吸收自 tcm 契约 v1.3.5）：召回单↔预约双向链接
  try { db.exec(`ALTER TABLE appointments ADD COLUMN recall_id TEXT`); } catch (_) { /* 已存在 */ }
  try { db.exec(`ALTER TABLE appointments ADD COLUMN source TEXT`); } catch (_) { /* 已存在 */ }
  // D7（吸收自 tcm 契约 v1.3.6）：临诊提醒标记 + 爽约时间戳
  try { db.exec(`ALTER TABLE appointments ADD COLUMN reminded_at TEXT`); } catch (_) { /* 已存在 */ }
  try { db.exec(`ALTER TABLE appointments ADD COLUMN noshow_at TEXT`); } catch (_) { /* 已存在 */ }
}

function slotEndTs(date, slot) {
  const [h, m] = slot.split(':').map(Number);
  const t = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return t.getTime() + 30 * 60 * 1000; // 时段 30min
}

/** 爽约懒标记 + D7 爽约自动召回建单（吸收自 tcm 契约 v1.3.6）+ 临诊 1 小时提醒
 *  幂等：同一预约只建一单（source=noshow + appointment_id 判重） */
const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
function sweepNoShow() {
  const rows = db.prepare(`SELECT id, patient_name, phone, date, slot, doctor_name, status, reminded_at FROM appointments WHERE status='booked'`).all();
  const now = Date.now();
  const upd = db.prepare(`UPDATE appointments SET status='no_show', noshow_at=? WHERE id=?`);
  const updRemind = db.prepare(`UPDATE appointments SET reminded_at=? WHERE id=?`);
  let n = 0;
  for (const r of rows) {
    const slotStart = slotEndTs(r.date, r.slot) - 30 * 60 * 1000;
    if (now > slotEndTs(r.date, r.slot) + NO_SHOW_GRACE_MIN * 60 * 1000) {
      upd.run(new Date().toISOString(), r.id);
      n++;
      // 爽约通知（mock 先行）
      if (validPhone(r.phone)) {
        try { sms.sendNotice(r.phone, 'appointment_noshow', { patient: r.patient_name, date: r.date, slot: r.slot, doctor: r.doctor_name || '当班医师' }); } catch (_) {}
      }
      // D7：爽约 → 自动建召回单进医生待办（爽约率是门诊经营关键指标）
      try {
        let revisits = [];
        try { revisits = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { revisits = []; }
        if (!revisits.some(x => x.appointment_id === r.id && x.source === 'noshow')) {
          revisits.push({
            id: 'RV-NS-' + Date.now().toString(36).toUpperCase() + '-' + r.id.slice(-6).toUpperCase(),
            followup_id: '', consult_id: '',
            patient_id: '', patient_name: r.patient_name || '预约患者',
            appointment_id: r.id,
            risk_type: 'appointment_noshow', risk_level: 'medium',
            syndrome: '', formula: '',
            feedback: '预约 ' + r.date + ' ' + r.slot + '（' + (r.doctor_name || '当班医师') + '）过号未到，按爽约处理',
            reason: '[爽约召回] ' + r.patient_name + ' 预约 ' + r.date + ' ' + r.slot + ' ' + (r.doctor_name || '当班医师') + ' 门诊未到；建议电话回访确认情况，视情重新预约',
            source: 'noshow',
            status: 'pending', priority: 'normal',
            created_at: new Date().toISOString()
          });
          fs.mkdirSync(path.dirname(REVISIT_FILE), { recursive: true });
          fs.writeFileSync(REVISIT_FILE, JSON.stringify(revisits.slice(-300), null, 2));
        }
      } catch (e) { console.error('[appointment] 爽约召回建单失败:', e.message); }
    } else if (!r.reminded_at && now > slotStart - 3600000 && now < slotStart) {
      // 临诊 1 小时内未提醒 → 提醒一次
      updRemind.run(new Date().toISOString(), r.id);
      if (validPhone(r.phone)) {
        try { sms.sendNotice(r.phone, 'appointment_remind', { date: r.date, slot: r.slot }); } catch (_) {}
      }
    }
  }
  return n;
}
function validPhone(p) { return /^1\d{10}$/.test(String(p || '')); }

function registerRoutes(app, authMw) {
  init();
  setInterval(sweepNoShow, 15 * 60 * 1000).unref();
  const auth = authMw || {};
  const requireAuth = auth.requireAuth || ((req, res, next) => next());
  const staffRole = auth.requireStaffRole || (() => (req, res, next) => next());
  // D6：患者名 EMPI 只读解析（孪生召回单只持 patient_id）
  const patientIndex = (() => {
    try { return require('./kb-store/patient-index'); } catch (e) { return null; }
  })();

  // 号源查询
  const slotsHandler = (req, res) => {
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
    res.json({ ok: true, date, doctor: req.query.doctor || null, slots, capacity_per_slot: SLOT_CAPACITY });
  };
  app.get('/api/appointments/slots', slotsHandler);
  app.get('/api/clinic/appointment/slots', slotsHandler); // tcm 同构别名（诊断-20260831 P0）

  // 创建预约（tcm 同构：接受 doctor_id/doctor_name 字段）
  const createHandler = (req, res) => {
    const { patient_name, phone, date, slot, complaint, doctor_name } = req.body || {};
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
    db.prepare(`INSERT INTO appointments (id, patient_name, phone, date, slot, complaint, doctor_name) VALUES (?,?,?,?,?,?,?)`)
      .run(id, String(patient_name).slice(0, 40), phone, date, slot, String(complaint || '').slice(0, 500), doctor_name ? String(doctor_name).slice(0, 20) : null);
    const s = sms.sendNotice(phone, 'appointment_created', { date, slot });
    res.json({ ok: true, id, status: 'booked', sms: s.ok ? (s.mock ? '已通知（模拟外发）' : '已通知') : `通知失败：${s.error}` });
  };
  app.post('/api/appointments', createHandler);
  app.post('/api/clinic/appointment', createHandler); // tcm 同构别名

  // 到诊签到
  const checkinHandler = (req, res) => {
    const row = db.prepare(`SELECT * FROM appointments WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: '预约不存在' });
    if (row.status === 'checked_in') return res.json({ ok: true, id: row.id, status: 'checked_in', already: true });
    if (row.status !== 'booked') return res.status(409).json({ ok: false, error: `当前状态 ${row.status}，不可签到` });
    db.prepare(`UPDATE appointments SET status='checked_in', checked_in_at=datetime('now','localtime') WHERE id=?`).run(row.id);
    res.json({ ok: true, id: row.id, status: 'checked_in' });
  };
  app.post('/api/appointments/:id/checkin', checkinHandler);
  app.post('/api/clinic/appointment/checkin', (req, res) => { req.params.id = String((req.body || {}).id || ''); checkinHandler(req, res); }); // tcm 同构别名（body.id）

  // 取消预约
  const cancelHandler = (req, res) => {
    const row = db.prepare(`SELECT * FROM appointments WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: '预约不存在' });
    if (row.status === 'cancelled') return res.json({ ok: true, id: row.id, status: 'cancelled', already: true });
    if (row.status !== 'booked') return res.status(409).json({ ok: false, error: `当前状态 ${row.status}，不可取消` });
    db.prepare(`UPDATE appointments SET status='cancelled', cancelled_at=datetime('now','localtime') WHERE id=?`).run(row.id);
    const s = sms.sendNotice(row.phone, 'appointment_cancel', { date: row.date, slot: row.slot });
    res.json({ ok: true, id: row.id, status: 'cancelled', sms: s.ok ? (s.mock ? '已通知（模拟外发）' : '已通知') : `通知失败：${s.error}` });
  };
  app.post('/api/appointments/:id/cancel', cancelHandler);
  app.post('/api/clinic/appointment/cancel', (req, res) => { req.params.id = String((req.body || {}).id || ''); cancelHandler(req, res); }); // tcm 同构别名（body.id）

  // 预约列表：手机号维度（我的预约）或日期维度（导诊台，tcm 同构）
  const listHandler = (req, res) => {
    const phone = String(req.query.phone || '');
    const date = String(req.query.date || '');
    sweepNoShow();
    if (/^1\d{10}$/.test(phone)) {
      const rows = db.prepare(`SELECT id, patient_name, date, slot, status, complaint, doctor_name, created_at, checked_in_at, cancelled_at
        FROM appointments WHERE phone=? ORDER BY date DESC, slot DESC LIMIT 50`).all(phone);
      return res.json({ ok: true, count: rows.length, appointments: rows });
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const rows = db.prepare(`SELECT id, patient_name, phone, date, slot, status, complaint, doctor_name, created_at, checked_in_at, cancelled_at
        FROM appointments WHERE date=? ORDER BY slot`).all(date);
      return res.json({
        ok: true, total: rows.length, date,
        appointments: rows.map(r => ({ ...r, phone_masked: r.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'), phone: undefined })),
      });
    }
    return res.status(400).json({ ok: false, error: 'phone（11 位手机号）或 date（YYYY-MM-DD）必填其一' });
  };
  app.get('/api/appointments', listHandler);
  app.get('/api/clinic/appointment/list', listHandler); // tcm 同构别名

  // D6（吸收自 tcm 契约 v1.3.5）：召回单排期 → 直建预约占号（医生侧发起，免患者短信验证码）
  // 闭环：召回单 pending → 选时段占号 → 召回单 scheduled + appointment booked 双向链接 → 有手机号即发 mock 提醒
  // 适配：ms 预约模型为 sqlite（appointments.db），容量规则=每档 3（全局，不按医师分列）
  app.post('/api/clinic/appointment/from-recall', requireAuth, staffRole(['doctor', 'admin']), async (req, res) => {
    try {
      const { revisit_id, date, slot, doctor_name, phone } = req.body || {};
      if (!revisit_id || !date || !slot) return res.status(400).json({ ok: false, error: 'revisit_id/date/slot 必填' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !SLOT_TEMPLATE.includes(slot)) {
        return res.status(400).json({ ok: false, error: `date 须为 YYYY-MM-DD，slot 限 ${SLOT_TEMPLATE.join('/')}` });
      }
      const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
      let revisits = [];
      try { revisits = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { revisits = []; }
      const idx = revisits.findIndex(r => r.id === revisit_id);
      if (idx < 0) return res.status(404).json({ ok: false, error: '召回单不存在' });
      const rv = revisits[idx];
      if (rv.status !== 'pending') return res.status(409).json({ ok: false, error: '召回单当前状态不可排期: ' + rv.status });

      const docName = String(doctor_name || (req.user && req.user.username) || '当班医师').slice(0, 20);
      const used = db.prepare(`SELECT COUNT(*) AS n FROM appointments WHERE date=? AND slot=? AND status IN ('booked','checked_in')`).get(date, slot).n;
      if (used >= SLOT_CAPACITY) return res.status(409).json({ ok: false, error: '该时段已约满', capacity: SLOT_CAPACITY });

      // 患者名解析：召回单自带 patient_name；孪生单经 EMPI 只读解析（内部使用，不出库）
      let patientName = rv.patient_name && rv.patient_name !== rv.patient_id ? rv.patient_name : '';
      if (!patientName && rv.patient_id && patientIndex && patientIndex.getPatient) {
        const rec = patientIndex.getPatient(rv.patient_id);
        if (rec && rec.name_full) patientName = rec.name_full;
      }
      if (!patientName) patientName = '召回患者';

      const phoneStr = String(phone || '').replace(/\D/g, '').slice(0, 11);
      const id = 'appt-' + crypto.randomBytes(6).toString('hex');
      db.prepare(`INSERT INTO appointments (id, patient_name, phone, date, slot, complaint, doctor_name, recall_id, source) VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(id, patientName.slice(0, 40), phoneStr.length === 11 ? phoneStr : '',
             date, slot, String(rv.reason || rv.feedback || '风险召回复诊').slice(0, 500), docName, revisit_id, 'recall');

      // 召回单 → scheduled（双向链接）
      revisits[idx].status = 'scheduled';
      revisits[idx].schedule_at = date + ' ' + slot;
      revisits[idx].appointment_id = id;
      revisits[idx].doctor_name = docName;
      revisits[idx].scheduled_at = new Date().toISOString();
      fs.mkdirSync(path.dirname(REVISIT_FILE), { recursive: true });
      fs.writeFileSync(REVISIT_FILE, JSON.stringify(revisits, null, 2));

      // 临诊提醒（G10 mock 先行；无手机号如实标注未发）
      let smsRet = { status: 'no_phone', mock: false };
      if (phoneStr.length === 11) {
        const d = await sms.sendNotice(phoneStr, 'recall_scheduled', { patient: patientName, date, slot, doctor: docName });
        smsRet = { status: d.ok ? 'sent' : ('blocked: ' + (d.error || 'unknown')), mock: !!d.mock };
      }
      // G13+revisit（契约扩展 2026-09-01）：复诊安排回流家庭端（医学域流程内容；失败不阻断主链）
      let reflux = { pushed: false };
      if (phoneStr.length === 11) {
        try {
          const refluxPush = require('./family-reflux.js').pushByPhone;
          const rp = await refluxPush(phoneStr, {
            report_type: 'revisit', report_id: revisit_id,
            title: `复诊安排：${date} ${slot}`,
            summary: `${patientName}：医师为您安排了复诊，时间 ${date} ${slot}（${docName}）。请提前 10 分钟到院导诊台报到。`,
          });
          reflux = { pushed: rp.ok, ...(rp.ok ? {} : { note: rp.code || rp.error }) };
        } catch (e) { reflux = { pushed: false, note: e.message }; }
      }
      res.json({
        ok: true,
        appointment: { id, patient_name: patientName, doctor_name: docName, date, slot, status: 'booked', recall_id: revisit_id, source: 'recall' },
        revisit: { id: revisit_id, status: 'scheduled', schedule_at: revisits[idx].schedule_at },
        sms: smsRet, reflux
      });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // D8（吸收自 tcm 契约 v1.3.7）：召回成效统计（门诊经营视角）
  // 口径：响应率 = (scheduled+completed)/总单；闭环率 = completed/总单；爽约率 = no_show/(非取消预约)
  // 适配：ms 预约域为 sqlite，爽约态为 no_show（tcm 为 noshow），爽约标记走本模块 sweepNoShow
  app.get('/api/clinic/recall-stats', async (req, res) => {
    try {
      const REVISIT_FILE = path.join(__dirname, '..', 'data', 'revisits.json');
      let revisits = [];
      try { revisits = JSON.parse(fs.readFileSync(REVISIT_FILE, 'utf8') || '[]'); } catch (e) { revisits = []; }
      sweepNoShow();

      const SRC_LABEL = { 'twin-risk': '孪生风险', 'followup': '随访加重', 'noshow': '爽约', 'manual': '手工' };
      const bySource = {};
      for (const r of revisits) {
        const src = r.source || (r.followup_id ? 'followup' : 'manual');
        if (!bySource[src]) bySource[src] = { label: SRC_LABEL[src] || src, total: 0, pending: 0, scheduled: 0, completed: 0, responded_in_24h: 0 };
        const b = bySource[src];
        b.total++;
        b[r.status] = (b[r.status] || 0) + 1;
        const acted = r.scheduled_at || r.completed_at;
        if (acted && r.created_at && (new Date(acted) - new Date(r.created_at)) <= 86400000) b.responded_in_24h++;
      }
      const total = revisits.length;
      const scheduled = revisits.filter(r => r.status === 'scheduled').length;
      const completed = revisits.filter(r => r.status === 'completed').length;

      const apActive = db.prepare(`SELECT status FROM appointments WHERE status != 'cancelled'`).all();
      const noshow = apActive.filter(a => a.status === 'no_show').length;

      res.json({
        ok: true,
        recall: {
          total, pending: revisits.filter(r => r.status === 'pending').length,
          scheduled, completed,
          response_rate: total ? Math.round((scheduled + completed) / total * 1000) / 10 : null,
          close_rate: total ? Math.round(completed / total * 1000) / 10 : null,
          by_source: bySource
        },
        noshow: {
          appointments: apActive.length, noshow,
          rate: apActive.length ? Math.round(noshow / apActive.length * 1000) / 10 : null
        },
        basis: 'revisits.json + appointments 实时聚合；响应率=(排期+闭环)/总单',
        generated_at: new Date().toISOString()
      });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  console.log('📅 G12 轻预约挂号已挂载（/api/appointments/* + tcm 同构别名 /api/clinic/appointment*，爽约自动标记 15min 巡检）');
}

module.exports = { registerRoutes, phoneForRecall: (rid) => {
  try { const r = db.prepare(`SELECT phone FROM appointments WHERE recall_id=? AND phone!='' ORDER BY created_at DESC LIMIT 1`).get(String(rid || '')); return r ? r.phone : null; } catch (_) { return null; }
} };
