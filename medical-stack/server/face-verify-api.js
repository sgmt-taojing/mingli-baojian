/**
 * face-verify-api.js — 患者身份核验 + 医保人脸核对能力（医学模块）
 * 医学场景匹配：tcm-agent（医学标准智能体）· 患者身份管理
 * 算法来源：AI视频算法平台 face-feature（mingli-baojian/server/face-embed-server.py :8958）
 *   det_10g 人脸检测 + w600k_r50 512 维特征 + genderage
 * 端点：
 *   POST /api/face/identity/register  患者建档人脸注册（patient_id + face）
 *   POST /api/face/identity/verify    就诊人脸核验（patient_id + face → 比对库内特征）
 *   GET  /api/face/identity/status    核验能力状态
 * 医保核对：verify 返回 match + similarity，供医保局系统对接
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');

const FACE_SVC = 'http://127.0.0.1:8958';
const DB = path.join(__dirname, '..', 'data', 'face-identity-db.json');

function loadDb() { try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (e) { return {}; } }
function saveDb(d) { fs.mkdirSync(path.dirname(DB), { recursive: true }); fs.writeFileSync(DB, JSON.stringify(d, null, 2)); }

function callFaceSvc(endpoint, payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const req = http.request(FACE_SVC + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 15000 }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { resolve({ ok: false, error: 'parse fail' }); } });
    });
    req.on('error', () => resolve({ ok: false, error: 'face-service unavailable' }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'face-service timeout' }); });
    req.write(body); req.end();
  });
}

function registerRoutes(app) {
  // 注册：患者建档人脸入库
  app.post('/api/face/identity/register', async (req, res) => {
    try {
      const { patient_id, image, name } = req.body || {};
      if (!patient_id || !image) return res.status(400).json({ ok: false, error: 'patient_id 与 image 必填' });
      const r = await callFaceSvc('/api/face/register', { person_id: String(patient_id), name: name || '', image });
      if (!r.ok) return res.json({ ok: false, error: r.error || '注册失败' });
      const db = loadDb();
      db[String(patient_id)] = { name: name || '', embedding: r.embedding, registered_at: new Date().toISOString() };
      saveDb(db);
      res.json({ ok: true, patient_id, face_count: r.face_count, dim: r.dim, note: '医保人脸注册完成' });
    } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 200) }); }
  });

  // 核验：就诊人脸 vs 库内特征（医保人脸核对）
  app.post('/api/face/identity/verify', async (req, res) => {
    try {
      const { patient_id, image } = req.body || {};
      if (!patient_id || !image) return res.status(400).json({ ok: false, error: 'patient_id 与 image 必填' });
      // 医保核对：调 8958 库内 1:1 核验（face-feature 算法）
      const v = await callFaceSvc('/api/face/verify', { person_id: String(patient_id), image });
      if (v.http_status === 404 || (v.error && v.error.includes('not registered'))) {
        return res.json({ ok: false, error: '患者未注册人脸，请先建档' });
      }
      if (!v.ok) return res.json({ ok: false, error: v.error || '核验服务异常' });
      res.json({
        ok: true, patient_id, match: v.match, similarity: v.similarity, threshold: v.threshold || 0.5,
        scene: 'medical-insurance-face-check',
        name: v.name,
        note: v.match ? '身份核验通过（医保人脸核对一致）' : '身份核验不通过，请人工复核',
      });
    } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 200) }); }
  });

  // 注册人员清单（管理端）
  app.get('/api/face/identity/list', async (req, res) => {
    try {
      const db = loadDb();
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
      const items = Object.entries(db).slice(0, limit).map(([pid, rec]) => ({
        patient_id: pid, name: rec.name || '', registered_at: rec.registered_at || '',
      }));
      res.json({ ok: true, total: Object.keys(db).length, items });
    } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 200) }); }
  });

  // 注销人脸（管理端）
  app.post('/api/face/identity/remove', async (req, res) => {
    try {
      const { patient_id } = req.body || {};
      if (!patient_id) return res.status(400).json({ ok: false, error: 'patient_id 必填' });
      const db = loadDb();
      if (!db[String(patient_id)]) return res.json({ ok: false, error: '未注册' });
      delete db[String(patient_id)];
      saveDb(db);
      res.json({ ok: true, patient_id });
    } catch (e) { res.status(500).json({ ok: false, error: String(e).slice(0, 200) }); }
  });

  // 状态
  app.get('/api/face/identity/status', async (req, res) => {
    const db = loadDb();
    res.json({ ok: true, registered: Object.keys(db).length, face_service: FACE_SVC, scene: 'medical-identity' });
  });
}

module.exports = { registerRoutes };
