// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — export-routes.js
// ═══════════════════════════════════════════════════════════════

// Mock rbac-middleware
jest.mock('../../server/rbac-middleware.js', () => {
  const actual = jest.requireActual('../../server/rbac-middleware.js');
  return {
    ...actual,
    auth: (req, res, next) => {
      req.userId = req.headers?.['x-test-user-id'] ? parseInt(req.headers['x-test-user-id']) : 1;
      req.userRoles = req.headers?.['x-test-roles']?.split(',') || ['free'];
      next();
    },
    adminAuth: (req, res, next) => {
      req.userId = req.headers?.['x-test-user-id'] ? parseInt(req.headers['x-test-user-id']) : 1;
      req.userRoles = req.headers?.['x-test-roles']?.split(',') || ['super_admin'];
      const isAdmin = (req.userRoles || []).includes('super_admin') || (req.userRoles || []).includes('admin_a') || (req.userRoles || []).includes('admin_b');
      if (!isAdmin) return res.status(403).json({ error: 'FORBIDDEN' });
      next();
    },
  };
});

const exportRouter = require('../../server/export-routes.js');

function mockReq(opts = {}) {
  return {
    params: opts.params || {},
    query: opts.query || {},
    headers: opts.headers || {},
    body: opts.body || {},
    userRoles: opts.userRoles || ['free'],
    userId: opts.userId || 1,
    get: function(key) { return this.headers[key.toLowerCase()]; },
    ip: '127.0.0.1',
    log: { info: () => {}, error: () => {}, warn: () => {} },
  };
}
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    locals: {},
    status(code) { this.statusCode = code; return this; },
    set: function(k,v) { this.headers[k]=v; return this; },
    setHeader: function(k,v) { this.headers[k]=v; return this; },
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

describe('export-routes.js', () => {
  let router;

  beforeAll(() => { router = exportRouter; });

  describe('路由结构', () => {
    test('包含 /csv POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/csv' && l.route.methods.post);
      expect(has).toBe(true);
    });
    test('包含 /json POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/json' && l.route.methods.post);
      expect(has).toBe(true);
    });
    test('包含 /archive POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/archive' && l.route.methods.post);
      expect(has).toBe(true);
    });
    test('包含 /decrypt POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/decrypt' && l.route.methods.post);
      expect(has).toBe(true);
    });
    test('包含 /unlock POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/unlock' && l.route.methods.post);
      expect(has).toBe(true);
    });
    test('包含 /audit-log GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/audit-log' && l.route.methods.get);
      expect(has).toBe(true);
    });
    test('包含 /policy GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/policy' && l.route.methods.get);
      expect(has).toBe(true);
    });
  });

  describe('POST /csv', () => {
    test('缺少 table 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/csv');
      const req = mockReq({ body: {}, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('INVALID_TABLE');
    });

    test('无效 table 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/csv');
      const req = mockReq({ body: { table: 'invalid_table' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('free 用户导出 merchants 返回 403', () => {
      const handler = getRouteHandler(router, 'post', '/csv');
      const req = mockReq({ body: { table: 'merchants' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('ADMIN_REQUIRED');
    });

    test('free 用户导出 master_cases 返回 403', () => {
      const handler = getRouteHandler(router, 'post', '/csv');
      const req = mockReq({ body: { table: 'master_cases' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('MASTER_REQUIRED');
    });
  });

  describe('POST /json', () => {
    test('缺少 table 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/json');
      const req = mockReq({ body: {}, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('无效 table 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/json');
      const req = mockReq({ body: { table: 'xyz' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('free 用户导出 master_cases 返回 403', () => {
      const handler = getRouteHandler(router, 'post', '/json');
      const req = mockReq({ body: { table: 'master_cases' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /archive', () => {
    test('缺少 table 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/archive');
      const req = mockReq({ body: {}, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('无效 table 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/archive');
      const req = mockReq({ body: { table: 'bad' }, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('缺少 ids 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/archive');
      const req = mockReq({ body: { table: 'users' }, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('IDS_REQUIRED');
    });

    test('缺少 reason 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/archive');
      const req = mockReq({ body: { table: 'users', ids: [1, 2] }, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('REASON_REQUIRED');
    });
  });

  describe('POST /decrypt', () => {
    test('缺少 payload 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/decrypt');
      const req = mockReq({ body: {}, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('PAYLOAD_REQUIRED');
    });

    test('缺少 reason 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/decrypt');
      const req = mockReq({ body: { encrypted_payload: 'test' }, userRoles: ['super_admin'] });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('REASON_REQUIRED');
    });
  });

  describe('GET /policy', () => {
    test('返回脱敏策略', () => {
      const handler = getRouteHandler(router, 'get', '/policy');
      const req = mockReq({ userRoles: ['super_admin'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('sensitive_fields');
      expect(res.body).toHaveProperty('allowed_tables');
    });
  });
});
