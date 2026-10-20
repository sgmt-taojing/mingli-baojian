#!/usr/bin/env node
// openapi-generate.js — 从 api-server-v2.js 路由自动生成 OpenAPI 3.0 spec (R30-C)
//
// 做法：
//   1. 正则扫描 server/api-server-v2.js 里的 app.get/post/put/patch/delete(...)
//   2. 对每条路由抽出 method + path + middlewares
//   3. 根据路径前缀/关键字给路由打 tag
//   4. 输出 docs/openapi.json + docs/openapi.html（Swagger UI）+ 报告

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const API_FILE = path.join(ROOT, 'server/api-server-v2.js');
const OUT_JSON = path.join(ROOT, 'docs/openapi.json');
const OUT_HTML = path.join(ROOT, 'docs/openapi.html');
const OUT_REPORT = path.join(ROOT, 'audit/platform-knowledge/openapi-report.md');

function scanRoutes(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  // 兼容 app.get(...) / app.post(...) / app.get('/xxx', ...)
  // 用更稳的正则：捕捉 method 和 path 第一参
  const re = /app\.(get|post|put|patch|delete)\(\s*(['"`])([^'"`]+)\2/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [, method, _, p] = m;
    routes.push({ method: method.toUpperCase(), path: p });
  }
  return routes;
}

// 基于路径前缀/关键字打 tag
function getPathTags(pathname) {
  const p = pathname.replace(/^\/api\/v1\//, '/api/');
  if (p.includes('/admin') || p.includes('/kb-manager')) return 'Admin';
  if (p.startsWith('/api/ai')) return 'AI';
  if (p.includes('/public/kb')) return 'Public';
  if (p.startsWith('/api/public')) return 'Public';
  if (p.startsWith('/api/user') || p.includes('/user/')) return 'User';
  if (p.startsWith('/api/paipan')) return 'Paipan';
  if (p.startsWith('/api/yuanzhu')) return 'Yuanzhu';
  if (p.startsWith('/api/glass')) return 'Glass/智镜';
  if (p.startsWith('/api/camera')) return 'Camera';
  if (p.startsWith('/api/face') || p.startsWith('/api/ocr')) return 'Vision';
  if (p.includes('/clinic')) return 'Clinic';
  if (p.startsWith('/api/shop') || p.includes('/order') || p.includes('/merchant')) return 'Shop';
  if (p.startsWith('/api/voices') || p.includes('/tts')) return 'TTS';
  if (p.startsWith('/api/cron')) return 'Cron';
  if (p.startsWith('/api/sse')) return 'SSE';
  if (p.startsWith('/api/ws')) return 'WebSocket';
  if (p.startsWith('/api/health')) return 'Health';
  if (p.includes('/privacy')) return 'Privacy';
  if (p.includes('/kb/')) return 'KB';
  if (p.includes('/courses')) return 'Courses';
  if (p.includes('/feedback')) return 'Feedback';
  if (p.includes('/push')) return 'Push';
  if (p.includes('/distill') || p.includes('/export') || p.includes('/sync')) return 'Admin';
  return 'General';
}

function pathToOpenApi(path) {
  // /api/clinic/cases/:id → /api/clinic/cases/{id}
  return path.replace(/:([A-Za-z_][A-Za-z_0-9]*)/g, '{$1}');
}

function buildSpec(routes) {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: '命理宝鉴 API',
      version: '2.0.0',
      description: '命理宝鉴 (mingli-baojian) 后端 API，自动从源码生成',
    },
    servers: [
      { url: 'http://127.0.0.1:8920', description: '本地开发' },
      { url: 'https://api.sgmt-taojing.com', description: '生产（待部署）' },
    ],
    paths: {},
  };

  for (const r of routes) {
    const opPath = pathToOpenApi(r.path);
    if (!spec.paths[opPath]) spec.paths[opPath] = {};
    const tag = getPathTags(r.path);
    spec.paths[opPath][r.method.toLowerCase()] = {
      tags: [tag],
      summary: `${r.method} ${r.path}`,
      description: `自动生成 — ${r.method} ${r.path}`,
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
        400: { description: 'Bad Request' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden' },
        404: { description: 'Not Found' },
      },
    };
  }
  return spec;
}

function renderHtml(spec) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>命理宝鉴 API 文档</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
    .topbar { background: #2c3e50; color: white; padding: 12px 24px; font-size: 20px; }
    #swagger-ui { max-width: 1400px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="topbar">📜 命理宝鉴 API · v${spec.info.version}</div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: 'openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: SwaggerUIBundle.presets.apis,
      });
    };
  </script>
</body>
</html>`;
}

function renderReport(spec) {
  const fromSpec = Object.keys(spec.paths);
  const tagCount = {};
  for (const p of fromSpec) {
    for (const m of Object.keys(spec.paths[p])) {
      const t = spec.paths[p][m].tags?.[0] || 'General';
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  const sorted = Object.entries(tagCount).sort((a, b) => b[1] - a[1]);

  let md = `# OpenAPI 自动生成报告\n\n`;
  md += `生成时间：${new Date().toISOString()}\n\n`;
  md += `**总路由数**：${fromSpec.length}\n\n`;
  md += `**路径标签分布**：\n\n`;
  md += `| 标签 | 路由数 |\n|------|--------|\n`;
  for (const [t, n] of sorted) md += `| ${t} | ${n} |\n`;
  md += `\n---\n\n`;
  md += `## 访问入口\n\n`;
  md += `- JSON: \`/api/openapi.json\`\n`;
  md += `- HTML: \`/api/openapi.html\`\n`;
  md += `- 本地: <http://127.0.0.1:8920/api/openapi.html>\n`;
  return md;
}

// === main ===
const routes = scanRoutes(API_FILE);
const spec = buildSpec(routes);

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(spec, null, 2));

const html = renderHtml(spec);
fs.writeFileSync(OUT_HTML, html);

fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
fs.writeFileSync(OUT_REPORT, renderReport(spec));

const tagCount = {};
for (const p of Object.keys(spec.paths)) {
  for (const m of Object.keys(spec.paths[p])) {
    const t = spec.paths[p][m].tags?.[0] || 'General';
    tagCount[t] = (tagCount[t] || 0) + 1;
  }
}
const tagNum = Object.keys(tagCount).length;

console.log(`✅ OpenAPI 3.0 spec written to ${path.relative(ROOT, OUT_JSON)}`);
console.log(`✅ Swagger UI written to ${path.relative(ROOT, OUT_HTML)}`);
console.log(`✅ Report written to ${path.relative(ROOT, OUT_REPORT)}`);
console.log(`📊 Stats: ${Object.keys(spec.paths).length} routes, ${tagNum} tags`);
