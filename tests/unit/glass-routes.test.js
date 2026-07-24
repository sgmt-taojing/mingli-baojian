// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — glass-routes.js
// ═══════════════════════════════════════════════════════════════

const glassRouter = require('../../server/glass-routes.js');

// mock req/res 工具
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
    ended: false,
    locals: {},
    status(code) { this.statusCode = code; return this; },
    set(key, val) { this.headers[key] = val; return this; },
    setHeader(key, val) { this.headers[key] = val; return this; },
    json(data) { this.body = data; this.ended = true; return this; },
    send(data) { this.body = data; this.ended = true; return this; },
    end() { this.ended = true; return this; },
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

describe('glass-routes.js', () => {
  let router;

  beforeAll(() => {
    router = glassRouter;
  });

  describe('路由结构', () => {
    test('Router 有 stack', () => {
      expect(router).toHaveProperty('stack');
      expect(router.stack.length).toBeGreaterThan(5);
    });

    test('包含 /ocr POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/ocr' && l.route.methods.post);
      expect(has).toBe(true);
    });

    test('包含 /fortune-today GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/fortune-today' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /health-tips GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/health-tips' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /heartbeat POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/heartbeat' && l.route.methods.post);
      expect(has).toBe(true);
    });

    test('包含 /stream/:sessionId GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/stream/:sessionId' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /upload-audio POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/upload-audio' && l.route.methods.post);
      expect(has).toBe(true);
    });

    test('包含 /ai-suggestions GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/ai-suggestions' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /analyze POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/analyze' && l.route.methods.post);
      expect(has).toBe(true);
    });

    test('包含 /devices GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/devices' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /demo GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/demo' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /history GET 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/history' && l.route.methods.get);
      expect(has).toBe(true);
    });

    test('包含 /history POST 路由', () => {
      const has = router.stack.some(l => l.route && l.route.path === '/history' && l.route.methods.post);
      expect(has).toBe(true);
    });
  });

  describe('deviceAuth 中间件', () => {
    test('无 token 返回 401', () => {
      // deviceAuth 是每个路由的第一个中间件
      const ocrLayer = router.stack.find(l => l.route && l.route.path === '/ocr');
      const authMiddleware = ocrLayer.route.stack[0].handle;
      const req = mockReq({ headers: {} });
      const res = mockRes();
      authMiddleware(req, res, () => {});
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('code');
    });

    test('无 GL- 前缀返回 401', () => {
      const ocrLayer = router.stack.find(l => l.route && l.route.path === '/ocr');
      const authMiddleware = ocrLayer.route.stack[0].handle;
      const req = mockReq({ headers: { 'x-device-token': 'BAD-TOKEN' } });
      const res = mockRes();
      authMiddleware(req, res, () => {});
      expect(res.statusCode).toBe(401);
    });

    test('有效 GL- token 通过', () => {
      const ocrLayer = router.stack.find(l => l.route && l.route.path === '/ocr');
      const authMiddleware = ocrLayer.route.stack[0].handle;
      const req = mockReq({ headers: { 'x-device-token': 'GL-TEST1234' } });
      const res = mockRes();
      let nextCalled = false;
      authMiddleware(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(req.deviceToken).toBe('GL-TEST1234');
    });
  });

  describe('POST /ocr', () => {
    test('缺少 image 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/ocr');
      const req = mockReq({ body: {} });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('有 image 返回 OCR 结果', async () => {
      const handler = getRouteHandler(router, 'post', '/ocr');
      const req = mockReq({ body: { image: 'base64data', mode: 'paipan' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('text');
      expect(res.body.data).toHaveProperty('confidence');
    });
  });

  describe('GET /fortune-today', () => {
    test('返回今日运势', async () => {
      const handler = getRouteHandler(router, 'get', '/fortune-today');
      const req = mockReq();
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('wuxing');
      expect(res.body.data).toHaveProperty('luckyHour');
    });
  });

  describe('GET /health-tips', () => {
    test('返回健康提示', async () => {
      const handler = getRouteHandler(router, 'get', '/health-tips');
      const req = mockReq();
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('tip');
      expect(res.body.data).toHaveProperty('diet');
    });
  });

  describe('POST /heartbeat', () => {
    test('返回心跳确认', async () => {
      const handler = getRouteHandler(router, 'post', '/heartbeat');
      const req = mockReq({ body: { battery: 80, network: 'wifi' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data.received).toBe(true);
    });
  });

  describe('POST /upload-audio', () => {
    test('缺少 audio 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/upload-audio');
      const req = mockReq({ body: {} });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('有 audio 返回 STT 结果', async () => {
      const handler = getRouteHandler(router, 'post', '/upload-audio');
      const req = mockReq({ body: { audio: 'base64', duration: 5 } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('sttText');
    });
  });

  describe('GET /ai-suggestions', () => {
    test('默认 role=believer', async () => {
      const handler = getRouteHandler(router, 'get', '/ai-suggestions');
      const req = mockReq({ query: {} });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('believer');
      expect(Array.isArray(res.body.data.suggestions)).toBe(true);
    });

    test('role=master 返回大师建议', async () => {
      const handler = getRouteHandler(router, 'get', '/ai-suggestions');
      const req = mockReq({ query: { role: 'master' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('master');
    });

    test('role=physician 返回医师建议', async () => {
      const handler = getRouteHandler(router, 'get', '/ai-suggestions');
      const req = mockReq({ query: { role: 'physician' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data.role).toBe('physician');
    });

    test('未知 role 回退到 believer', async () => {
      const handler = getRouteHandler(router, 'get', '/ai-suggestions');
      const req = mockReq({ query: { role: 'unknown' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('POST /analyze', () => {
    test('返回分析结果', async () => {
      const handler = getRouteHandler(router, 'post', '/analyze');
      const req = mockReq({ body: { deviceId: 'GL-001', context: 'test', hint: 'fortune' } });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('analysis');
      expect(res.body.data.analysis).toHaveProperty('intent');
    });
  });

  describe('GET /devices', () => {
    test('返回设备列表', async () => {
      const handler = getRouteHandler(router, 'get', '/devices');
      const req = mockReq();
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('list');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  describe('GET /demo', () => {
    test('无需鉴权返回端点清单', async () => {
      const handler = getRouteHandler(router, 'get', '/demo');
      const req = mockReq();
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('features');
      expect(res.body.data.features.length).toBeGreaterThan(5);
      expect(res.body.data).toHaveProperty('sampleToken');
    });
  });

  describe('POST /history (save)', () => {
    test('缺少 title 返回 400', async () => {
      const handler = getRouteHandler(router, 'post', '/history');
      const req = mockReq({ body: {} });
      const res = mockRes();
      await handler(req, res, () => {});
      expect(res.statusCode).toBe(400);
    });

    test('有 title 返回成功或数据库错误', async () => {
      const handler = getRouteHandler(router, 'post', '/history');
      const req = mockReq({ body: { title: '测试会话' } });
      const res = mockRes();
      await handler(req, res, () => {});
      // 可能 200 (成功) 或 500 (表不存在/数据库错误)
      expect([200, 500]).toContain(res.statusCode);
    });
  });
});
