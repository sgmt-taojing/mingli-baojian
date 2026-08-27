/**
 * insurance-adaptor.js — 医保局人脸核对对接适配层（R735 医学身份核验）
 * 场景：医保局系统人脸核对（医疗身份确认）
 * 协议：医保标准接口规范（interfacenumber 风格，可配置对接方）
 * 安全：数据脱敏（日志不存照片/特征明文）+ 全量审计（traceId 可追溯）
 * 依赖：face-embed-server（:8958）算法
 * 端点：
 *   POST /api/insurance/face-check   医保人脸核对（医保局调用）
 *   GET  /api/insurance/audit        审计日志（脱敏）
 *   GET  /api/insurance/status       适配层状态
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const FACE_SVC = 'http://127.0.0.1:8958';
const LOG_DB = path.join(__dirname, '..', 'data', 'insurance-check-log.json');
const DEIDENT = (v) => (v ? String(v).slice(0, 2) + '***' + String(v).slice(-2) : ''); // 脱敏：前后各留 2 位

function loadLog() { try { return JSON.parse(fs.readFileSync(LOG_DB, 'utf8')); } catch (e) { return []; } }
function saveLog(log) { fs.mkdirSync(path.dirname(LOG_DB), { recursive: true }); fs.writeFileSync(LOG_DB, JSON.stringify(log, null, 2)); }

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

function build_explain(code, v, patient_id) {
  const sim = typeof v.similarity === 'number' ? v.similarity : (v.best && v.best.similarity) || null;
  const simTxt = sim === null ? '' : '（相似度 ' + Math.round(sim * 1000) / 1000 + '）';
  const base = '参保人 ' + (patient_id || '未知') + ' ' + simTxt;
  switch (code) {
    case 'MATCH':
      return { verdict: '通过', text: base + '：人脸一致，可以继续办理医保业务。', next: ['放行进入后续流程', '如需开药/报销直接走正常通道'], safe: true };
    case 'MISMATCH':
      return { verdict: '不通过', text: base + '：人脸不一致。请人工复核参保人身份与现场照片，必要时要求补充证件。', next: ['人工比对证件照与现场人像', '仍无法确认时拒绝办理并上报'], safe: false };
    case 'NOT_REGISTERED':
      return { verdict: '未建档', text: '该参保人尚未录入人脸档案，无法自动核对。', next: ['引导参保人到建档窗口补录人脸', '补录后重新核验'], safe: false };
    case 'SVC_ERR':
      return { verdict: '服务异常', text: '核验服务暂时不可用，请稍后重试或走人工通道。', next: ['稍后重试', '人工核验兜底（证件+签名）'], safe: false };
    default:
      return { verdict: '未知', text: '核验返回异常结果，请人工确认。', next: ['人工复核'], safe: false };
  }
}

function registerRoutes(app) {
  // 医保人脸核对（医保局对接）
  app.post('/api/insurance/face-check', async (req, res) => {
    try {
      const { patient_id, photo_base64, operator, channel } = req.body || {};
      if (!photo_base64) {
        return res.status(400).json({ code: 'PARAM_MISSING', message: 'photo_base64 必填',
          explain: { verdict: '参数缺失', text: '请先拍摄/上传参保人现场照片，再点核验。', next: ['拍摄现场人像', '重新核验'], safe: false } });
      }
      const traceId = 'MBS-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();
      // 调人脸算法核验
      const vPayload = { image: photo_base64 };
      if (patient_id) vPayload.person_id = String(patient_id);  // 有 ID：1:1；无 ID：1:N 全库检索
      const v = await callFaceSvc('/api/face/verify', vPayload);
      let code, message;
      if (!v.ok) {
        if (v.error && v.error.includes('not registered')) { code = 'NOT_REGISTERED'; message = '参保人未注册人脸'; }
        else { code = 'SVC_ERR'; message = v.error || '核验服务异常'; }
      } else {
        code = v.match ? 'MATCH' : 'MISMATCH';
        message = v.match ? '人脸核对一致' : '人脸核对不一致，请人工复核';
      }
      // R735-g10：核验结果智能解读（医保窗口 AI 辅助）
      const explain = build_explain(code, v, patient_id);
      // 审计日志（脱敏：不存照片/特征，患者 ID 脱敏，相似度取 3 位）
      const log = loadLog();
      log.unshift({
        traceId, code, message,
        patient_id: DEIDENT(patient_id || (v.best && v.best.person_id) || ''), operator: DEIDENT(operator || 'system'),
        channel: String(channel || 'insurance').slice(0, 30),
        similarity: typeof v.similarity === 'number' ? Math.round(v.similarity * 1000) / 1000 : (v.best && v.best.similarity) || null,
        face_ms: v.ms || null, hint: v.hint || '',
        ts: new Date().toISOString(),
      });
      saveLog(log.slice(0, 500)); // 保留最近 500 条
      // 医保标准响应
      res.json({
        interfacenumber: 'MZRH_0101', bizType: 'medicalFaceCheck', traceId,
        code, message, match: code === 'MATCH', explain,
        similarity: typeof v.similarity === 'number' ? Math.round(v.similarity * 1000) / 1000 : null,
        patient_id: DEIDENT(patient_id || (v.best && v.best.person_id) || ''),
        ts: new Date().toISOString(),
      });
    } catch (e) { res.status(500).json({ code: 'SYS_ERR', message: String(e).slice(0, 200) }); }
  });

  // 审计日志（脱敏查询）
  app.get('/api/insurance/audit', (req, res) => {
    const log = loadLog();
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    res.json({ ok: true, total: log.length, records: log.slice(0, limit) });
  });

  // 适配层状态
  app.get('/api/insurance/status', async (req, res) => {
    const log = loadLog();
    const matchCount = log.filter((r) => r.code === 'MATCH').length;
    res.json({
      ok: true, service: 'insurance-adaptor', scene: 'medical-insurance-face-check',
      face_service: FACE_SVC, total_checks: log.length, match_count: matchCount,
      last_check: log[0] ? log[0].ts : null,
      deidentification: 'ON（日志不存照片/特征明文，ID 脱敏）',
    });
  });
}

module.exports = { registerRoutes };
