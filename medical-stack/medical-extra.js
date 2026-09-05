#!/usr/bin/env node
/**
 * medical-extra.js — 命理宝鉴·医学栈 旁路服务（P4 EMR 命理批注层）
 * 端口：8974（ML_EXTRA_PORT 可调）
 *
 * 定位：命理批注"附加层"，遵循三原则——
 *   1. 只增不改：批注写入 data/annotations/ 独立存储，绝不触碰医学正文/病历库
 *   2. AI+人工双轨：AI 批注一律 status=pending_review（待命理师核对），
 *      必须经真实命理师 approve 后才可对外展示
 *   3. 免责声明强制：每条命理批注自动附带「命理参考，非医学诊断」，
 *      pending 状态附加「待命理师核对」水印
 *
 * 路由：
 *   POST /api/emr/:id/annotate        — 写入批注（type: ai | practitioner）
 *   GET  /api/emr/:id/annotations     — 某病历的全部批注
 *   GET  /api/annotation-queue        — 命理师工作台队列（pending + 48h SLA + 积压计数）
 *   POST /api/annotations/:aid/approve — 命理师核对通过（需 reviewer）
 *   POST /api/annotations/:aid/reject  — 命理师驳回（需 reviewer + reason）
 *   GET  /health
 */
'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = parseInt(process.env.ML_EXTRA_PORT || '8974', 10);
const ROOT = __dirname;
const ANN_DIR = path.join(ROOT, 'data', 'annotations');
const DISCLAIMER = '命理参考，非医学诊断';
const SLA_HOURS = 48;
// G10: 短信验证与提醒适配层（mock 先行：写 data/sms-outbox/，标「模拟外发」）
const sms = require('./server/sms_adapter.js');

fs.mkdirSync(ANN_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '1mb' }));
// SEC-001：仅放行本机来源（工作台页 8973 → 8974 跨端口属合法）
const LOCAL_ORIGIN_RE = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;
app.use((req, res, next) => {
  const o = req.headers.origin || '';
  if (LOCAL_ORIGIN_RE.test(o)) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();
  if (o && !LOCAL_ORIGIN_RE.test(o)) return res.status(403).json({ ok: false, error: '仅允许本机来源调用' });
  next();
});

// ── 缺陷模式库（驳回原因 → 根修线索，R-LY 系列实证沉淀，随新缺陷持续补充）──
// 每条：match 命中驳回原因关键词；ref 对应根修编号；suspect 根因方向；hint 修复路径
const DEFECT_PATTERNS = [
  { match: /世爻|应爻|第\s*0\s*爻|爻位|自相矛盾/,
    ref: 'R-LY2', suspect: '世应爻 0 基/1 基口径（展示层）',
    hint: '查 norm-output-template.js / norm-report-engine.js 展示处是否 +1；数据层 huajie-engine 数组下标为 0 基正确口径，勿动' },
  { match: /知识.{0,4}(错配|无关)|引用.{0,4}(无关|错|乱)|错配|张冠李戴|不相关|噪声/,
    ref: 'R-LY3', suspect: 'KB 知识依据与问事类目/卦名不对齐（用神相关性）',
    hint: '查 kb-module-filter.js filterKbHitsByTopic 章节类目规则与卦名对齐；章节名新词补 CHAPTER_TOPIC_RULES' },
  { match: /时效|太岁|三年|近期|应期|时间.{0,4}(错|偏)/,
    ref: 'R-LY4', suspect: '逐年走势与问事时效意图错配（近期事项配长线走势）',
    hint: '查 paipan-baihua-engine.js horizonOf 关键词覆盖；新时效表达补正则' },
  { match: /跨模块|串味|泄漏|六爻.{0,6}梅花|梅花.{0,6}六爻|他派|混入/,
    ref: 'R-LY5', suspect: '泛域 KB 条目内容含他模块专有名词穿透域级过滤',
    hint: '查 kb-module-filter.js KB_DENY_CONTENT；新专词补对应模块正则' },
  { match: /起卦|排盘|卦名|卦象.{0,4}(错|不对)|干支.{0,4}错/,
    ref: 'ENGINE', suspect: '排盘内核数据（起卦/干支/星曜）',
    hint: '查对应 liuyao/qimen/ziwei-engine-node.js 内核与同案 SVG 服务端盘图是否一致；以权威万年历对拍' },
  { match: /白话|看不懂|术语|生硬|模板|空话/,
    ref: 'BAIHUA', suspect: '白话解读层（模板空话/术语未翻译）',
    hint: '查 paipan-baihua-engine.js 对应模块 cards/forecast 文案与 norm-report-engine 模板句' },
  { match: /化解|建议.{0,4}(空|泛|套话)|调理/,
    ref: 'HUAJIE', suspect: '化解方案层（泛泛而谈无行动项）',
    hint: '查 huajie-engine.js 方案生成与行动卡；按姓名工具「评分→针对性建议」范式补齐' },
  { match: /采集|生辰|信息.{0,4}(缺|错)|入参/,
    ref: 'COLLECT', suspect: '采集层信息不足或字段错配',
    hint: '查 validateCollection 一级校验与问事页采集表单字段' },
];
const TRIAGE_LOG = path.join(ROOT, 'data', 'reject-triage.jsonl');

// ── 存储（每病历一文件，批注只增不改）──

function triageRejectReason(reason) {
  const text = String(reason || '');
  const hits = DEFECT_PATTERNS.filter(p => p.match.test(text))
    .map(p => ({ ref: p.ref, suspect: p.suspect, hint: p.hint }));
  if (!hits.length) {
    hits.push({ ref: 'NEW', suspect: '未命中已知缺陷模式', hint: '登记 KANBAN 待诊断；修复确认后将关键词补入 DEFECT_PATTERNS' });
  }
  return hits;
}


function annFile(emrId) {
  const safe = String(emrId).replace(/[^A-Za-z0-9_-]/g, '');
  return path.join(ANN_DIR, `${safe}.json`);
}
function readAnns(emrId) {
  try { return JSON.parse(fs.readFileSync(annFile(emrId), 'utf8')); } catch (_) { return []; }
}
function writeAnns(emrId, list) {
  fs.writeFileSync(annFile(emrId), JSON.stringify(list, null, 2));
}
function* iterAll() {
  for (const n of fs.readdirSync(ANN_DIR)) {
    if (!n.endsWith('.json')) continue;
    const emrId = n.replace(/\.json$/, '');
    for (const a of readAnns(emrId)) yield { emrId, a };
  }
}
function findAnn(aid) {
  for (const { emrId, a } of iterAll()) {
    if (a.id === aid) return { emrId, a };
  }
  return null;
}

// ── 路由 ──
app.get('/health', (req, res) => {
  res.json({ ok: true, service: '命理宝鉴·命理批注层', port: PORT, uptime: process.uptime() });
});

// ── G10① 命理师入驻/登录验证码（mock 通道，哈希落库，错五锁十）──
app.post('/api/sms/send-code', (req, res) => {
  const { phone, scene } = req.body || {};
  const r = sms.sendCode(String(phone || ''), String(scene || 'master-login'));
  res.status(r.ok ? 200 : 429).json(r);
});
app.post('/api/sms/verify-code', (req, res) => {
  const { phone, code, scene } = req.body || {};
  const r = sms.verifyCode(String(phone || ''), String(code || ''), String(scene || 'master-login'));
  res.status(r.ok ? 200 : 400).json(r);
});

// G11: 批注历史（已核对/已驳回，最新在前）——移动端核对端「批注历史」数据源
app.get('/api/annotation-history', (req, res) => {
  const done = [];
  for (const { emrId, a } of iterAll()) {
    if (a.status === 'approved' || a.status === 'rejected') done.push({ ...a, emr_id: emrId });
  }
  done.sort((x, y) => (y.reviewed_at || '').localeCompare(x.reviewed_at || ''));
  res.json({ ok: true, count: done.length, history: done.slice(0, 50) });
});

app.post('/api/emr/:id/annotate', (req, res) => {
  const emrId = req.params.id;
  const { type, author, content, patientPhone } = req.body || {};
  if (!['ai', 'practitioner'].includes(type)) return res.status(400).json({ ok: false, error: 'type 须为 ai | practitioner' });
  if (!author || !content) return res.status(400).json({ ok: false, error: 'author 与 content 必填' });
  // 人工命理师直接批注仍需复核链（另一名命理师 approve），保持双轨一致
  const ann = {
    id: 'ann-' + crypto.randomBytes(6).toString('hex'),
    emr_id: emrId,
    type,
    author,
    content,
    patientPhone: /^1\d{10}$/.test(String(patientPhone || '')) ? String(patientPhone) : null, // G10③ 批注完成通知患者用
    disclaimer: DISCLAIMER,
    status: 'pending_review',
    watermark: '待命理师核对',
    created_at: new Date().toISOString(),
    reviewed_at: null,
    reviewer: null,
  };
  const list = readAnns(emrId);
  list.push(ann);
  writeAnns(emrId, list);
  // G10② 批注待核对提醒 → 当值命理师（48h SLA 计时起点）；未配置当值号码则诚实跳过
  let smsNote = null;
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'server', 'config', 'carrier-config.local.json'), 'utf8'));
    const duty = cfg.dutyMasterPhone || cfg.testPhone;
    if (duty) {
      const s = sms.sendNotice(duty, 'annotation_pending', { emrId });
      smsNote = s.ok ? `已通知当值命理师（${s.mock ? '模拟外发' : '实发'}）` : `通知失败：${s.error}`;
    }
  } catch (_) { /* 无本地配置：跳过提醒 */ }
  res.json({ ok: true, annotation: ann, sms: smsNote });
});

app.get('/api/emr/:id/annotations', (req, res) => {
  res.json({ ok: true, emr_id: req.params.id, annotations: readAnns(req.params.id) });
});

app.get('/api/annotation-queue', (req, res) => {
  const now = Date.now();
  const pending = [];
  let approved = 0, rejected = 0, overdue = 0;
  for (const { emrId, a } of iterAll()) {
    if (a.status === 'approved') { approved++; continue; }
    if (a.status === 'rejected') { rejected++; continue; }
    const ageH = (now - new Date(a.created_at).getTime()) / 36e5;
    const isOverdue = ageH > SLA_HOURS;
    if (isOverdue) overdue++;
    pending.push({ ...a, emr_id: emrId, age_hours: Math.round(ageH * 10) / 10, overdue: isOverdue });
  }
  pending.sort((x, y) => x.created_at.localeCompare(y.created_at));
  res.json({
    ok: true,
    sla_hours: SLA_HOURS,
    backlog: pending.length,
    overdue,
    stats: { pending: pending.length, approved, rejected },
    queue: pending,
  });
});

app.post('/api/annotations/:aid/approve', (req, res) => {
  const { reviewer } = req.body || {};
  if (!reviewer) return res.status(400).json({ ok: false, error: 'reviewer（命理师）必填' });
  const found = findAnn(req.params.aid);
  if (!found) return res.status(404).json({ ok: false, error: '批注不存在' });
  if (found.a.status !== 'pending_review') return res.status(409).json({ ok: false, error: `当前状态 ${found.a.status}，不可重复核对` });
  if (found.a.author === reviewer) return res.status(403).json({ ok: false, error: '批注人与核对人不得为同一人' });
  found.a.status = 'approved';
  found.a.watermark = null;
  found.a.reviewed_at = new Date().toISOString();
  found.a.reviewer = reviewer;
  const list = readAnns(found.emrId).map(x => (x.id === found.a.id ? found.a : x));
  writeAnns(found.emrId, list);
  // G10③ 批注完成 → 通知患者查看病历（批注携带 patientPhone 时）
  let smsNote = null;
  if (found.a.patientPhone) {
    const s = sms.sendNotice(found.a.patientPhone, 'annotation_done', { emrId: found.emrId });
    smsNote = s.ok ? `已通知患者（${s.mock ? '模拟外发' : '实发'}）` : `通知失败：${s.error}`;
  }
  res.json({ ok: true, annotation: found.a, sms: smsNote });
});

app.post('/api/annotations/:aid/reject', (req, res) => {
  const { reviewer, reason } = req.body || {};
  if (!reviewer || !reason) return res.status(400).json({ ok: false, error: 'reviewer 与 reason 必填' });
  const found = findAnn(req.params.aid);
  if (!found) return res.status(404).json({ ok: false, error: '批注不存在' });
  if (found.a.status !== 'pending_review') return res.status(409).json({ ok: false, error: `当前状态 ${found.a.status}，不可重复核对` });
  found.a.status = 'rejected';
  found.a.reviewed_at = new Date().toISOString();
  found.a.reviewer = reviewer;
  found.a.reject_reason = reason;
  // 根修 checklist：驳回原因命中已知缺陷库 → 直接转成开发线索（随批注持久化 + jsonl 登记）
  const triage = triageRejectReason(reason);
  found.a.triage = triage;
  try {
    fs.appendFileSync(TRIAGE_LOG, JSON.stringify({
      at: found.a.reviewed_at, annotation_id: found.a.id, emr_id: found.emrId,
      reviewer, reason, triage: triage.map(t => t.ref),
    }) + '\n');
  } catch (_) { /* 登记失败不阻塞驳回 */ }
  const list = readAnns(found.emrId).map(x => (x.id === found.a.id ? found.a : x));
  writeAnns(found.emrId, list);
  // 驳回标准动作：信众求测件附同案重出回执（修复后一键重出 + 新旧 diff）
  const qiuceMatch = /^QIUCE-(\d+)$/.exec(found.emrId);
  const retest = qiuceMatch
    ? { available: true, qiuce_id: parseInt(qiuceMatch[1]), endpoint: `/api/annotations/${found.a.id}/retest`, hint: '根修完成后调用同案重出，新初稿自动入队复核并与本件 diff', triage }
    : { available: false, triage };
  res.json({ ok: true, annotation: found.a, retest });
});

// 同案重出（驳回→根修→重出→复核销案 标准动作）
// 代理 8920 /api/internal/qiuce/:id/retest：重出初稿 + 新旧 diff + 重新入队
app.post('/api/annotations/:aid/retest', async (req, res) => {
  const found = findAnn(req.params.aid);
  if (!found) return res.status(404).json({ ok: false, error: '批注不存在' });
  if (found.a.status !== 'rejected') return res.status(409).json({ ok: false, error: `仅驳回件可同案重出（当前 ${found.a.status}）` });
  const qiuceMatch = /^QIUCE-(\d+)$/.exec(found.emrId);
  if (!qiuceMatch) return res.status(400).json({ ok: false, error: '仅信众求测件（QIUCE-*）支持同案重出' });
  try {
    const r = await fetch(`http://127.0.0.1:8920/api/internal/qiuce/${qiuceMatch[1]}/retest`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Skip-Interceptor': '1' },
      body: '{}', signal: AbortSignal.timeout(15000),
    });
    const d = await r.json().catch(() => null);
    if (!d || d.code !== 0) return res.status(502).json({ ok: false, error: (d && d.message) || '主栈重出失败' });
    res.json({ ok: true, emr_id: found.emrId, old_annotation: found.a.id, ...d.data });
  } catch (e) {
    res.status(502).json({ ok: false, error: '主栈不可达：' + e.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.warn(`🔮 命理宝鉴·命理批注层启动: http://127.0.0.1:${PORT}（旁路，不改医学正文）`);
});
