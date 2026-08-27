#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════
 *  ota-server.js — OTA 空中升级源服务（R750）
 *  端口：8952（8950 属 ai-vision-toolkit 主服务，18:06 重启时抢占引发双服务冲突，改 8952）
 *
 *  能力：
 *   1. GET /manifest.json      — 升级清单（客户端 OtaUpgrader.check 读取）
 *   2. GET /packages/:name     — 升级包内容（kb-patch / rule-update）
 *   3. POST /admin/publish     — 发布新包（签名+版本号+类型）
 *   4. GET /admin/packages     — 已发布包列表
 *   5. GET /health             — 健康检查
 *
 *  安全：
 *   - 包内容 SHA-256 计算并写入 manifest（客户端校验完整性）
 *   - admin 接口需 X-Admin-Token 头（简单网关级防护，正式环境换 JWT）
 *   - 版本号防降级（同名校验，客户端也有一层）
 *
 *  启动：node server/ota-server.js
 *  launchd：~/Library/LaunchAgents/com.tcm-agent.ota.plist
 * ═══════════════════════════════════════════════════════════════
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8952;
const ADMIN_TOKEN = process.env.OTA_ADMIN_TOKEN || 'tcm-ota-local-dev';
const PKG_DIR = path.join(__dirname, '..', 'data', 'ota-packages');
const MANIFEST_PATH = path.join(PKG_DIR, 'manifest.json');

// ── 存储 ──
function ensureDirs() {
  fs.mkdirSync(PKG_DIR, { recursive: true });
  if (!fs.existsSync(MANIFEST_PATH)) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ version: 1, updated_at: new Date().toISOString(), packages: [] }, null, 2));
  }
}

function readManifest() {
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); }
  catch (_) { return { version: 1, updated_at: null, packages: [] }; }
}

function writeManifest(m) {
  m.updated_at = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
  return m;
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// ── 请求工具 ──
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5 * 1024 * 1024) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  const body = JSON.stringify(obj, null, 1);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

// ── 路由 ──
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORT);
  const p = url.pathname;
  try {
    // CORS 预检
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token' });
      return res.end();
    }

    // GET /health
    if (p === '/health') {
      const m = readManifest();
      return send(res, 200, { ok: true, service: 'tcm-ota-server', port: PORT, packages: m.packages.length, updated_at: m.updated_at });
    }

    // GET /manifest.json
    if (p === '/manifest.json') {
      return send(res, 200, readManifest());
    }

    // GET /packages/:name
    if (p.startsWith('/packages/')) {
      const name = path.basename(p.split('/')[2]);
      const file = path.join(PKG_DIR, name + '.json');
      if (!fs.existsSync(file)) return send(res, 404, { ok: false, error: 'package_not_found' });
      const content = fs.readFileSync(file, 'utf8');
      // R751 修真：包体响应补 CORS 头（跨端口 fetch 需要）
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      return res.end(content);
    }

    // POST /admin/publish
    if (p === '/admin/publish' && req.method === 'POST') {
      if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return send(res, 403, { ok: false, error: 'forbidden' });
      const body = JSON.parse(await readBody(req) || '{}');
      if (!body.name || !body.version || !body.type || !body.content) return send(res, 400, { ok: false, error: 'name/version/type/content 必填' });
      if (!['kb-patch', 'rule-update', 'model-delta', 'full-image'].includes(body.type)) return send(res, 400, { ok: false, error: 'type 非法' });

      // 内容序列化 + 写包文件（包内容 = {meta, payload}）
      const pkgFile = {
        meta: { name: body.name, version: body.version, type: body.type, published_at: new Date().toISOString() },
        payload: typeof body.content === 'string' ? JSON.parse(body.content) : body.content
      };
      const pkgPath = path.join(PKG_DIR, body.name + '.json');
      const pkgStr = JSON.stringify(pkgFile, null, 1);
      fs.writeFileSync(pkgPath, pkgStr);
      // R750 修真：SHA-256 基于最终写入文件的字节（客户端下载的就是这个）
      const hash = sha256(pkgStr);

      // 更新 manifest（防降级：仅拒绝更低版本；同版本允许覆盖重发）
      const m = readManifest();
      const existing = m.packages.find(x => x.name === body.name);
      if (existing && cmpVersion(body.version, existing.version) < 0) {
        return send(res, 409, { ok: false, error: 'version_not_newer', current: existing.version });
      }
      if (existing) m.packages = m.packages.filter(x => x.name !== body.name);
      m.packages.unshift({
        name: body.name, version: body.version, type: body.type,
        url: 'http://localhost:' + PORT + '/packages/' + body.name,
        sha256: hash, published_at: new Date().toISOString()
      });
      writeManifest(m);
      return send(res, 200, { ok: true, package: m.packages[0], sha256: hash });
    }

    // GET /admin/packages
    if (p === '/admin/packages') {
      if (req.headers['x-admin-token'] !== ADMIN_TOKEN) return send(res, 403, { ok: false, error: 'forbidden' });
      return send(res, 200, { ok: true, packages: readManifest().packages });
    }

    send(res, 404, { ok: false, error: 'not_found' });
  } catch (e) {
    send(res, 500, { ok: false, error: String(e.message || e).slice(0, 120) });
  }
});

function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0, y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}

ensureDirs();
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[ota-server] 已启动 :${PORT}（manifest: ${readManifest().packages.length} 个包）`);
});
