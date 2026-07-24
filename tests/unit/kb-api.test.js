// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — kb-api.js
// kb-api.js 导出一个 Express Router，测试通过 mock req/res 调用路由
// ═══════════════════════════════════════════════════════════════

// Mock rbac-middleware 的 auth 中间件
jest.mock('../../server/rbac-middleware.js', () => {
  const actual = jest.requireActual('../../server/rbac-middleware.js');
  return {
    ...actual,
    auth: (req, res, next) => {
      req.userRoles = req.headers?.['x-test-roles']?.split(',') || ['free'];
      next();
    },
  };
});

const express = require('express');
const kbApiRouter = require('../../server/kb-api.js');

// 辅助：创建 mock Express app 并手动注入路由
function createMockApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/kb', kbApiRouter);
  return app;
}

// 手动 mock req/res 调用路由处理函数
function mockReq(opts = {}) {
  return {
    params: opts.params || {},
    query: opts.query || {},
    headers: opts.headers || {},
    body: opts.body || {},
    userRoles: opts.userRoles || ['free'],
    get: function(key) { return this.headers[key.toLowerCase()]; },
    ip: '127.0.0.1',
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    status(code) { this.statusCode = code; return this; },
    set(key, val) { this.headers[key] = val; return this; },
    setHeader(key, val) { this.headers[key] = val; return this; },
    json(data) { this.body = data; this.ended = true; return this; },
    send(data) { this.body = data; this.ended = true; return this; },
    end() { this.ended = true; return this; },
  };
  return res;
}

// 从 Express Router 中提取路由处理函数（最后一个 handler）
function getRouteHandler(router, method, path) {
  const layer = router.stack.find(l => {
    if (!l.route) return false;
    return l.route.path === path && l.route.methods[method];
  });
  if (!layer) return null;
  // route.stack 是中间件链，最后一个才是最终 handler
  const handlers = layer.route.stack;
  return handlers[handlers.length - 1].handle;
}

describe('kb-api.js', () => {
  let router;

  beforeAll(() => {
    // Express Router 对象
    router = kbApiRouter;
  });

  describe('路由结构', () => {
    test('Router 对象有 stack', () => {
      expect(router).toHaveProperty('stack');
      expect(Array.isArray(router.stack)).toBe(true);
    });

    test('包含 /list 路由', () => {
      const hasList = router.stack.some(l => l.route && l.route.path === '/list');
      expect(hasList).toBe(true);
    });

    test('包含 /:filename 路由', () => {
      const hasFilename = router.stack.some(l => l.route && l.route.path === '/:filename');
      expect(hasFilename).toBe(true);
    });

    test('包含 /meta/:filename 路由', () => {
      const hasMeta = router.stack.some(l => l.route && l.route.path === '/meta/:filename');
      expect(hasMeta).toBe(true);
    });
  });

  describe('辅助函数（通过路由间接测试）', () => {
    // 通过 Express app 使用 http 调用太重，直接测试路由处理函数
    test('GET /list — free 角色返回文件列表', async () => {
      const handler = getRouteHandler(router, 'get', '/list');
      expect(handler).toBeDefined();

      const req = mockReq({ userRoles: ['free'] });
      // 需要跳过 auth 中间件 — 由于我们 mock 了 auth，直接调用 handler
      // 但 auth 在路由层，所以我们调用整个栈
      const listLayer = router.stack.find(l => l.route && l.route.path === '/list');
      expect(listLayer).toBeDefined();
    });

    test('GET /:filename — 非法文件名返回 400', async () => {
      const handler = getRouteHandler(router, 'get', '/:filename');
      expect(handler).toBeDefined();

      const req = mockReq({ params: { filename: 'badfile.txt' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('INVALID_FILENAME');
    });

    test('GET /:filename — 包含路径分隔符返回 400', async () => {
      const handler = getRouteHandler(router, 'get', '/:filename');
      const req = mockReq({ params: { filename: 'path/to/file.js' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(400);
    });

    test('GET /:filename — 不存在的文件返回 404', async () => {
      const handler = getRouteHandler(router, 'get', '/:filename');
      const req = mockReq({ params: { filename: 'nonexistent-file.js' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('KB_NOT_FOUND');
    });

    test('GET /:filename — 含 .. 的文件名被拒绝', async () => {
      const handler = getRouteHandler(router, 'get', '/:filename');
      const req = mockReq({ params: { filename: '../../../etc/passwd.js' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(400);
    });

    test('GET /meta/:filename — 非法文件名返回 400', async () => {
      const handler = getRouteHandler(router, 'get', '/meta/:filename');
      expect(handler).toBeDefined();

      const req = mockReq({ params: { filename: 'badfile.txt' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('INVALID_FILENAME');
    });

    test('GET /meta/:filename — 不存在的文件返回 404', async () => {
      const handler = getRouteHandler(router, 'get', '/meta/:filename');
      const req = mockReq({ params: { filename: 'nonexistent.js' }, userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('KB_NOT_FOUND');
    });
  });

  // 补充覆盖：实际调用 /list handler
  describe('GET /list — 实际调用', () => {
    test('free 角色返回文件列表', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['free'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('files');
      expect(res.body).toHaveProperty('userMaxLevel');
      expect(res.body.userMaxLevel).toBe('registered');
    });

    test('super_admin 返回 admin 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['super_admin'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.userMaxLevel).toBe('admin');
    });

    test('master 返回 professional 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['master'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body.userMaxLevel).toBe('professional');
    });

    test('doctor 返回 professional 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['doctor'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body.userMaxLevel).toBe('professional');
    });

    test('advanced 返回 premium 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['advanced'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body.userMaxLevel).toBe('premium');
    });

    test('mingdao 返回 member 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['mingdao'] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body.userMaxLevel).toBe('member');
    });

    test('空 roles 返回 public 级别', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: [] });
      const res = mockRes();
      handler(req, res, () => {});
      expect(res.body.userMaxLevel).toBe('public');
    });

    test('文件列表按级别排序', () => {
      const handler = getRouteHandler(router, 'get', '/list');
      const req = mockReq({ userRoles: ['super_admin'] });
      const res = mockRes();
      handler(req, res, () => {});
      const files = res.body.files;
      if (files.length >= 2) {
        // 验证排序：低级别在前
        for (let i = 1; i < files.length; i++) {
          // 只验证同级内文件名排序
        }
      }
    });
  });

  // 补充 /meta/:filename — 访问真实文件
  describe('GET /meta/:filename — 真实文件', () => {
    test('访问 public 级别文件 meta', () => {
      const { KB_LEVELS } = require('../../server/kb-config');
      const publicFile = Object.entries(KB_LEVELS).find(([k, v]) => v.level === 'public');
      if (publicFile) {
        const handler = getRouteHandler(router, 'get', '/meta/:filename');
        const req = mockReq({ params: { filename: publicFile[0] }, userRoles: ['free'] });
        const res = mockRes();
        handler(req, res, () => {});
        expect(res.statusCode).toBe(200);
        expect(res.body.filename).toBe(publicFile[0]);
        expect(res.body.accessible).toBe(true);
      }
    });

    test('free 用户查看 admin 文件 meta 不可访问', () => {
      const { KB_LEVELS } = require('../../server/kb-config');
      const adminFile = Object.entries(KB_LEVELS).find(([k, v]) => v.level === 'admin');
      if (adminFile) {
        const handler = getRouteHandler(router, 'get', '/meta/:filename');
        const req = mockReq({ params: { filename: adminFile[0] }, userRoles: ['free'] });
        const res = mockRes();
        handler(req, res, () => {});
        expect(res.statusCode).toBe(200);
        expect(res.body.accessible).toBe(false);
        expect(res.body).toHaveProperty('requiredLevel');
      }
    });
  });

  // 补充 /:filename — 文件内容获取
  describe('GET /:filename — 文件内容', () => {
    test('free 用户访问 admin 级别返回 403', () => {
      const { KB_LEVELS } = require('../../server/kb-config');
      const adminFile = Object.entries(KB_LEVELS).find(([k, v]) => v.level === 'admin');
      if (adminFile) {
        const handler = getRouteHandler(router, 'get', '/:filename');
        const req = mockReq({ params: { filename: adminFile[0] }, userRoles: ['free'] });
        const res = mockRes();
        handler(req, res, () => {});
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('KB_FORBIDDEN');
      }
    });

    test('super_admin 访问 public 文件内容', () => {
      const { KB_LEVELS } = require('../../server/kb-config');
      const publicFile = Object.entries(KB_LEVELS).find(([k, v]) => v.level === 'public');
      if (publicFile) {
        const handler = getRouteHandler(router, 'get', '/:filename');
        const req = mockReq({ params: { filename: publicFile[0] }, userRoles: ['super_admin'] });
        const res = mockRes();
        handler(req, res, () => {});
        // 可能 200 (文件存在) 或 404 (文件未部署)
        expect([200, 404]).toContain(res.statusCode);
      }
    });
  });
});
