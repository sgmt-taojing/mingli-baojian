'use strict';
/**
 * family-reflux.js — G13 医院报告回流家庭端 · 供给侧（mingli-baojian）
 *
 * 契约（与 family 消费侧 hospital_inbox 一致）：
 *   推送：POST {family网关}/api/inbox/hospital-report
 *     字段：link_token, report_type(emr|prescription|lab), report_id, title, summary, created_at, source
 *   绑定：患者/家属在 family 端走 bind 流程取得 link_token 后，到医院侧登记关联手机号
 *
 * mingli 特有边界（铁律）：
 *   1. 只推医学域内容；命理批注一律剥离不回流家庭端；信众命理报告本版不回流
 *   2. 结构性剥离：出站载荷只从白名单字段组装，绝不做对象透传
 *   3. 文本级守卫：title/summary 过命理关键词扫描，命中即拒发（family 侧还有二次校验兜底）
 *
 * 路由：
 *   POST /api/reflux/link    { phone, link_token }        — 患者登记 family 绑定 token
 *   POST /api/reflux/push    { phone, report_type, report_id, title, summary?, created_at? }
 *   GET  /api/reflux/links   （内部核查用，token 脱敏回显）
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const http = require('http');
const sms = require('./sms_adapter.js'); // 复用命理关键词守卫口径

const DB_PATH = path.join(__dirname, '..', 'data', 'appointments.db'); // 与 G12 共库（轻量表）
const INBOX_FILE = path.join(__dirname, '..', 'data', 'patient-inbox.json'); // 本院患者/家属端收件箱（移植 tcm G13 主落点）
const FAMILY_BASE = process.env.FAMILY_BASE || 'http://127.0.0.1:8970';
const SOURCE = 'mingli-baojian';
const REPORT_TYPES = ['emr', 'prescription', 'lab'];

// ── 患者收件箱（只存白名单组装后的医学域载荷，与回流 family 同一份；命理批注从根本不存在）──
function inboxAppend(phone, payload, pushedFamily) {
  try {
    let items = [];
    if (fs.existsSync(INBOX_FILE)) items = JSON.parse(fs.readFileSync(INBOX_FILE, 'utf8') || '[]');
    items.push({
      id: 'INB' + Date.now().toString(36).toUpperCase(),
      phone: String(phone),
      link_token: payload.link_token,
      report_type: payload.report_type, report_id: payload.report_id,
      title: payload.title, summary: payload.summary,
      created_at: payload.created_at, source: payload.source,
      pushed_family: !!pushedFamily,
      received_at: new Date().toISOString()
    });
    const tmp = INBOX_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(items.slice(-1000), null, 2));
    fs.renameSync(tmp, INBOX_FILE);
  } catch (e) { console.error('[reflux-inbox] 落盘失败:', e.message); }
}
function inboxForPhone(phone, limit) {
  let items = [];
  try { if (fs.existsSync(INBOX_FILE)) items = JSON.parse(fs.readFileSync(INBOX_FILE, 'utf8') || '[]'); } catch (e) {}
  return items.filter(i => i.phone === String(phone))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, limit || 50)
    .map(i => ({ id: i.id, report_type: i.report_type, report_id: i.report_id, title: i.title,
      summary: i.summary, created_at: i.created_at, source: i.source, pushed_family: i.pushed_family }));
}

let db;
function init() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`CREATE TABLE IF NOT EXISTS reflux_links (
    phone TEXT PRIMARY KEY,
    link_token TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  )`);
}

function postFamily(payload, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const req = http.request(FAMILY_BASE + '/api/inbox/hospital-report', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: timeoutMs,
    }, (resp) => {
      const chunks = [];
      resp.on('data', c => chunks.push(c));
      resp.on('end', () => {
        try { resolve({ status: resp.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
        catch (e) { resolve({ status: resp.statusCode, body: null, error: 'family 响应非 JSON' }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: null, error: e.message }));
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.write(data); req.end();
  });
}

/** 文本级命理守卫（复用 G10 词表 + family 侧字段键口径） */
function mingliScan(text) {
  return sms.containsMingli(text);
}

function registerRoutes(app) {
  init();

  // 患者登记 family link_token（token 由 family 端 bind 流程签发）
  const linkHandler = (req, res) => {
    const { phone } = req.body || {};
    // tcm 同构兼容：tcm 侧字段名 family_token，mingli G13 原字段 link_token，两者同义
    const link_token = (req.body || {}).link_token || (req.body || {}).family_token;
    if (!/^1\d{10}$/.test(String(phone || ''))) return res.status(400).json({ ok: false, error: 'phone 须为 11 位手机号' });
    if (!/^lnk_[0-9a-f]{16,}$/.test(String(link_token || ''))) return res.status(400).json({ ok: false, error: 'link_token 格式不合法（应形如 lnk_…，由家庭端绑定流程签发）' });
    db.prepare(`INSERT INTO reflux_links (phone, link_token) VALUES (?,?)
      ON CONFLICT(phone) DO UPDATE SET link_token=excluded.link_token, created_at=datetime('now','localtime')`)
      .run(phone, link_token);
    res.json({ ok: true, phone: phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'), link_token, bound_at: new Date().toISOString(), hint: '已关联。报告出具时可回流家庭端（仅医学域内容）' });
  };
  app.post('/api/reflux/link', linkHandler);
  app.post('/api/report-link/bind', linkHandler); // tcm 同构别名（诊断-20260831 P0）

  // 解绑（tcm 同构新增：mingli 侧按手机号删除关联）
  const unbindHandler = (req, res) => {
    const { phone } = req.body || {};
    if (!/^1\d{10}$/.test(String(phone || ''))) return res.status(400).json({ ok: false, error: 'phone 须为 11 位手机号' });
    const r = db.prepare(`DELETE FROM reflux_links WHERE phone=?`).run(phone);
    res.json({ ok: true, unbound: r.changes, message: r.changes ? '已解除绑定，后续报告不再回流家庭端' : '该手机号无有效绑定' });
  };
  app.post('/api/report-link/unbind', unbindHandler);

  // 绑定状态查询（tcm 同构新增；token 脱敏回显）
  app.get('/api/report-link/status', (req, res) => {
    const phone = String(req.query.phone || '');
    if (!/^1\d{10}$/.test(phone)) return res.status(400).json({ ok: false, error: 'phone 必填且须为 11 位手机号' });
    const link = db.prepare(`SELECT link_token, created_at FROM reflux_links WHERE phone=?`).get(phone);
    res.json({
      ok: true, bound: !!link, bound_at: link ? link.created_at : null,
      link_token_masked: link ? link.link_token.slice(0, 8) + '…' + link.link_token.slice(-4) : null,
      phone_masked: phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
    });
  });

  // 推送队列核查（tcm 同构新增；mingli 为即时直推，无重试队列，如实回报）
  app.get('/api/report-link/push-queue', (_req, res) => {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM reflux_links`).get().n;
    res.json({ ok: true, items: [], links: n, note: 'mingli 侧为即时直推（sync push），无重试队列；推送结果见 /api/reflux/push 响应' });
  });

  // 推送报告到 family（白名单组装 + 命理剥离守卫）
  app.post('/api/reflux/push', async (req, res) => {
    const { phone, report_type, report_id, title, summary, created_at } = req.body || {};
    if (!REPORT_TYPES.includes(report_type)) return res.status(400).json({ ok: false, error: `report_type 限 ${REPORT_TYPES.join('/')}` });
    if (!report_id || !title) return res.status(400).json({ ok: false, error: 'report_id 与 title 必填' });
    const link = db.prepare(`SELECT link_token FROM reflux_links WHERE phone=?`).get(String(phone || ''));
    if (!link) return res.status(404).json({ ok: false, error: '该手机号未关联 family 绑定（先走 /api/reflux/link）' });

    // 铁律：命理内容不回流——文本守卫（title+summary）
    const hits = mingliScan(String(title) + ' ' + String(summary || ''));
    if (hits.length) {
      return res.status(422).json({ ok: false, error: '命理边界守卫：回流内容命中命理词，已拒发', code: 'MINGLI_STRIPPED_BLOCK', hits });
    }

    // 结构性剥离：只组装白名单字段（批注/命理字段从根本不存在于载荷）
    const payload = {
      link_token: link.link_token,
      report_type, report_id: String(report_id).slice(0, 80),
      title: String(title).slice(0, 200),
      summary: String(summary || '').slice(0, 2000),
      created_at: String(created_at || new Date().toISOString()),
      source: SOURCE,
    };
    const r = await postFamily(payload);
    const accepted = !!(r.body && r.body.ok);
    // 本院收件箱（G13 主落点，移植 tcm report-link 语义）：无论 family 是否接受，患者凭 token 可在本院自查
    inboxAppend(phone, payload, accepted);
    if (accepted) {
      return res.json({ ok: true, member_id: r.body.member_id, duplicated: !!r.body.duplicated, family: 'accepted', inbox: true });
    }
    const famErr = (r.body && (r.body.error || r.body.code)) || r.error || `HTTP ${r.status}`;
    res.status(502).json({ ok: false, error: `family 侧未接受：${famErr}`, family_code: r.body && r.body.code, inbox: true, note: '已入本院收件箱，患者可凭 link_token 自查' });
  });

  // 患者/家属端：凭 lnk_ 令牌读自己的医院报告（移植 tcm /api/my/reports；本院收件箱，仅医学域内容）
  app.get('/api/my/reports', (req, res) => {
    try {
      const token = String(req.query.token || '');
      if (!token) return res.status(400).json({ ok: false, error: 'token 必填' });
      const row = db.prepare(`SELECT phone, created_at FROM reflux_links WHERE link_token=?`).get(token);
      if (!row) return res.status(401).json({ ok: false, error: '令牌无效或已解绑' });
      const items = inboxForPhone(row.phone, parseInt(req.query.limit || '50', 10));
      res.json({ ok: true, phone_masked: row.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
        bound_at: row.created_at, total: items.length, items });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  // 内部核查：已登记关联（token 脱敏）
  app.get('/api/reflux/links', (req, res) => {
    const rows = db.prepare(`SELECT phone, link_token, created_at FROM reflux_links ORDER BY created_at DESC LIMIT 50`).all();
    res.json({
      ok: true, count: rows.length,
      links: rows.map(r => ({
        phone: r.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'),
        link_token_masked: r.link_token.slice(0, 8) + '…' + r.link_token.slice(-4),
        created_at: r.created_at,
      })),
    });
  });

  console.log('🏠 G13 报告回流供给侧已挂载（/api/reflux/* + tcm 同构别名 /api/report-link/{bind,unbind,status,push-queue}，命理批注结构性剥离 + 文本守卫）');
}

module.exports = { registerRoutes, mingliScan };
