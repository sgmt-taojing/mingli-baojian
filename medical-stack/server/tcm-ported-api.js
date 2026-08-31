'use strict';
/**
 * tcm-ported-api.js — 中医标准智能体（tcm-agent）能力移植层
 *
 * 纪律（ADR-007 / 能力覆盖审计-20260828）：
 *   - 医学能力一律移植自 tcm，禁止在 mingli 侧再次训练，只做优化与适配；
 *   - 命理与医学合流点仅限批注环节（8974），本模块不含任何命理内容（R745/R756/R757）；
 *   - 短信只含流程性通知，sendNotice 出站前过命理断语守卫（sms_adapter 兜底）。
 *
 * 本轮移植（tcm-agent@99e01a2 缺口表 P1 修真后的全量差集）：
 *   POST /api/auth/login-phone          G10 验证码登录（手机号须登记在医师账号）
 *   POST /api/patients/phone            患者手机号登记（vault 0600，业务侧 phone_hash）
 *   GET  /api/ops/ota-health            OTA 升级源健康探针（服务端代理 8952，避免 CORS）
 *   GET  /api/ops/quality-gates         质量门禁成绩（诊断金标准+安全对抗+走查），只读
 *   POST /api/admin/users/toggle|role|delete + GET /api/admin/rbac-audit   RBAC 账号管理（超管）
 *   GET/POST /api/therapy/orders + /api/therapy/order/status|delete        治疗中心工单
 *   GET/POST /api/tele/consults         远程会诊记录（视频通道部署时接入）
 *   POST /api/inventory/item            新增药材条目（与既有 inventory/op 同一台账）
 *   POST /api/schedule/shift/delete     删除自定义班次（排班可增可删闭环）
 *   GET  /api/tcm/efficacy-records      疗效记录（处方就诊+随访疗效评分，疗效分析真实数据源）
 *
 * 数据落点与既有模块一致：DATA_DIR = medical-stack/data。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const auth = require('./auth');
const smsAdapter = require('./sms_adapter');

const DATA_DIR = path.join(__dirname, '..', 'data');
const THERAPY_FILE = path.join(DATA_DIR, 'therapy-orders.json');
const TELE_FILE = path.join(DATA_DIR, 'tele-consults.json');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');
const INV_FILE = path.join(DATA_DIR, 'inventory.json');
const FOLLOWUP_FILE = path.join(DATA_DIR, 'followups.json');
const RBAC_AUDIT_FILE = path.join(DATA_DIR, 'audit', 'rbac-log.jsonl');

function loadJsonFile(fp, fallback) {
  try { if (fs.existsSync(fp)) return JSON.parse(fs.readFileSync(fp, 'utf8') || ''); } catch (e) {}
  return fallback;
}
function saveJsonFile(fp, obj, mode) {
  try {
    const tmp = fp + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), mode ? { mode } : undefined);
    fs.renameSync(tmp, fp);
  } catch (e) { console.error('[tcm-ported] 落盘失败:', fp, e.message); }
}
function rbacAudit(action, detail, operator) {
  try {
    fs.mkdirSync(path.dirname(RBAC_AUDIT_FILE), { recursive: true });
    fs.appendFileSync(RBAC_AUDIT_FILE, JSON.stringify({ ts: new Date().toISOString(), action, detail, operator }) + '\n');
  } catch (e) {}
}

const THERAPY_STATUS_LABEL = { pending: '待治疗', active: '治疗中', done: '已完成' };

/**
 * @param {import('express').Express} app
 * @param {{ requireAuth: Function, optionalAuth: Function, rxAllRecords: Function }} deps
 *   rxAllRecords 由 api-server.js 注入（处方全量记录读取器，疗效分析数据源）
 */
function registerRoutes(app, deps) {
  const { requireAuth, optionalAuth, rxAllRecords } = deps || {};
  const opt = optionalAuth || ((req, res, next) => next());
  const rxAll = typeof rxAllRecords === 'function' ? rxAllRecords : () => [];

  function requireSuperAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ ok: false, error: '请先登录' });
    if (req.user.role !== 'super_admin') return res.status(403).json({ ok: false, error: '仅超管可管理账号' });
    next();
  }

  // ── G10 发验证码（登录/预约/绑定/医师操作核验通用；频控与锁定在适配层内）──
  app.post('/api/sms/send-code', async (req, res) => {
    try {
      const { phone, scene } = req.body || {};
      const r = await smsAdapter.sendCode(phone, scene);
      if (!r.ok) return res.status(r.rate_limited || r.locked ? 429 : 400).json(r);
      res.json(r);
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── G10 验证码登录（注意 mingli sms_adapter.verifyCode 签名为 (phone, code, scene)）──
  app.post('/api/auth/login-phone', async (req, res) => {
    try {
      const { phone, code } = req.body || {};
      const v = smsAdapter.verifyCode(phone, code, 'login');
      if (!v.ok) return res.status(401).json(v);
      const r = auth.loginByPhone(phone);
      if (!r.ok) return res.status(401).json(r);
      res.json(r);
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 患者手机号登记（vault 0600 明文仅存本机，业务侧一律 phone_hash）──
  app.post('/api/patients/phone', requireAuth, (req, res) => {
    try {
      const { patient_id, phone } = req.body || {};
      if (!patient_id || !/^1\d{10}$/.test(String(phone || ''))) return res.status(400).json({ ok: false, error: 'patient_id 与合法手机号必填' });
      const phone_hash = smsAdapter.vaultSet(patient_id, phone);
      res.json({ ok: true, patient_id, phone_hash, phone_masked: smsAdapter.maskPhone(phone) });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── OTA 升级源健康探针的服务端代理（页面直连 8952 会被 CORS 拦截）──
  app.get('/api/ops/ota-health', opt, async (_req, res) => {
    try {
      const r = await fetch('http://127.0.0.1:8952/health', { signal: AbortSignal.timeout(2000) });
      const d = await r.json().catch(() => ({}));
      res.json({ ok: true, online: true, packages: d.packages != null ? d.packages : null, updated_at: d.updated_at || null });
    } catch (e) {
      res.json({ ok: true, online: false, note: 'OTA 服务离线或已关停' });
    }
  });

  // ── 质量门禁成绩（只读、无鉴权，运维健康看板消费；适配 mingli kb 目录现状：金标准缺省时回退 eval-results.jsonl 末行）──
  app.get('/api/ops/quality-gates', (_req, res) => {
    try {
      const kbDir = path.join(__dirname, 'kb');
      const read = (f) => {
        const p = path.join(kbDir, f);
        if (!fs.existsSync(p)) return null;
        try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
      };
      let g = read('eval-gold-latest.json');
      if (!g) {
        // 回退：eval-results.jsonl 最后一条（mingli 现行评测产物）
        const jl = path.join(kbDir, 'eval-results.jsonl');
        if (fs.existsSync(jl)) {
          const last = fs.readFileSync(jl, 'utf8').split('\n').filter(Boolean).pop();
          try { g = JSON.parse(last); } catch (e) { g = null; }
        }
      }
      const s = read('safety-adversarial-latest.json');
      const w = read('walkthrough-latest.json');
      res.json({
        ok: true,
        eval: g ? {
          ts: g.ts || g.timestamp || null, total: g.total_cases != null ? g.total_cases : g.total,
          scored: g.scored, primary_pct: g.primary_pct, top4_pct: g.top4_pct, formula_pct: g.formula_pct,
          primary_hit: g.primary_hit, top4_hit: g.top4_hit, formula_hit: g.formula_hit,
          fail_count: (g.fails || []).length
        } : null,
        safety: s ? { ts: s.ts, total: s.total, pass: s.pass, fail: s.fail, fails: s.fails || [] } : null,
        walkthrough: w ? { ts: w.ts, ok: w.ok, steps: w.steps || 0, error: w.error || null } : null,
        uptime_s: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── RBAC 真实账号管理（超管专属）+ 操作审计日志 ──
  app.post('/api/admin/users', requireAuth, requireSuperAdmin, (req, res) => {
    try {
      const { username, password, name, role, specialty, phone } = req.body || {};
      if (!username || !password || !name || !role) return res.status(400).json({ ok: false, error: 'username/password/name/role 必填' });
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ ok: false, error: '用户名须为 3-20 位字母数字下划线' });
      if (String(password).length < 6) return res.status(400).json({ ok: false, error: '密码至少 6 位' });
      const r = auth.registerUser({ username, password, name, role, specialty, phone });
      if (!r.ok) return res.status(409).json(r);
      rbacAudit('create_user', `${name}(${username}) 角色 ${role}`, req.user.username);
      res.json({ ok: true, user: { username, name, role } });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/admin/users/toggle', requireAuth, requireSuperAdmin, (req, res) => {
    try {
      const { username, enabled } = req.body || {};
      const r = auth.setUserEnabled(username, enabled);
      if (!r.ok) return res.status(400).json(r);
      rbacAudit(enabled ? 'enable_user' : 'disable_user', username, req.user.username);
      res.json(r);
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/admin/users/role', requireAuth, requireSuperAdmin, (req, res) => {
    try {
      const { username, role, specialty } = req.body || {};
      const r = auth.updateUserRole(username, role, specialty);
      if (!r.ok) return res.status(400).json(r);
      rbacAudit('change_role', `${username} → ${role}`, req.user.username);
      res.json(r);
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/admin/users/delete', requireAuth, requireSuperAdmin, (req, res) => {
    try {
      const { username } = req.body || {};
      const r = auth.deleteUser(username);
      if (!r.ok) return res.status(400).json(r);
      rbacAudit('delete_user', username, req.user.username);
      res.json(r);
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get('/api/admin/rbac-audit', requireAuth, requireSuperAdmin, (req, res) => {
    try {
      let log = [];
      if (fs.existsSync(RBAC_AUDIT_FILE)) {
        log = fs.readFileSync(RBAC_AUDIT_FILE, 'utf8').split('\n').filter(Boolean)
          .map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
      }
      res.json({ ok: true, total: log.length, log: log.slice(-100).reverse() });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 治疗中心工单（针灸/推拿执行；G10 短信联动走模板，机构版话术）──
  app.get('/api/therapy/orders', opt, (req, res) => {
    try {
      const list = loadJsonFile(THERAPY_FILE, []);
      const { status } = req.query;
      const filtered = status ? list.filter(t => t.status === status) : list;
      res.json({ ok: true, total: filtered.length, orders: filtered.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/therapy/orders', opt, async (req, res) => {
    try {
      const { patient, phone, therapist, time, service, price, duration, note, contraindication } = req.body || {};
      if (!patient || !service) return res.status(400).json({ ok: false, error: 'patient/service 必填' });
      const list = loadJsonFile(THERAPY_FILE, []);
      const order = {
        id: 'TX' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(),
        patient: String(patient).slice(0, 20), phone: String(phone || '').slice(0, 20),
        therapist: String(therapist || '').slice(0, 20), time: String(time || '').slice(0, 16),
        service: String(service).slice(0, 20), price: Number(price) || 0, duration: Number(duration) || 0,
        note: String(note || '').slice(0, 200), contraindication: String(contraindication || '').slice(0, 50),
        status: 'pending', status_label: '待治疗', created_at: new Date().toISOString()
      };
      list.push(order);
      saveJsonFile(THERAPY_FILE, list.slice(-500));
      if (order.phone && /^1\d{10}$/.test(order.phone)) {
        try {
          await smsAdapter.sendNotice(order.phone, 'therapy_booked', {
            patient: order.patient, time: order.time ? order.time.replace('T', ' ') : '',
            service: order.service, therapist: order.therapist, contraindication: order.contraindication
          });
        } catch (e) {}
      }
      res.json({ ok: true, order });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/therapy/order/status', opt, (req, res) => {
    try {
      const { id, status } = req.body || {};
      if (!['pending', 'active', 'done'].includes(status)) return res.status(400).json({ ok: false, error: 'status 须为 pending/active/done' });
      const list = loadJsonFile(THERAPY_FILE, []);
      const t = list.find(x => x.id === id);
      if (!t) return res.status(404).json({ ok: false, error: '工单不存在: ' + id });
      t.status = status;
      t.status_label = THERAPY_STATUS_LABEL[status];
      if (status === 'active') t.started_at = new Date().toISOString();
      if (status === 'done') t.completed_at = new Date().toISOString();
      saveJsonFile(THERAPY_FILE, list);
      res.json({ ok: true, order: t });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/therapy/order/delete', opt, (req, res) => {
    try {
      const { id } = req.body || {};
      const list = loadJsonFile(THERAPY_FILE, []);
      const idx = list.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: '工单不存在: ' + id });
      const removed = list.splice(idx, 1)[0];
      saveJsonFile(THERAPY_FILE, list);
      res.json({ ok: true, removed: { id: removed.id } });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 远程会诊记录（会诊结论真持久化；视频通道 WebRTC 部署时接入）──
  app.get('/api/tele/consults', opt, (_req, res) => {
    try {
      const list = loadJsonFile(TELE_FILE, []).slice().sort((a, b) => String(b.time).localeCompare(String(a.time)));
      res.json({ ok: true, total: list.length, consults: list.slice(0, 100) });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post('/api/tele/consults', opt, (req, res) => {
    try {
      const { patient, doctor, complaint, note } = req.body || {};
      if (!patient || !doctor) return res.status(400).json({ ok: false, error: 'patient/doctor 必填' });
      const list = loadJsonFile(TELE_FILE, []);
      const rec = {
        id: 'TC' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(),
        patient: String(patient).slice(0, 20), doctor: String(doctor).slice(0, 20),
        complaint: String(complaint || '在线问诊').slice(0, 200),
        note: String(note || '远程会诊完成').slice(0, 500),
        time: new Date().toISOString()
      };
      list.push(rec);
      saveJsonFile(TELE_FILE, list.slice(-300));
      res.json({ ok: true, consult: rec });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 新增药材条目（入库新品；已存在则 409；与既有 /api/inventory/op 同一台账文件）──
  app.post('/api/inventory/item', opt, (req, res) => {
    try {
      const { name, stock, min_stock, price, unit, category_cn, location } = req.body || {};
      if (!name || !String(name).trim()) return res.status(400).json({ ok: false, error: 'name 必填' });
      const inv = loadJsonFile(INV_FILE, []);
      if (inv.some(i => i.name === String(name).trim())) return res.status(409).json({ ok: false, error: '药材已存在：' + name });
      const item = {
        id: 'inv-' + Date.now().toString(36),
        name: String(name).trim().slice(0, 30),
        category_cn: String(category_cn || '未分类').slice(0, 20),
        stock: Math.max(0, Number(stock) || 0),
        min_stock: Math.max(0, Number(min_stock) || 0),
        price: Math.max(0, Number(price) || 0),
        unit: String(unit || 'g').slice(0, 5),
        location: String(location || '').slice(0, 30),
        last_in: new Date().toISOString().slice(0, 10)
      };
      inv.push(item);
      saveJsonFile(INV_FILE, inv);
      res.json({ ok: true, item });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 删除自定义班次（排班可增可删才闭环；与既有 /api/schedule* 同一文件）──
  app.post('/api/schedule/shift/delete', opt, (req, res) => {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, error: 'id 必填' });
      const shifts = loadJsonFile(SCHEDULES_FILE, []);
      const idx = shifts.findIndex(x => x.id === id);
      if (idx === -1) return res.status(404).json({ ok: false, error: '班次不存在: ' + id });
      const removed = shifts.splice(idx, 1)[0];
      saveJsonFile(SCHEDULES_FILE, shifts);
      res.json({ ok: true, removed });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // ── 疗效记录：处方就诊 + 随访疗效评分（疗效分析真实数据源，页面不再依赖手填）──
  app.get('/api/tcm/efficacy-records', opt, (req, res) => {
    try {
      const days = req.query.days === 'all' ? null : Math.min(3650, parseInt(req.query.days, 10) || 90);
      const cutoff = days ? Date.now() - days * 86400000 : 0;
      const latest = {};
      rxAll().forEach(r => { if (r.rx_id) latest[r.rx_id] = r; });
      const records = [];
      Object.values(latest).forEach(r => {
        if (!['reviewed', 'paid', 'dispensed', 'ready', 'completed'].includes(r.status)) return;
        const t = Date.parse(r.created_at || '') || 0;
        if (t < cutoff) return;
        const syn = (r.diagnosis && r.diagnosis.syndrome) || (typeof r.diagnosis === 'string' ? r.diagnosis : '') || '';
        records.push({
          patient_id: r.patient_id || 'anonymous',
          patient_name: r.patient_name || (r.patient && r.patient.name) || '',
          diagnosis: syn || '未辨证',
          created_at: r.created_at,
          herbs: (r.herbs || []).map(h => (typeof h === 'string' ? h : h.name)).filter(Boolean)
        });
      });
      const followups = loadJsonFile(FOLLOWUP_FILE, []);
      followups.filter(f => f.status === 'completed' && f.symptom_score !== undefined).forEach(f => {
        const t = Date.parse(f.created_at || '') || 0;
        if (t < cutoff) return;
        const syn = f.syndrome || '';
        const cand = records
          .filter(r => r.patient_id === f.patient_id && (!syn || r.diagnosis === syn) &&
            Date.parse(r.created_at || 0) <= t && r.efficacy_score === undefined)
          .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
        if (cand) {
          cand.efficacy_score = Number(f.symptom_score);
        } else {
          records.push({
            patient_id: f.patient_id || 'anonymous',
            patient_name: f.patient_name || '',
            diagnosis: syn || '随访评估',
            created_at: f.created_at,
            herbs: String(f.formula || '').split(/[,，、\s]+/).filter(Boolean),
            efficacy_score: Number(f.symptom_score)
          });
        }
      });
      records.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      res.json({ ok: true, total: records.length, days: days || 'all', records });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  console.log('🩺 tcm 移植层已挂载（login-phone/patients-phone/ops×2/rbac×4/therapy×4/tele×2/inventory-item/shift-delete/efficacy-records，医学能力移植自 tcm-agent，未二次训练）');
}

module.exports = { registerRoutes };
