#!/usr/bin/env node
/**
 * 命理宝鉴·医道 可穿戴设备数据桥（v1.0）
 *
 * 接收 BLE / 串口 / HTTP 多源可穿戴数据
 * → 写入 data/tcm_vitals.jsonl
 * → 触发 KB 实时推断
 *
 * 支持数据源：
 *   - BLE 血压手环（JSON 推送）
 *   - HTTP POST（设备网关 → 本服务）
 *   - Web Bluetooth（浏览器侧 → API 8940）
 *   - 测试用 mock 数据
 *
 * 部署：port 8944
 *   真实场景：raspberrypi bluetooth + node wearable-bridge.js
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8944', 10);
const VITALS_LOG = path.join(__dirname, '../data/tcm_vitals.jsonl');
const DEVICE_STATE = path.join(__dirname, '../data/tcm_devices.json');

// ═══ 设备状态管理 ═══
let devices = [];
try { devices = JSON.parse(fs.readFileSync(DEVICE_STATE, 'utf-8')); } catch (e) { devices = []; }

function saveDevices() {
  fs.writeFileSync(DEVICE_STATE, JSON.stringify(devices, null, 2));
}

// ═══ KB 实时推断 ═══
function inferKBAdvice(vital) {
  const advices = [];
  if (vital.systolic > 140 || vital.diastolic > 90) {
    advices.push({ tag: '高血压', advice: '建议卧床休息，避免情绪激动，可按摩太冲穴', severity: 'warn' });
  } else if (vital.systolic < 90) {
    advices.push({ tag: '低血压', advice: '建议起身缓慢，可食用生姜红糖水', severity: 'warn' });
  }
  if (vital.heart_rate > 100) {
    advices.push({ tag: '心动过速', advice: '深呼吸 3 分钟，按摩内关穴', severity: 'warn' });
  } else if (vital.heart_rate < 50) {
    advices.push({ tag: '心动过缓', advice: '如有头晕立即就医', severity: 'alert' });
  }
  if (vital.spo2 && vital.spo2 < 92) {
    advices.push({ tag: '血氧偏低', advice: '深呼吸 + 就近就医', severity: 'alert' });
  }
  if (vital.temperature && vital.temperature > 37.5) {
    advices.push({ tag: '发热', advice: '物理降温 + 多饮水', severity: 'warn' });
  }
  return advices;
}

// ═══ 写入数据 ═══
function logVital(vital) {
  // 检查患者
  if (!vital.patient_id) vital.patient_id = 'P001';
  vital.received_at = new Date().toISOString();
  const advices = inferKBAdvice(vital);
  vital.advices = advices;
  // 追加到 JSONL
  fs.appendFileSync(VITALS_LOG, JSON.stringify(vital) + '\n');
  // 如果有严重告警，推送 wechat-bot
  if (advices.some(a => a.severity === 'alert')) {
    try {
      fetch('http://localhost:8945/api/wechat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openid: 'wx_wang',
          type: 'sos',
          data: { patient: vital.patient_id }
        })
      });
    } catch (e) {}
  }
  return vital;
}

// ═══ 启动 mock 设备（演示模式）═══
function startMockDevices() {
  // 每 30 秒生成一条 P001 张奶奶的血压心率数据
  setInterval(() => {
    const vital = {
      device_id: 'mock-bp-001',
      patient_id: 'P001',
      type: 'blood_pressure',
      systolic: 130 + Math.round(Math.sin(Date.now() / 10000) * 20),
      diastolic: 80 + Math.round(Math.cos(Date.now() / 8000) * 10),
      heart_rate: 72 + Math.round(Math.sin(Date.now() / 5000) * 8),
      spo2: 96 + (((Date.now() / 30000) % 1) * 3) | 0,
      temperature: 36.5 + (((Date.now() / 60000) % 1) * 0.6),
      source: 'mock'
    };
    logVital(vital);
    console.warn(`[mock] P001 血压 ${vital.systolic}/${vital.diastolic} 心率 ${vital.heart_rate}`);
  }, 30000);
}

// ═══ HTTP 服务 ═══
function readBody(req) {
  return new Promise(resolve => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => { try { resolve(JSON.parse(buf || '{}')); } catch (e) { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url;
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'wearable-bridge', devices: devices.length, ts: Date.now() }));
  }

  // 设备注册
  if (url === '/api/device/register' && req.method === 'POST') {
    const body = await readBody(req);
    const id = body.device_id || ('dev-' + Date.now());
    const idx = devices.findIndex(d => d.device_id === id);
    const dev = { device_id: id, name: body.name || id, type: body.type || 'unknown', patient_id: body.patient_id, registered_at: new Date().toISOString() };
    if (idx >= 0) devices[idx] = dev; else devices.push(dev);
    saveDevices();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, device: dev }));
  }

  // 上传数据
  if (url === '/api/vital/upload' && req.method === 'POST') {
    const body = await readBody(req);
    const saved = logVital(body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, vital: saved }));
  }

  // 查询最新数据
  if (url.startsWith('/api/vital/latest')) {
    const idx = url.indexOf('?');
    const queryStr = idx >= 0 ? url.substring(idx + 1) : '';
    const params = new URLSearchParams(queryStr);
    const patientId = params.get('patient_id');
    let lines = [];
    try { lines = fs.readFileSync(VITALS_LOG, 'utf-8').trim().split('\n').filter(Boolean); } catch (e) { lines = []; }
    let last = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const v = JSON.parse(lines[i]);
      if (!patientId || v.patient_id === patientId) { last = v; break; }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, latest: last, total: lines.length }));
  }

  // 设备列表
  if (url === '/api/device/list') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, devices }));
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.warn('═══════════════════════════════════════════');
  console.warn('⌚ 命理宝鉴·医道 可穿戴数据桥 启动');
  console.warn(`   端口: ${PORT}`);
  console.warn(`   数据: ${VITALS_LOG}`);
  console.warn('═══════════════════════════════════════════');
  startMockDevices();
});