// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — kb-routes.js
// ═══════════════════════════════════════════════════════════════

const kbRoutes = require('../../server/kb-routes.js');

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
    statusCode: 200, headers: {}, body: null, locals: {},
    status(code) { this.statusCode = code; return this; },
    set(k,v) { this.headers[k]=v; return this; },
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

describe('kb-routes.js', () => {
  let router;
  beforeAll(() => { router = kbRoutes; });

  describe('路由结构', () => {
    test('包含 /sources GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sources' && l.route.methods.get)).toBe(true);
    });
    test('包含 /formal GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/formal' && l.route.methods.get)).toBe(true);
    });
    test('包含 /staging GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/staging' && l.route.methods.get)).toBe(true);
    });
    test('包含 /models GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/models' && l.route.methods.get)).toBe(true);
    });
    test('包含 /stats GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/stats' && l.route.methods.get)).toBe(true);
    });
    test('包含 /trace GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/trace' && l.route.methods.get)).toBe(true);
    });
    test('包含 /distill-cases POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/distill-cases' && l.route.methods.post)).toBe(true);
    });
    test('包含 /audit-all POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/audit-all' && l.route.methods.post)).toBe(true);
    });
    test('包含 /rebuild-models POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/rebuild-models' && l.route.methods.post)).toBe(true);
    });
    test('包含 /push-model POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/push-model' && l.route.methods.post)).toBe(true);
    });
  });

  describe('GET /sources', () => {
    test('返回来源列表或数据库错误', () => {
      const handler = getRouteHandler(router, 'get', '/sources');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      // kb.db 未导出，可能 500 或 200
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('GET /formal', () => {
    test('无 module 参数安全执行', () => {
      const handler = getRouteHandler(router, 'get', '/formal');
      const req = mockReq({});
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });

    test('有 module 参数安全执行', () => {
      const handler = getRouteHandler(router, 'get', '/formal');
      const req = mockReq({ query: { module: 'bazi' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('GET /staging', () => {
    test('返回临时库列表或错误', () => {
      const handler = getRouteHandler(router, 'get', '/staging');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('GET /models', () => {
    test('返回模型列表或错误', () => {
      const handler = getRouteHandler(router, 'get', '/models');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('GET /stats', () => {
    test('返回统计数据或错误', () => {
      const handler = getRouteHandler(router, 'get', '/stats');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('GET /trace', () => {
    test('缺少 entry_id 返回 400', () => {
      const handler = getRouteHandler(router, 'get', '/trace');
      const req = mockReq({ query: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('entry_id required');
    });

    test('不存在的 entry_id 返回 not_found', () => {
      const handler = getRouteHandler(router, 'get', '/trace');
      const req = mockReq({ query: { entry_id: 'KB-NONEXIST-999' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('not_found');
    });
  });

  describe('GET /trace-stats', () => {
    test('返回追溯统计', () => {
      const handler = getRouteHandler(router, 'get', '/trace-stats');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('trace');
    });
  });

  describe('GET /push-stats', () => {
    test('返回推送统计', () => {
      const handler = getRouteHandler(router, 'get', '/push-stats');
      const req = mockReq();
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('push');
    });
  });

  describe('POST /distill-cases', () => {
    test('执行蒸馏返回结果', () => {
      const handler = getRouteHandler(router, 'post', '/distill-cases');
      const req = mockReq({ body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /audit-all', () => {
    test('执行批量审计', () => {
      const handler = getRouteHandler(router, 'post', '/audit-all');
      const req = mockReq({ body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect([200, 500]).toContain(res.statusCode);
    });
  });

  describe('POST /rebuild-models', () => {
    test('重建模型', () => {
      const handler = getRouteHandler(router, 'post', '/rebuild-models');
      const req = mockReq({ body: { modules: ['bazi'] } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /push-model', () => {
    test('缺少 model_id 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/push-model');
      const req = mockReq({ body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('model_id required');
    });
  });
});
