// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Pact 消费者契约测试 (PactV3)
// 覆盖 API:
//   1. GET /api/v1/health        — 健康检查
//   2. GET /api/kb/list          — KB 文件列表
//   3. GET /api/kb/:filename     — 模块知识查询
//   4. GET /api/v1/kb/list       — v1 alias 308 重定向
// ═══════════════════════════════════════════════════════════════

const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const path = require('path');
const http = require('http');

const { like, eachLike, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'mingli-baojian-h5',
  provider: 'mingli-baojian-api',
  dir: path.resolve(__dirname, '../../pacts'),
  logLevel: 'error',
});

/** 轻量 GET 客户端 */
function get(port, reqPath, accept) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: reqPath,
        headers: accept ? { Accept: accept } : {},
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { /* keep raw */ }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed || data });
        });
      }
    );
    req.on('error', reject);
  });
}

// ── 1. GET /api/v1/health ──────────────────────────────────────
describe('Pact 契约 · GET /api/v1/health', () => {
  test('返回 200 + { ok: true, ts: number, v1: true }', async () => {
    await provider
      .given('服务正常运行')
      .uponReceiving('a health check request')
      .withRequest({
        method: 'GET',
        path: '/api/v1/health',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          ok: true,
          ts: integer(1700000000000),
          v1: true,
        },
      })
      .executeTest(async (mockServer) => {
        const res = await get(mockServer.port, '/api/v1/health', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.v1).toBe(true);
        expect(typeof res.body.ts).toBe('number');
      });
  });
});

// ── 2. GET /api/kb/list ────────────────────────────────────────
describe('Pact 契约 · GET /api/kb/list', () => {
  test('返回 200 + code=0 + files 数组', async () => {
    await provider
      .given('KB 文件存在')
      .uponReceiving('a request for KB file list')
      .withRequest({
        method: 'GET',
        path: '/api/kb/list',
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          code: 0,
          message: 'ok',
          data: {
            files: eachLike({
              filename: like('nihaisha-wuxing.js'),
              level: like('public'),
              desc: like('五行知识'),
            }),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const res = await get(mockServer.port, '/api/kb/list', 'application/json');
        expect(res.status).toBe(200);
        expect(res.body.code).toBe(0);
        expect(Array.isArray(res.body.data.files)).toBe(true);
        expect(res.body.data.files.length).toBeGreaterThan(0);
        expect(res.body.data.files[0]).toHaveProperty('filename');
        expect(res.body.data.files[0]).toHaveProperty('level');
      });
  });
});

// ── 3. GET /api/kb/:filename ───────────────────────────────────
describe('Pact 契约 · GET /api/kb/:filename', () => {
  test('返回 200 + application/javascript 内容', async () => {
    await provider
      .given('KB 模块文件存在')
      .uponReceiving('a request for a specific KB module file')
      .withRequest({
        method: 'GET',
        path: '/api/kb/nihaisha-wuxing.js',
        headers: { Accept: 'application/javascript' },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'public, max-age=3600',
        },
        body: '// KB content placeholder',
      })
      .executeTest(async (mockServer) => {
        const res = await get(mockServer.port, '/api/kb/nihaisha-wuxing.js', 'application/javascript');
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('javascript');
        expect(typeof res.body).toBe('string');
        expect(res.body.length).toBeGreaterThan(0);
      });
  });
});

// ── 4. GET /api/v1/kb/list (308 重定向) ────────────────────────
describe('Pact 契约 · GET /api/v1/kb/list (v1 alias)', () => {
  test('v1 alias 返回 308 重定向到 /api/kb/list', async () => {
    await provider
      .given('v1 alias 已注册')
      .uponReceiving('a v1 alias request that should redirect')
      .withRequest({
        method: 'GET',
        path: '/api/v1/kb/list',
      })
      .willRespondWith({
        status: 308,
        headers: {
          Location: '/api/kb/list',
        },
      })
      .executeTest(async (mockServer) => {
        const res = await get(mockServer.port, '/api/v1/kb/list');
        expect(res.status).toBe(308);
        expect(res.headers.location).toBe('/api/kb/list');
      });
  });
});
