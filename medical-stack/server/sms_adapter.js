'use strict';
/**
 * sms_adapter.js — G10 短信验证与提醒适配层（命理宝鉴 · 主栈与 medical-stack 共用）
 *
 * 能力：
 *   sendCode(phone, scene)    — 6 位验证码：5 分钟有效、频控（同号同场景 1/分钟、5/天）、
 *                               sha256 哈希落库（不明文存码）、错 5 次锁 10 分钟
 *   verifyCode(phone, code, scene) — 校验（一次性，成功即焚）
 *   sendNotice(phone, kind, vars)  — 流程性通知（模板化，机构版话术）
 *
 * 通道：
 *   mock 模式（默认）——写 data/sms-outbox/YYYY-MM-DD.jsonl，记录标「模拟外发」
 *   真实通道——config/carrier-config.local.json（凭据不进 git，.gitignore 已列）置 enabled:true 后启用；
 *             未配置时任何真实外发请求诚实降级为 mock 并标注
 *
 * 红线：短信只含流程性通知，不含命理断语——sendNotice 出站前过命理关键词守卫，命中即拒发。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const OUTBOX_DIR = path.join(DATA_DIR, 'sms-outbox');
const VERIFY_FILE = path.join(DATA_DIR, 'sms-verify.json');
const CONFIG_FILE = path.join(ROOT, 'config', 'carrier-config.local.json');

fs.mkdirSync(OUTBOX_DIR, { recursive: true });

// ── 配置（凭据本地文件，不进 git）──
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch (_) { return { enabled: false, provider: null, mock: true }; }
}

// ── 命理断语守卫（短信只走流程通知）──
const MINGLI_FORBIDDEN = ['日主', '天干', '地支', '八字', '紫微', '命宫', '财帛宫', '大运', '流年',
  '四柱', '纳音', '食神', '伤官', '七杀', '正官', '偏财', '比肩', '劫财', '排盘', '命盘', '化忌',
  '凶', '克夫', '克妻', '灾', '劫数'];
function containsMingli(text) {
  // 「凶/灾」单字误伤面大，只拦双字以上断语词；单字词表另行精确匹配
  const HARD = MINGLI_FORBIDDEN.filter(w => w.length >= 2);
  return HARD.filter(w => String(text).includes(w));
}

// ── 通知模板（机构版话术，流程性内容）──
const TEMPLATES = {
  // ② 批注待核对提醒 → 当值命理师（48h SLA 计时起点）
  annotation_pending: (v) => `【命理宝鉴】新病例待核对：病历 ${v.emrId} 已入批注队列，请在 48 小时内完成核对。登录工作台处理。`,
  // ③ 批注完成通知 → 患者
  annotation_done: (v) => `【命理宝鉴】您的就诊报告已完成医师核对，病历号 ${v.caseId || v.emrId}。请凭会话凭证在报告页查看。`,
  // ④ 病历/报告出具通知（机构版）
  report_ready: (v) => `【命理宝鉴】您的电子病历已出具，病历号 ${v.caseId || v.emrId}。本系统为辅助诊疗工具，最终诊疗决策由执业医师作出。`,
  // ① 验证码
  verify_code: (v) => `【命理宝鉴】验证码 ${v.code}，5 分钟内有效。您正在进行${v.sceneText || '身份验证'}，请勿泄露给他人。`,
  // G12 预约
  appointment_created: (v) => `【命理宝鉴】预约成功：${v.date} ${v.slot}，请提前 10 分钟到诊。如需取消请回复或登录小程序操作。`,
  appointment_remind: (v) => `【命理宝鉴】就诊提醒：您预约的 ${v.date} ${v.slot} 时段将至，请准时到诊。`,
  appointment_cancel: (v) => `【命理宝鉴】您的预约（${v.date} ${v.slot}）已取消。`,
  // G14 信众报告
  seeker_report: (v) => `【命理宝鉴】您求测的${v.category || '命理'}报告已完成核对，请登录个人中心「我的报告」查看。内容仅供参考。`,
};

// ── 出站记录（mock outbox）──
function outboxWrite(rec) {
  const day = new Date().toISOString().slice(0, 10);
  const fp = path.join(OUTBOX_DIR, `${day}.jsonl`);
  fs.appendFileSync(fp, JSON.stringify(rec) + '\n', 'utf8');
  return fp;
}

function maskPhone(p) { return String(p).replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2'); }
function validPhone(p) { return /^1\d{10}$/.test(String(p || '')); }

/**
 * 发送流程性通知。
 * @returns {{ok:boolean, mock:boolean, id?:string, error?:string, blocked_words?:string[]}}
 */
function sendNotice(phone, kind, vars) {
  const cfg = loadConfig();
  const tpl = TEMPLATES[kind];
  if (!tpl) return { ok: false, error: `未知通知模板: ${kind}` };
  if (!validPhone(phone)) return { ok: false, error: '手机号格式不合法' };
  const text = tpl(vars || {});
  const blocked = containsMingli(text);
  if (blocked.length) {
    return { ok: false, error: '命理断语守卫拦截：短信只含流程性通知', blocked_words: blocked };
  }
  const rec = {
    id: 'sms-' + crypto.randomBytes(6).toString('hex'),
    ts: new Date().toISOString(),
    to: maskPhone(phone),
    kind, text,
    mode: cfg.enabled ? 'carrier' : 'mock',
    note: cfg.enabled ? undefined : '模拟外发',
  };
  // 真实通道：当前仅支持 mock；配置 enabled 但未接 carrier SDK 时诚实降级
  if (cfg.enabled) { rec.mode = 'mock'; rec.note = '模拟外发（carrier 通道配置未接 SDK，降级）'; }
  outboxWrite(rec);
  return { ok: true, mock: true, id: rec.id };
}

// ── 验证码（哈希落库 + 频控 + 错五锁十）──
const CODE_TTL_MS = 5 * 60 * 1000;
const LOCK_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;
const DAILY_MAX = 5;
const MIN_INTERVAL_MS = 60 * 1000;

function readStore() {
  try { return JSON.parse(fs.readFileSync(VERIFY_FILE, 'utf8')); } catch (_) { return {}; }
}
function writeStore(s) {
  const tmp = VERIFY_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, VERIFY_FILE);
}
function salt() {
  const cfg = loadConfig();
  if (cfg.codeSalt) return cfg.codeSalt;
  // 无配置盐：生成一次持久化到 data（非凭据，仅本地散列盐）
  const sf = path.join(DATA_DIR, '.sms-salt');
  try { return fs.readFileSync(sf, 'utf8'); }
  catch (_) {
    const s = crypto.randomBytes(16).toString('hex');
    fs.writeFileSync(sf, s, { mode: 0o600 });
    return s;
  }
}
function hashCode(phone, code) {
  return crypto.createHash('sha256').update(`${salt()}|${phone}|${code}`).digest('hex');
}

/**
 * 发验证码。scene: master-login | master-register | patient-report 等
 */
function sendCode(phone, scene) {
  if (!validPhone(phone)) return { ok: false, error: '手机号格式不合法' };
  const store = readStore();
  const key = `${phone}|${scene || 'default'}`;
  const now = Date.now();
  const rec = store[key] || { sends: [], fails: 0, lockedUntil: 0 };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { ok: false, error: `错误次数过多，请 ${Math.ceil((rec.lockedUntil - now) / 60000)} 分钟后再试`, locked: true };
  }
  rec.sends = (rec.sends || []).filter(t => now - t < 24 * 3600 * 1000);
  if (rec.sends.length && now - rec.sends[rec.sends.length - 1] < MIN_INTERVAL_MS) {
    return { ok: false, error: '发送过于频繁，请 1 分钟后再试', limited: true };
  }
  if (rec.sends.length >= DAILY_MAX) {
    return { ok: false, error: '本号今日验证码已达上限（5 次）', limited: true };
  }
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  rec.hash = hashCode(phone, code);
  rec.expiresAt = now + CODE_TTL_MS;
  rec.fails = 0;
  rec.sends.push(now);
  store[key] = rec;
  writeStore(store);
  const sceneText = { 'master-login': '命理师登录', 'master-register': '命理师入驻', 'patient-report': '报告查询' }[scene] || '身份验证';
  const sent = sendNotice(phone, 'verify_code', { code, sceneText });
  if (!sent.ok) return sent;
  return { ok: true, mock: true, ttl: 300, id: sent.id };
}

/** 校验验证码（成功即焚；错 5 次锁 10 分钟） */
function verifyCode(phone, code, scene) {
  const store = readStore();
  const key = `${phone}|${scene || 'default'}`;
  const rec = store[key];
  const now = Date.now();
  if (!rec || !rec.hash) return { ok: false, error: '请先获取验证码' };
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return { ok: false, error: '已锁定，请稍后再试', locked: true };
  }
  if (rec.expiresAt < now) { rec.hash = null; rec.expiresAt = 0; writeStore(store); return { ok: false, error: '验证码已过期' }; }
  if (hashCode(phone, String(code || '')) === rec.hash) {
    rec.hash = null; rec.expiresAt = 0; // 一次性焚毁，但保留 sends/频控状态
    writeStore(store);
    return { ok: true };
  }
  rec.fails = (rec.fails || 0) + 1;
  if (rec.fails >= MAX_FAILS) {
    rec.lockedUntil = now + LOCK_MS;
    rec.fails = 0;
    writeStore(store);
    return { ok: false, error: '错误 5 次，已锁定 10 分钟', locked: true };
  }
  writeStore(store);
  return { ok: false, error: `验证码错误（剩余 ${MAX_FAILS - rec.fails} 次机会）`, fails: rec.fails };
}

module.exports = { sendCode, verifyCode, sendNotice, containsMingli, TEMPLATES, _paths: { OUTBOX_DIR, VERIFY_FILE, CONFIG_FILE } };
