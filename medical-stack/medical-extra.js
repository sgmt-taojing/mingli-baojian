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

// ── 存储（每病历一文件，批注只增不改）──
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

app.post('/api/emr/:id/annotate', (req, res) => {
  const emrId = req.params.id;
  const { type, author, content } = req.body || {};
  if (!['ai', 'practitioner'].includes(type)) return res.status(400).json({ ok: false, error: 'type 须为 ai | practitioner' });
  if (!author || !content) return res.status(400).json({ ok: false, error: 'author 与 content 必填' });
  // 人工命理师直接批注仍需复核链（另一名命理师 approve），保持双轨一致
  const ann = {
    id: 'ann-' + crypto.randomBytes(6).toString('hex'),
    emr_id: emrId,
    type,
    author,
    content,
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
  res.json({ ok: true, annotation: ann });
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
  res.json({ ok: true, annotation: found.a });
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
  const list = readAnns(found.emrId).map(x => (x.id === found.a.id ? found.a : x));
  writeAnns(found.emrId, list);
  res.json({ ok: true, annotation: found.a });
});

app.listen(PORT, '127.0.0.1', () => {
  console.warn(`🔮 命理宝鉴·命理批注层启动: http://127.0.0.1:${PORT}（旁路，不改医学正文）`);
});
