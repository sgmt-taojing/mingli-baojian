// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — sync-api.js
// ═══════════════════════════════════════════════════════════════

// Mock security.js (which re-exports security-v2.js)
jest.mock('../../server/security.js', () => {
  const actual = jest.requireActual('../../server/security-v2.js');
  return {
    ...actual,
    verifyToken: (token) => {
      if (token === 'valid-token') return { uid: 1 };
      if (token === 'expired-token') return null;
      return null;
    },
    rateLimit: () => true, // 不限流
  };
});

const syncRouter = require('../../server/sync-api.js');

function mockReq(opts = {}) {
  return {
    params: opts.params || {},
    query: opts.query || {},
    headers: opts.headers || {},
    body: opts.body || {},
    get: function(key) { return this.headers[key.toLowerCase()]; },
    ip: '127.0.0.1',
  };
}
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    locals: {},
    status(code) { this.statusCode = code; return this; },
    set(k,v) { this.headers[k]=v; return this; },
    setHeader(k,v) { this.headers[k]=v; return this; },
    json(data) { this.body = data; return this; },
    send(data) { this.body = data; return this; },
    end() { return this; },
  };
  return res;
}

function getRouteHandler(router, method, path) {
  const layer = router.stack.find(l => {
    if (!l.route) return false;
    return l.route.path === path && l.route.methods[method];
  });
  if (!layer) return null;
  const handlers = layer.route.stack;
  return handlers[handlers.length - 1].handle;
}

describe('sync-api.js', () => {
  let router;

  beforeAll(() => { router = syncRouter; });

  describe('路由结构', () => {
    test('包含 /push POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/push' && l.route.methods.post)).toBe(true);
    });
    test('包含 /pull GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/pull' && l.route.methods.get)).toBe(true);
    });
    test('包含 /status GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/status' && l.route.methods.get)).toBe(true);
    });
    test('包含 /merge POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/merge' && l.route.methods.post)).toBe(true);
    });
  });

  describe('认证', () => {
    test('无 token 返回 401', () => {
      // auth 中间件是路由栈第一个 handler
      const statusLayer = router.stack.find(l => l.route && l.route.path === '/status' && l.route.methods.get);
      const authHandler = statusLayer.route.stack[0].handle;
      const req = mockReq({ headers: {} });
      const res = mockRes();
      authHandler(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('未登录');
    });

    test('过期 token 返回 401', () => {
      const statusLayer = router.stack.find(l => l.route && l.route.path === '/status' && l.route.methods.get);
      const authHandler = statusLayer.route.stack[0].handle;
      const req = mockReq({ headers: { authorization: 'Bearer expired-token' } });
      const res = mockRes();
      authHandler(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('登录已过期');
    });
  });

  describe('GET /status', () => {
    test('有效 token 返回同步状态', () => {
      const handler = getRouteHandler(router, 'get', '/status');
      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      req.userId = 1; // 模拟 auth 中间件设置
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('timestamps');
    });
  });

  describe('POST /push', () => {
    test('有效 token 上传数据', () => {
      const handler = getRouteHandler(router, 'post', '/push');
      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { bazi: { year: 1990 }, preferences: { theme: 'dark' } },
      });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('savedKeys');
      expect(res.body.savedKeys).toContain('bazi');
      expect(res.body.savedKeys).toContain('preferences');
    });

    test('空 body 不报错', () => {
      const handler = getRouteHandler(router, 'post', '/push');
      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: {},
      });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    test('自定义字段也被存储', () => {
      const handler = getRouteHandler(router, 'post', '/push');
      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { customField: 'test' },
      });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.savedKeys).toContain('customField');
    });
  });

  describe('GET /pull', () => {
    test('有效 token 拉取数据', () => {
      const handler = getRouteHandler(router, 'get', '/pull');
      const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('version');
    });
  });

  describe('POST /merge', () => {
    test('客户端新数据被保存', () => {
      const handler = getRouteHandler(router, 'post', '/merge');
      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: {
          data: { newMergeField: { value: 123 } },
          timestamps: {},
        },
      });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      // clientNewer 可能包含 newMergeField
      expect(res.body).toHaveProperty('clientNewer');
    });

    test('空 data 不报错', () => {
      const handler = getRouteHandler(router, 'post', '/merge');
      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { data: {}, timestamps: {} },
      });
      req.userId = 1;
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
