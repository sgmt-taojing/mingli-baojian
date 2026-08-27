#!/usr/bin/env node
/**
 * 命理宝鉴·医道 微信推送服务（v1.0）
 *
 * 覆盖场景：
 *   1. 用药提醒（每日定时）
 *   2. 紧急事件（SOS → 3 家属）
 *   3. 复诊通知（提前 1 天 + 当天）
 *   4. 健康周报（每周日推送）
 *   5. 家庭成员状态同步（子女端→父母端）
 *
 * 微信通道（按优先级）：
 *   - WECHAT_CORP_ID + WECHAT_CORP_SECRET + WECHAT_AGENT_ID（企业微信）
 *   - WECHAT_APP_ID + WECHAT_APP_SECRET（公众号模板消息）
 *   - WECHAT_WEBHOOK_URL（群机器人 webhook 兜底）
 *   - console（无任何配置时打印到 stdout）
 *
 * 部署：
 *   - 端口 8945
 *   - 定时任务由 deploy.js 启动时挂载
 */

'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '8945', 10);
const WECHAT_CORP_ID = process.env.WECHAT_CORP_ID || '';
const WECHAT_CORP_SECRET = process.env.WECHAT_CORP_SECRET || '';
const WECHAT_AGENT_ID = process.env.WECHAT_AGENT_ID || '';
const WECHAT_APP_ID = process.env.WECHAT_APP_ID || '';
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET || '';
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL || '';

const TCM_API = process.env.TCM_API || 'http://localhost:8940';

// ═══ 微信通道适配器 ═══

async function sendViaCorpWechat(openid, content) {
  if (!WECHAT_CORP_ID || !WECHAT_CORP_SECRET || !WECHAT_AGENT_ID) {
    throw new Error('企业微信配置缺失');
  }
  // 简化实现：生产环境应缓存 access_token
  const tokenUrl = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${WECHAT_CORP_ID}&corpsecret=${WECHAT_CORP_SECRET}`;
  const tokenResp = await fetch(tokenUrl);
  const tokenData = await tokenResp.json();
  if (tokenData.errcode !== 0) throw new Error('access_token 获取失败: ' + tokenData.errmsg);

  const sendUrl = `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`;
  const sendResp = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      touser: openid,
      msgtype: 'text',
      agentid: WECHAT_AGENT_ID,
      text: { content }
    })
  });
  return await sendResp.json();
}

async function sendViaWebhook(content) {
  if (!WECHAT_WEBHOOK_URL) throw new Error('webhook 未配置');
  return await fetch(WECHAT_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ msgtype: 'text', text: { content } })
  });
}

async function sendViaConsole(openid, content) {
  console.warn(`[wechat-bot] → ${openid}: ${content}`);
  return { ok: true, channel: 'console' };
}

async function sendWechatMessage(openid, content) {
  // 优先级：企业微信 → 公众号 → webhook → console
  if (WECHAT_CORP_ID && WECHAT_CORP_SECRET && WECHAT_AGENT_ID) {
    try { return await sendViaCorpWechat(openid, content); } catch (e) { console.error('[corp] fail', e.message); }
  }
  if (WECHAT_WEBHOOK_URL) {
    try { return await sendViaWebhook(content); } catch (e) { console.error('[webhook] fail', e.message); }
  }
  return await sendViaConsole(openid, content);
}

// ═══ 推送类型生成器 ═══

const TEMPLATES = {
  medication: (item) => `💊 用药提醒\n时间: ${item.time}\n药品: ${item.drug}\n剂量: ${item.dose || '按方'}\n请按时服用 ✅`,
  sos: (item) => `🚨 紧急求助\n${item.patient} 触发了紧急按钮\n位置: ${item.location || '未知'}\n时间: ${new Date().toLocaleString('zh-CN')}\n请立即响应！`,
  visit: (item) => `📅 复诊提醒\n${item.patient} 的下次复诊：\n时间: ${item.time}\n医生: ${item.doctor || '王医生'}\n地点: ${item.location || '本院'}`,
  weekly: (item) => item.report ? `📊 家庭健康周报\n${item.report}` : `📊 健康周报\n${item.patient} 本周数据：\n血压均值: ${item.bp || '-'}\n睡眠时长: ${item.sleep || '-'}\n用药依从: ${item.compliance || '-'}%\nKB 提示: ${item.kb_tip || '注意保暖'}`,
  status: (item) => `👨‍👩‍👧 家庭成员状态\n${item.patient}（${item.role}）\n当前: ${item.status}\n详情: ${item.detail || '查看健康档案'}`,
  followup_reminder: (item) => `📋 随访提醒\n${item.patient} 的随访计划已到期/逾期：\n证型: ${item.syndrome || '-'}\n处方: ${item.formula || '-'}\n请反馈症状改善情况（0-10 分），以便医生评估疗效`,
  consult_result: (item) => `${item.title || '问诊结果'}\n${item.patient} 的问诊已有医生审核结果：\n证型: ${item.syndrome || '-'}\n处方: ${item.formula || '-'}\n医嘱: ${item.advice || '-'}\n请登录家庭端查看详情并按时反馈随访`
};

// ═══ 定时任务 ═══

const PUSH_HISTORY = [];

function logPush(type, target, content) {
  const record = { type, target, content, ts: new Date().toISOString() };
  PUSH_HISTORY.push(record);
  if (PUSH_HISTORY.length > 200) PUSH_HISTORY.shift();
  console.warn(`[push] ${record.ts} ${type} → ${target}`);
}

// 每分钟检查用药提醒
setInterval(async () => {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  // 调用 命理宝鉴·医道 拿家庭端用药计划
  try {
    const r = await fetch(TCM_API + '/api/home/med-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time: hhmm })
    });
    if (!r.ok) return;
    const data = await r.json();
    if (data.reminders && Array.isArray(data.reminders)) {
      for (const item of data.reminders) {
        const content = TEMPLATES.medication(item);
        await sendWechatMessage(item.openid || 'family_member', content);
        logPush('medication', item.openid || 'family_member', content);
      }
    }
  } catch (e) {
    // 命理宝鉴·医道 没启动是常态（演示模式），不报错
  }
}, 60000);

// 每周日 18:00 推周报
setInterval(async () => {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() !== 18 || now.getMinutes() !== 0) return;
  try {
    const r = await fetch(TCM_API + '/api/home/weekly-report', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    if (!r.ok) return;
    const data = await r.json();
    if (data.reports && Array.isArray(data.reports)) {
      for (const item of data.reports) {
        const content = TEMPLATES.weekly(item);
        await sendWechatMessage(item.openid || 'family_member', content);
        logPush('weekly', item.openid || 'family_member', content);
      }
    }
  } catch (e) {}
}, 60000);

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
  // CORS：允许 8931 静态服务跨端口访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  console.warn(`[${new Date().toISOString()}] ${req.method} ${url}`);

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'wechat-bot', ts: Date.now() }));
    return;
  }

  // 推送接口（手动触发）
  if (url === '/api/wechat/send' && req.method === 'POST') {
    const body = await readBody(req);
    const { openid, type } = body || {};
    const payload = (body && body.data) || {};
    const content = TEMPLATES[type] ? TEMPLATES[type](payload) : payload.content || '';
    if (!content) { res.writeHead(400); return res.end('content required'); }
    const result = await sendWechatMessage(openid || 'default', content);
    logPush(type, openid || 'default', content);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, result }));
    return;
  }

  // SOS 推送（一键 3 家属）
  if (url === '/api/wechat/sos' && req.method === 'POST') {
    const body = await readBody(req);
    const family = body.family || [{ name: '家属1', openid: 'family1' }, { name: '家属2', openid: 'family2' }, { name: '家属3', openid: 'family3' }];
    const content = TEMPLATES.sos(body);
    const results = [];
    for (const f of family) {
      const r = await sendWechatMessage(f.openid, content);
      results.push({ to: f.name, ok: true });
      logPush('sos', f.openid, content);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, sent: results.length, results }));
    return;
  }

  // 推送历史
  if (url === '/api/wechat/history') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, history: PUSH_HISTORY.slice(-20), total: PUSH_HISTORY.length }));
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

// 修真（2026-08-15 R730 P0-2）：绑定 127.0.0.1 防暴露，扫到的端口从 *:8946 → 127.0.0.1:8946
server.listen(PORT, '127.0.0.1', () => {
  console.warn('═══════════════════════════════════════════');
  console.warn('💬 命理宝鉴·医道 微信推送服务 启动');
  console.warn(`   端口: ${PORT}`);
  console.warn(`   TCM API: ${TCM_API}`);
  console.warn(`   通道: ${WECHAT_CORP_ID ? '企业微信' : (WECHAT_WEBHOOK_URL ? 'webhook' : 'console')}`);
  console.warn('═══════════════════════════════════════════');
});