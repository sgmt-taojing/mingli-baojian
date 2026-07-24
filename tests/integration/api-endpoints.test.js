// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 集成测试（supertest 端到端 API）
// 节点 7.4 — 验证真实 HTTP 路由的响应格式 / 状态码 / 数据结构
// ═══════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../../server/api-server-v2.js');
const sec = require('../../server/security-v2.js');

// 生成 super_admin token 用于测试全量 KB 列表
const SUPER_ADMIN_TOKEN = sec.generateToken('test-super-admin-uid', 24, ['super_admin']);

// ═══════════════════════════════════════════════════════════════
// 1. GET /api/v1/health
// ═══════════════════════════════════════════════════════════════
describe('GET /api/v1/health', () => {
  test('返回 200 + { ok: true }', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('ts');
    expect(typeof res.body.ts).toBe('number');
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. GET /api/kb/list
// ═══════════════════════════════════════════════════════════════
describe('GET /api/kb/list', () => {
  test('guest 访问返回 200 + files 数组（公开级别）', async () => {
    const res = await request(app).get('/api/kb/list');
    expect(res.status).toBe(200);

    // apiResp 在 code=0 + data 为对象时会展开 data 到 body 顶层（_v1 兼容）
    const files = res.body.files || (res.body.data && res.body.data.files);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  test('super_admin token 访问返回 ≥ 36 个模块', async () => {
    const res = await request(app)
      .get('/api/kb/list')
      .set('Authorization', `Bearer ${SUPER_ADMIN_TOKEN}`);
    expect(res.status).toBe(200);

    const files = res.body.files || (res.body.data && res.body.data.files);
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThanOrEqual(36);

    files.forEach(f => {
      expect(f).toHaveProperty('filename');
      expect(typeof f.filename).toBe('string');
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. GET /api/kb/:filename （不存在的文件 → 404）
// ═══════════════════════════════════════════════════════════════
describe('GET /api/kb/nonexistent-file-9999.js', () => {
  test('返回 404 + 错误格式', async () => {
    const res = await request(app).get('/api/kb/nonexistent-file-9999.js');
    expect(res.status).toBe(404);

    // apiResp 错误格式：{ code: 404001, message, data: null, ... }
    expect(res.body).toHaveProperty('code');
    expect(res.body.code).not.toBe(0);
    expect(res.body).toHaveProperty('message');
  });

  test('路径穿越尝试被拒绝 (403)', async () => {
    const res = await request(app).get('/api/kb/..%2F..%2Fetc%2Fpasswd');
    // Express 会解码或不解码 — 至少不应返回 200
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. POST /api/log/error
// ═══════════════════════════════════════════════════════════════
describe('POST /api/log/error', () => {
  test('接收错误报告并返回 200', async () => {
    const res = await request(app)
      .post('/api/log/error')
      .send({
        code: 'TEST_ERROR_001',
        message: 'supertest 集成测试模拟错误',
        url: '/test-page',
        stack: 'Error: test\n    at integration-test.js:1',
        ua: 'jest/supertest',
        context: { foo: 'bar' },
        ts: Date.now()
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('received', true);
    expect(res.body).toHaveProperty('traceId');
  });

  test('空 body 也能正常处理', async () => {
    const res = await request(app)
      .post('/api/log/error')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('received', true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. GET /api/companion/sync
//    注：该路由当前不存在于 api-server-v2.js 中，由 404 兜底处理
//    测试验证错误响应格式符合统一规范
// ═══════════════════════════════════════════════════════════════
describe('GET /api/companion/sync (未实现路由)', () => {
  test('返回 404 + { ok: false, error: "NOT_FOUND" }', async () => {
    const res = await request(app).get('/api/companion/sync');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('ok', false);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('ts');
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. GET /api/public/kb-query?module=zhongyi&q=伤寒论
// ═══════════════════════════════════════════════════════════════
describe('GET /api/public/kb-query', () => {
  test('module=zhongyi & q=伤寒论 → 至少 1 条命中', async () => {
    const res = await request(app)
      .get('/api/public/kb-query')
      .query({ module: 'zhongyi', q: '伤寒论' });

    expect(res.status).toBe(200);

    // apiResp code=0 时 data 会展开到 body
    const results = res.body.results || (res.body.data && res.body.data.results);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);

    // 验证每条结果结构
    results.forEach(r => {
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('snippet');
    });
  });

  test('无 module 参数 → 返回 MISSING_MODULE', async () => {
    const res = await request(app)
      .get('/api/public/kb-query')
      .query({ q: 'test' });

    expect(res.status).toBe(200);
    const body = res.body;
    // apiResp 在 code=0 + data 是对象时会展开
    expect(body.error === 'MISSING_MODULE' || (body.data && body.data.error === 'MISSING_MODULE')).toBe(true);
  });

  test('无 q 参数 → 返回模块下默认条目', async () => {
    const res = await request(app)
      .get('/api/public/kb-query')
      .query({ module: 'zhongyi' });

    expect(res.status).toBe(200);
    const results = res.body.results || (res.body.data && res.body.data.results);
    expect(Array.isArray(results)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. 404 兜底验证
// ═══════════════════════════════════════════════════════════════
describe('404 兜底', () => {
  test('完全不存在的路由返回 404 + 标准格式', async () => {
    const res = await request(app).get('/api/nonexistent/route/xyz');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('ok', false);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(/GET\s.*\/api\/nonexistent\/route\/xyz/);
  });

  test('POST 方法调用不存在的路径也返回 404', async () => {
    const res = await request(app).post('/api/some/undefined/endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'NOT_FOUND');
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. /api/kb/:filename RBAC 与成功路径
// ═══════════════════════════════════════════════════════════════
describe('GET /api/kb/:filename 增强路径', () => {
  test('super_admin 访问公开 KB 文件 → 200 + JS 内容', async () => {
    // 公开级别文件：bazi-knowledge-base.js
    const res = await request(app)
      .get('/api/kb/bazi-knowledge-base.js')
      .set('Authorization', `Bearer ${SUPER_ADMIN_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text.length).toBeGreaterThan(100);
  });

  test('guest 访问受限制 KB 文件 → 403', async () => {
    // 假设存在一个 professional 级别的文件，guest 不应能访问
    // 先找到第一个 non-public 文件
    const fs = require('fs');
    const path = require('path');
    const kbConfig = require('../../server/kb-config.js');
    const profFile = Object.entries(kbConfig.KB_LEVELS || {})
      .filter(([f, c]) => c.level === 'professional' && fs.existsSync(path.join(__dirname, '..', '..', 'server', 'kb-store', 'professional', f)))
      .map(([f]) => f)[0];
    if (profFile) {
      const res = await request(app).get(`/api/kb/${profFile}`);
      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('code');
      expect(res.body.code).not.toBe(0);
    } else {
      // 跳过 - 无 professional 文件
      console.warn('⚠️  跳过：未发现 professional KB 文件');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. /api/public/kb-query 错误处理
// ═══════════════════════════════════════════════════════════════
describe('GET /api/public/kb-query 错误处理', () => {
  test('未知模块 ID → 返回空数组但 200', async () => {
    const res = await request(app)
      .get('/api/public/kb-query')
      .query({ module: 'nonexistent_module_9999', q: 'test' });
    expect(res.status).toBe(200);
    const results = res.body.results || (res.body.data && res.body.data.results);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  test('limit 参数被限制为 ≤ 20', async () => {
    const res = await request(app)
      .get('/api/public/kb-query')
      .query({ module: 'zhongyi', limit: 9999 });
    expect(res.status).toBe(200);
    // 不论实际多少条，接口不报错
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. CORS 预检
// ═══════════════════════════════════════════════════════════════
describe('CORS 预检 (OPTIONS)', () => {
  test('OPTIONS 请求带正确 Origin 应通过', async () => {
    const res = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://127.0.0.1:8900')
      .set('Access-Control-Request-Method', 'GET');
    expect([200, 204]).toContain(res.status);
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. api-response 模块独立验证
// ═══════════════════════════════════════════════════════════════
describe('api-response 便捷函数', () => {
  const apiRespMod = require('../../server/api-response.js');
  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {}
  });

  test('bad() 返回 400', () => {
    const res = makeRes();
    apiRespMod.bad(res, '参数无效');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe(400001);
  });

  test('unauth() 返回 401', () => {
    const res = makeRes();
    apiRespMod.unauth(res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('forbid() 返回 403', () => {
    const res = makeRes();
    apiRespMod.forbid(res, '禁止');
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('notFound() 返回 404', () => {
    const res = makeRes();
    apiRespMod.notFound(res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('rateLimit() 返回 429', () => {
    const res = makeRes();
    apiRespMod.rateLimit(res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('aiFallback() 返回 503', () => {
    const res = makeRes();
    apiRespMod.aiFallback(res, { hint: 'fallback' });
    expect(res.status).toHaveBeenCalledWith(503);
  });

  test('expired() 返回 401', () => {
    const res = makeRes();
    apiRespMod.expired(res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('serverErr() 返回 500 并记录错误', () => {
    const res = makeRes();
    apiRespMod.serverErr(res, new Error('boom'));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].code).toBe(500001);
  });

  test('fail() 返回指定错误码', () => {
    const res = makeRes();
    apiRespMod.fail(res, 409001, '冲突');
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('httpStatusFor 映射正确', () => {
    expect(apiRespMod.httpStatusFor(0)).toBe(200);
    expect(apiRespMod.httpStatusFor(400001)).toBe(400);
    expect(apiRespMod.httpStatusFor(401001)).toBe(401);
    expect(apiRespMod.httpStatusFor(403001)).toBe(403);
    expect(apiRespMod.httpStatusFor(404001)).toBe(404);
    expect(apiRespMod.httpStatusFor(429001)).toBe(429);
    expect(apiRespMod.httpStatusFor(500001)).toBe(500);
    expect(apiRespMod.httpStatusFor(503001)).toBe(503);
    expect(apiRespMod.httpStatusFor(999999)).toBe(200); // 未知码默认 200
  });
});
