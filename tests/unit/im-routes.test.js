// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — im-routes.js
// ═══════════════════════════════════════════════════════════════

const imRouter = require('../../server/im-routes.js');

function mockReq(opts = {}) {
  return {
    params: opts.params || {},
    query: opts.query || {},
    headers: opts.headers || {},
    body: opts.body || {},
    get: function(key) { return this.headers[key.toLowerCase()]; },
    ip: '127.0.0.1',
    on: () => {},
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
    write() {},
    writeHead() {},
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

// Helper: 创建带 JWT 的请求
function jwtReq(payload, opts = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `${header}.${body}.fakesig`;
  return mockReq({
    ...opts,
    headers: { authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

describe('im-routes.js', () => {
  let router;

  beforeAll(() => { router = imRouter; });

  describe('路由结构', () => {
    test('包含 /directory GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/directory' && l.route.methods.get)).toBe(true);
    });
    test('包含 /sessions GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions' && l.route.methods.get)).toBe(true);
    });
    test('包含 /sessions POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions' && l.route.methods.post)).toBe(true);
    });
    test('包含 /sessions/:id GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions/:id' && l.route.methods.get)).toBe(true);
    });
    test('包含 /sessions/:id/messages GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions/:id/messages' && l.route.methods.get)).toBe(true);
    });
    test('包含 /sessions/:id/messages POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions/:id/messages' && l.route.methods.post)).toBe(true);
    });
    test('包含 /sessions/:id/read POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions/:id/read' && l.route.methods.post)).toBe(true);
    });
    test('包含 /sessions/:id/ai POST', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/sessions/:id/ai' && l.route.methods.post)).toBe(true);
    });
    test('包含 /unread-count GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/unread-count' && l.route.methods.get)).toBe(true);
    });
    test('包含 /admin/stats GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/admin/stats' && l.route.methods.get)).toBe(true);
    });
    test('包含 /stream GET', () => {
      expect(router.stack.some(l => l.route && l.route.path === '/stream' && l.route.methods.get)).toBe(true);
    });
  });

  describe('GET /directory', () => {
    test('返回通讯录', () => {
      const handler = getRouteHandler(router, 'get', '/directory');
      const req = jwtReq({ uid: '1', roles: ['master'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    test('guest 用户也返回结果', () => {
      const handler = getRouteHandler(router, 'get', '/directory');
      const req = mockReq({ headers: { 'x-user-id': 'guest', 'x-user-role': 'user' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /sessions', () => {
    test('返回会话列表', () => {
      const handler = getRouteHandler(router, 'get', '/sessions');
      const req = jwtReq({ uid: '1', roles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.sessions)).toBe(true);
    });

    test('admin 返回所有会话', () => {
      const handler = getRouteHandler(router, 'get', '/sessions');
      const req = jwtReq({ uid: '1', roles: ['admin'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
    });
  });

  describe('POST /sessions', () => {
    test('缺少 participants 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/sessions');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { body: {} });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('PARTICIPANTS_REQUIRED');
    });

    test('创建单聊会话', () => {
      const handler = getRouteHandler(router, 'post', '/sessions');
      const req = jwtReq({ uid: '1', roles: ['master'] }, {
        body: { participants: [{ id: '2', role: 'user' }] },
      });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('sessionId');
    });

    test('创建群聊会话', () => {
      const handler = getRouteHandler(router, 'post', '/sessions');
      const req = jwtReq({ uid: '1', roles: ['master'] }, {
        body: {
          participants: [{ id: '2', role: 'user' }, { id: '3', role: 'doctor' }],
          isGroup: true,
          title: '测试群',
        },
      });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('GET /sessions/:id', () => {
    test('无效 ID 返回 400', () => {
      const handler = getRouteHandler(router, 'get', '/sessions/:id');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: 'abc' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('BAD_ID');
    });

    test('不存在的会话返回 404', () => {
      const handler = getRouteHandler(router, 'get', '/sessions/:id');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: '999999' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  describe('GET /sessions/:id/messages', () => {
    test('无效 ID 返回 400', () => {
      const handler = getRouteHandler(router, 'get', '/sessions/:id/messages');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: 'abc' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('不存在的会话返回空消息列表', () => {
      const handler = getRouteHandler(router, 'get', '/sessions/:id/messages');
      const req = jwtReq({ uid: '1', roles: ['free'] }, {
        params: { id: '999999' },
        query: { limit: '10' },
      });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.messages)).toBe(true);
    });
  });

  describe('POST /sessions/:id/messages', () => {
    test('无效 ID 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/sessions/:id/messages');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: 'abc' }, body: { content: 'hi' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('非参与者返回 403', () => {
      const handler = getRouteHandler(router, 'post', '/sessions/:id/messages');
      const req = jwtReq({ uid: '999', roles: ['free'] }, { params: { id: '1' }, body: { content: 'hi' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('NOT_PARTICIPANT');
    });
  });

  describe('POST /sessions/:id/read', () => {
    test('无效 ID 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/sessions/:id/read');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: 'abc' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /unread-count', () => {
    test('返回未读数', () => {
      const handler = getRouteHandler(router, 'get', '/unread-count');
      const req = jwtReq({ uid: '1', roles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('unread');
    });
  });

  describe('GET /admin/stats', () => {
    test('非 admin 返回 403', () => {
      const handler = getRouteHandler(router, 'get', '/admin/stats');
      const req = jwtReq({ uid: '1', roles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
    });

    test('admin 返回统计', () => {
      const handler = getRouteHandler(router, 'get', '/admin/stats');
      const req = jwtReq({ uid: '1', roles: ['admin'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body).toHaveProperty('stats');
    });
  });

  describe('POST /sessions/:id/ai', () => {
    test('无效 ID 返回 400', () => {
      const handler = getRouteHandler(router, 'post', '/sessions/:id/ai');
      const req = jwtReq({ uid: '1', roles: ['free'] }, { params: { id: 'abc' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('非参与者返回 403', () => {
      const handler = getRouteHandler(router, 'post', '/sessions/:id/ai');
      const req = jwtReq({ uid: '999', roles: ['free'] }, { params: { id: '1' } });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(403);
    });
  });
});
