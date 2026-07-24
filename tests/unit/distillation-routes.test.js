// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — distillation-routes.js
// ═══════════════════════════════════════════════════════════════

// Mock rbac-middleware
jest.mock('../../server/rbac-middleware.js', () => {
  const actual = jest.requireActual('../../server/rbac-middleware.js');
  return {
    ...actual,
    requirePermission: () => (req, res, next) => {
      req.userRoles = ['master', 'admin_b'];
      req.userId = 1;
      next();
    },
  };
});

// Mock security-v2 decrypt
jest.mock('../../server/security-v2.js', () => {
  const actual = jest.requireActual('../../server/security-v2.js');
  return {
    ...actual,
    decrypt: (text) => { try { return actual.decrypt(text); } catch(e) { return text || ''; } },
  };
});

const distillationRoutes = require('../../server/distillation-routes.js');

function mockReq(opts = {}) {
  return {
    params: opts.params || {},
    query: opts.query || {},
    headers: opts.headers || {},
    body: opts.body || {},
    userRoles: opts.userRoles || ['master'],
    userId: opts.userId || 1,
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

describe('distillation-routes.js', () => {
  let router;
  beforeAll(() => { router = distillationRoutes; });

  describe('路由结构', () => {
    test('包含 /scan POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/scan' && l.route.methods.post)).toBe(true);
    });
    test('包含 /extract POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/extract' && l.route.methods.post)).toBe(true);
    });
    test('包含 /validate POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/validate' && l.route.methods.post)).toBe(true);
    });
    test('包含 /apply POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/apply' && l.route.methods.post)).toBe(true);
    });
    test('包含 /run POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/run' && l.route.methods.post)).toBe(true);
    });
    test('包含 /batches GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/batches' && l.route.methods.get)).toBe(true);
    });
    test('包含 /batch/:id GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/batch/:id' && l.route.methods.get)).toBe(true);
    });
    test('包含 /kb-versions GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/kb-versions' && l.route.methods.get)).toBe(true);
    });
    test('包含 /stats GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/stats' && l.route.methods.get)).toBe(true);
    });
    test('包含 /quality-stats GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/quality-stats' && l.route.methods.get)).toBe(true);
    });
    test('包含 /score/:caseId POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/score/:caseId' && l.route.methods.post)).toBe(true);
    });
    test('包含 /score-all POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/score-all' && l.route.methods.post)).toBe(true);
    });
  });

  describe('POST /scan', () => {
    test('返回扫描结果', () => {
      const handler = getRouteHandler(router, 'post', '/scan');
      const req = mockReq({ body: { quality_score: 999, effectiveness: 999 } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.cases)).toBe(true);
    });
  });

  describe('POST /extract', () => {
    test('极高阈值安全执行', () => {
      const handler = getRouteHandler(router, 'post', '/extract');
      const req = mockReq({ body: { quality_score: 999, effectiveness: 999 } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      // 可能 ok=true（有案例）或 ok=false（无案例）
      expect(res.body).toHaveProperty('ok');
    });
  });

  describe('POST /validate', () => {
    test('缺少 batch_id 返回错误', () => {
      const handler = getRouteHandler(router, 'post', '/validate');
      const req = mockReq({ body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });

    test('不存在的 batch_id 返回错误', () => {
      const handler = getRouteHandler(router, 'post', '/validate');
      const req = mockReq({ body: { batch_id: 'DISTILL-NONEXIST-9999' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /apply', () => {
    test('缺少 batch_id 返回错误', () => {
      const handler = getRouteHandler(router, 'post', '/apply');
      const req = mockReq({ body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });

    test('不存在的 batch_id 返回错误', () => {
      const handler = getRouteHandler(router, 'post', '/apply');
      const req = mockReq({ body: { batch_id: 'DISTILL-NONEXIST-9999' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /verify/:batchId', () => {
    test('不存在的批次返回错误', () => {
      const handler = getRouteHandler(router, 'post', '/verify/:batchId');
      const req = mockReq({ params: { batchId: 'DISTILL-NONEXIST-9999' }, body: { approve: true } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /run', () => {
    test('极高阈值安全执行', async () => {
      const handler = getRouteHandler(router, 'post', '/run');
      const req = mockReq({ body: { quality_score: 999, effectiveness: 999 } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /batches', () => {
    test('返回批次列表', () => {
      const handler = getRouteHandler(router, 'get', '/batches');
      const req = mockReq({ query: { limit: '10' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.batches)).toBe(true);
    });
  });

  describe('GET /batch/:id', () => {
    test('不存在的批次返回错误', () => {
      const handler = getRouteHandler(router, 'get', '/batch/:id');
      const req = mockReq({ params: { id: 'DISTILL-NONEXIST-9999' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /kb-versions', () => {
    test('返回版本列表', () => {
      const handler = getRouteHandler(router, 'get', '/kb-versions');
      const req = mockReq({});
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.versions)).toBe(true);
    });
  });

  describe('POST /score/:caseId', () => {
    test('不存在的案例返回结果', () => {
      const handler = getRouteHandler(router, 'post', '/score/:caseId');
      const req = mockReq({ params: { caseId: '999999' } });
      const res = mockRes();
      expect(() => handler(req, res, () => {})).not.toThrow();
    });
  });

  describe('GET /quality-stats', () => {
    test('返回质量统计', () => {
      const handler = getRouteHandler(router, 'get', '/quality-stats');
      const req = mockReq({});
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /follow-up', () => {
    test('返回随访案例列表', () => {
      const handler = getRouteHandler(router, 'get', '/follow-up');
      const req = mockReq({});
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('count');
    });
  });

  describe('GET /stats', () => {
    test('返回蒸馏统计', () => {
      const handler = getRouteHandler(router, 'get', '/stats');
      const req = mockReq({});
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('stats');
    });
  });
});
