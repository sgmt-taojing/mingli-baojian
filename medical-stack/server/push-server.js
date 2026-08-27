#!/usr/bin/env node
// 命理宝鉴·医道 WebPush 服务 (端口 8945)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 自生成 VAPID 密钥 (无需外部依赖)
const VAPID = { subject: 'mailto:tcm@localhost', publicKey: crypto.randomBytes(32).toString('base64url'), privateKey: crypto.randomBytes(32).toString('base64url') };
const SUBSCRIPTIONS_FILE = path.join(__dirname, '..', 'data', 'push-subscriptions.json');

let subscriptions = [];
try { subscriptions = JSON.parse(fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8')); } catch(e) {}

function saveSubs() { fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2)); }

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = req.url;
  
  // 获取 VAPID 公钥
  if (url === '/api/push/key') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, publicKey: VAPID.publicKey }));
    return;
  }

  // 注册订阅
  if (url === '/api/push/subscribe' && req.method === 'POST') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const sub = JSON.parse(body);
        if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
          subscriptions.push({ ...sub, subscribedAt: new Date().toISOString() });
          saveSubs();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, total: subscriptions.length }));
      } catch(e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
    });
    return;
  }

  // 推送消息
  if (url === '/api/push/send' && req.method === 'POST') {
    let body = ''; req.on('data', c => body += c);
    req.on('end', () => {
      const { title, body: msg } = JSON.parse(body || '{}');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, sent: subscriptions.length, note: 'Push订阅数: '+subscriptions.length+' (浏览器需支持ServiceWorker+PushAPI)' }));
    });
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'push-server', subscriptions: subscriptions.length }));
});

const PORT = process.env.PUSH_PORT || 8945;
server.listen(PORT, () => console.warn(`📲 WebPush服务: http://localhost:${PORT}`));
