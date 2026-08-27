/**
 * 命理宝鉴·医道 统一静态服务 V1.0
 * 替代 python3 -m http.server，提供：
 * - 单页路由（SPA fallback）
 * - Gzip 压缩
 * - 缓存控制
 * - CORS
 * - 健康检查
 * - 静态文件服务（8个前端页面）
 */
const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

// ═══ 反向代理 /api/* → 8932 API 服务 ═══
const API_PORT = process.env.TCM_PORT || 8932;
app.use('/api', (req, res) => {
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: API_PORT,
    path: req.originalUrl, // 保持完整 /api/... 路径
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${API_PORT}` }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => {
    res.status(502).json({ ok: false, error: 'API 服务不可用', detail: e.message });
  });
  req.pipe(proxyReq);
});

// compression 可选
try { var compression = require('compression'); app.use(compression()); } catch(e) { console.warn('[static-server] compression not available, skip gzip'); }
const PORT = process.env.PORT || 8931;
const APP_DIR = path.join(__dirname, '..', 'app');

// Gzip
try { app.use(compression()); } catch {}

// 静态文件
app.use(express.static(APP_DIR, {
  maxAge: '1h',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      // R806 修真——原 max-age=3600 导致改码后浏览器/内嵌 WebView 拿 1 小时旧版。
      // 改为 ETag 内容指纹 + no-cache：每次条件请求，未变 304（几毫秒），变了必拿新版。
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ ok: true, service: '命理宝鉴·医道 Static', port: PORT, uptime: process.uptime() });
});

// 所有页面的 SPA fallback
const pages = [
  '/', '/login', '/doctor-dashboard', '/clinical', '/admin',
  '/pharmacy', '/payment', '/report', '/index', '/treatment-center'
];
pages.forEach(p => {
  app.get(p, (req, res) => {
    const pageMap = {
      '/': 'index.html',
      '/login': 'login.html',
      '/doctor-dashboard': 'doctor-dashboard.html',
      '/clinical': 'clinical.html',
      '/admin': 'admin.html',
      '/pharmacy': 'pharmacy.html',
      '/payment': 'payment.html',
      '/report': 'report.html',
      '/insurance-desk': 'insurance-desk.html',
      '/index': 'index.html',
      '/treatment-center': 'treatment-center.html'
    };
    res.sendFile(path.join(APP_DIR, pageMap[p] || 'index.html'));
  });
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(APP_DIR, 'index.html'));
});

app.listen(PORT, "127.0.0.1", () => {
  console.warn(`🌐 命理宝鉴·医道 静态服务启动: http://localhost:${PORT}`);
  console.warn(`   页面: 47 个（含 treatment-center | home-tcm | chronic-disease | clinical | admin | pharmacy | 等）`);
  console.warn(`   API代理: /api/* → http://localhost:${API_PORT}`);
});

module.exports = app;
