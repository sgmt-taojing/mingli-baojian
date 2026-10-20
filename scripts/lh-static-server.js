#!/usr/bin/env node
/**
 * LHCI 静态文件服务器（多 ROOT 回退）
 *
 * 启动后服务在 http://127.0.0.1:8914
 *
 * ROOT 优先级：
 *   1. STATIC_ROOT 环境变量（绝对路径）
 *   2. app/ 目录（HTML / CSS / JS / 资源）
 *   3. 项目根（knowledge / knowledge-models / docs / scripts 等）
 *
 * 用途：
 *   - lhci autorun startServerReadyPattern='listening on'
 *   - puppeteer / axe / 业务回归 HTTP 验证
 *   - 端口分配表 PORT_ALLOCATIONS.md（8914 = 静态服务）
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_ROOT = path.join(PROJECT_ROOT, 'app');
const ROOTS = [
  APP_ROOT,
  PROJECT_ROOT,
];
const PORT = parseInt(process.env.PORT || '8914', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.pdf':  'application/pdf',
};

/**
 * 按 ROOT 优先级查找文件
 * 返回: { filePath, root } | null
 */
function resolveFile(urlPath) {
  for (const root of ROOTS) {
    const candidate = path.join(root, urlPath);
    // 防 directory traversal
    if (!candidate.startsWith(root + path.sep) && candidate !== root) continue;
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) return { filePath: candidate, root };
    } catch (_) { /* not exist, try next root */ }
  }
  return null;
}

/** 反代 /api/* → 8920 API 服务（同源避 CORS） */
const API_BACKEND_PORT = parseInt(process.env.API_BACKEND_PORT || '8920', 10);
function proxyApi(req, res) {
  const options = {
    hostname: '127.0.0.1',
    port: API_BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:' + API_BACKEND_PORT },
  };
  const proxy = http.request(options, (upstream) => {
    res.writeHead(upstream.statusCode || 502, upstream.headers);
    upstream.pipe(res);
  });
  proxy.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'BAD_GATEWAY', message: e.message }));
  });
  req.pipe(proxy);
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // 反代 /api/* 到 8920
  if (urlPath.startsWith('/api/')) {
    return proxyApi(req, res);
  }

  if (urlPath === '/') urlPath = '/index.html';

  // 简单安全：拒绝 ..
  if (urlPath.includes('..')) {
    res.writeHead(403);
    return res.end('forbidden');
  }

  const found = resolveFile(urlPath);
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(`not found: ${urlPath}`);
  }

  fs.readFile(found.filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('read error: ' + err.message);
    }
    const ext = path.extname(found.filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'X-Served-From': path.basename(found.root),
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  // 输出格式：lhci startServerReadyPattern='listening on'
  console.log(`listening on http://127.0.0.1:${PORT}`);
  console.log(`  ROOT 1: ${APP_ROOT}`);
  console.log(`  ROOT 2: ${PROJECT_ROOT}`);
});