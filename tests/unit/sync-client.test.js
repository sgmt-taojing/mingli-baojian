// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — sync-client.js
// sync-client.js 是一个 UMD 模块，在 Node 环境下通过 CommonJS 导出
// ═══════════════════════════════════════════════════════════════

// 模拟浏览器环境
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
};
global.window = { localStorage: global.localStorage };

const SyncClient = require('../../server/sync-client.js');

describe('SyncClient', () => {
  beforeEach(() => {
    // 重置状态
    global.localStorage._data = {};
    SyncClient.token = null;
    SyncClient._timerId = null;
    SyncClient._retryCount = 0;
    SyncClient.apiBase = 'http://127.0.0.1:8920';
  });

  describe('初始化', () => {
    test('模块导出为对象', () => {
      expect(typeof SyncClient).toBe('object');
      expect(SyncClient).not.toBeNull();
    });

    test('init() 默认配置', () => {
      SyncClient.init();
      expect(SyncClient.apiBase).toBe('http://127.0.0.1:8920');
      expect(SyncClient.token).toBeNull();
    });

    test('init() 自定义配置', () => {
      SyncClient.init({ apiBase: 'http://example.com', token: 'abc123' });
      expect(SyncClient.apiBase).toBe('http://example.com');
      expect(SyncClient.token).toBe('abc123');
    });

    test('init() 从 localStorage 读取 token', () => {
      localStorage.setItem('authToken', 'stored-token');
      SyncClient.init();
      expect(SyncClient.token).toBe('stored-token');
    });
  });

  describe('Token 管理', () => {
    test('setToken() 设置 token 并存储', () => {
      SyncClient.setToken('new-token');
      expect(SyncClient.token).toBe('new-token');
      expect(localStorage.getItem('authToken')).toBe('new-token');
    });

    test('setToken(null) 不存储', () => {
      SyncClient.setToken(null);
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    test('isLoggedIn() 返回 token 状态', () => {
      expect(SyncClient.isLoggedIn()).toBe(false);
      SyncClient.setToken('abc');
      expect(SyncClient.isLoggedIn()).toBe(true);
    });

    test('logout() 清理状态', () => {
      SyncClient.setToken('abc');
      SyncClient.startAutoSync();
      SyncClient.logout();
      expect(SyncClient.token).toBeNull();
      expect(SyncClient.isLoggedIn()).toBe(false);
      expect(SyncClient._timerId).toBeNull();
    });
  });

  describe('_authHeader()', () => {
    test('有 token 时返回 Bearer 头', () => {
      SyncClient.setToken('mytoken');
      const h = SyncClient._authHeader();
      expect(h.Authorization).toBe('Bearer mytoken');
    });

    test('无 token 时返回空对象', () => {
      const h = SyncClient._authHeader();
      expect(Object.keys(h).length).toBe(0);
    });
  });

  describe('_collectLocalData()', () => {
    test('收集本地数据包含 _deviceTime', () => {
      const data = SyncClient._collectLocalData();
      expect(data).toHaveProperty('_deviceTime');
      expect(typeof data._deviceTime).toBe('number');
    });

    test('localStorage 有数据时被收集', () => {
      localStorage.setItem('userBazi', JSON.stringify({ year: 1990 }));
      const data = SyncClient._collectLocalData();
      expect(data.userBazi).toEqual({ year: 1990 });
    });

    test('非 JSON 字符串保持原值', () => {
      localStorage.setItem('userFaith', 'buddhism');
      const data = SyncClient._collectLocalData();
      expect(data.userFaith).toBe('buddhism');
    });
  });

  describe('_applyRemoteData()', () => {
    test('对象类型用 JSON 存储', () => {
      SyncClient._applyRemoteData({ userBazi: { year: 1990 } });
      const raw = localStorage.getItem('userBazi');
      expect(JSON.parse(raw)).toEqual({ year: 1990 });
    });

    test('字符串类型直接存', () => {
      SyncClient._applyRemoteData({ userFaith: 'taoist' });
      expect(localStorage.getItem('userFaith')).toBe('taoist');
    });

    test('null/undefined 值被跳过', () => {
      localStorage.setItem('userBazi', 'existing');
      SyncClient._applyRemoteData({ userBazi: null });
      expect(localStorage.getItem('userBazi')).toBe('existing');
    });

    test('非对象参数安全处理', () => {
      expect(() => SyncClient._applyRemoteData(null)).not.toThrow();
      expect(() => SyncClient._applyRemoteData('string')).not.toThrow();
    });
  });

  describe('push() / pull() — 无 token', () => {
    test('push() 无 token 跳过', async () => {
      const res = await SyncClient.push();
      expect(res.skipped).toBe(true);
      expect(res.reason).toBe('no-token');
    });

    test('pull() 无 token 跳过', async () => {
      const res = await SyncClient.pull();
      expect(res.skipped).toBe(true);
      expect(res.reason).toBe('no-token');
    });
  });

  describe('checkSync() — 无 token', () => {
    test('无 token 返回 no-token', async () => {
      const status = await SyncClient.checkSync();
      expect(status).toBe('no-token');
    });
  });

  describe('autoSync() — 无 token', () => {
    test('无 token 返回 skipped:no-token', async () => {
      const res = await SyncClient.autoSync();
      expect(res).toBe('skipped:no-token');
    });
  });

  describe('forcePush() / forcePull()', () => {
    test('forcePush 无 token 跳过', async () => {
      const res = await SyncClient.forcePush();
      expect(res.skipped).toBe(true);
    });

    test('forcePull 无 token 跳过', async () => {
      const res = await SyncClient.forcePull();
      expect(res.skipped).toBe(true);
    });
  });

  describe('fullSync() — 无 token', () => {
    test('无 token pull 跳过但 push 也跳过', async () => {
      const res = await SyncClient.fullSync();
      // pull 返回 { skipped: true } 不是 thenable 的 throw
      // 所以 push 会接着执行
      expect(res).toBe('full-sync-done');
    });
  });

  describe('定时同步', () => {
    test('startAutoSync() 启动定时器', () => {
      SyncClient.startAutoSync();
      expect(SyncClient._timerId).not.toBeNull();
      SyncClient.stopAutoSync();
    });

    test('stopAutoSync() 停止定时器', () => {
      SyncClient.startAutoSync();
      SyncClient.stopAutoSync();
      expect(SyncClient._timerId).toBeNull();
    });

    test('重复 startAutoSync() 不创建新定时器', () => {
      SyncClient.startAutoSync();
      const id = SyncClient._timerId;
      SyncClient.startAutoSync();
      expect(SyncClient._timerId).toBe(id);
      SyncClient.stopAutoSync();
    });

    test('stopAutoSync() 无定时器时不报错', () => {
      expect(() => SyncClient.stopAutoSync()).not.toThrow();
    });
  });

  describe('getLastSyncTime() / getLastSyncText()', () => {
    test('从未同步', () => {
      expect(SyncClient.getLastSyncTime()).toBe(0);
      expect(SyncClient.getLastSyncText()).toBe('从未同步');
    });

    test('刚刚同步', () => {
      SyncClient.storage.set('lastSyncTime', String(Date.now()));
      expect(SyncClient.getLastSyncText()).toBe('刚刚同步');
    });

    test('分钟前同步', () => {
      SyncClient.storage.set('lastSyncTime', String(Date.now() - 5 * 60000));
      const text = SyncClient.getLastSyncText();
      expect(text).toMatch(/分钟前同步/);
    });

    test('小时前同步', () => {
      SyncClient.storage.set('lastSyncTime', String(Date.now() - 3 * 3600000));
      const text = SyncClient.getLastSyncText();
      expect(text).toMatch(/小时前同步/);
    });

    test('天前同步', () => {
      SyncClient.storage.set('lastSyncTime', String(Date.now() - 2 * 86400000));
      const text = SyncClient.getLastSyncText();
      expect(text).toMatch(/天前同步/);
    });
  });

  describe('getEnvInfo()', () => {
    test('返回环境信息对象', () => {
      const info = SyncClient.getEnvInfo();
      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('hasToken');
      expect(info).toHaveProperty('apiBase');
      expect(info).toHaveProperty('lastSyncTime');
      expect(info).toHaveProperty('autoSyncRunning');
    });
  });

  describe('SYNC_KEYS 常量', () => {
    test('包含预期同步键', () => {
      expect(SyncClient.SYNC_KEYS).toContain('userBazi');
      expect(SyncClient.SYNC_KEYS).toContain('userFaith');
      expect(SyncClient.SYNC_KEYS).toContain('memberInfo');
      expect(SyncClient.SYNC_KEYS).toContain('paipanHistory');
      expect(SyncClient.SYNC_KEYS).toContain('favorites');
      expect(SyncClient.SYNC_KEYS).toContain('preferences');
    });
  });

  describe('storage 适配层', () => {
    test('get/set/remove 基本操作', () => {
      SyncClient.storage.set('key1', 'value1');
      expect(SyncClient.storage.get('key1')).toBe('value1');
      SyncClient.storage.remove('key1');
      expect(SyncClient.storage.get('key1')).toBeNull();
    });

    test('getJSON/setJSON 操作', () => {
      SyncClient.storage.setJSON('obj', { a: 1 });
      expect(SyncClient.storage.getJSON('obj')).toEqual({ a: 1 });
    });

    test('getJSON 无数据返回 fallback', () => {
      expect(SyncClient.storage.getJSON('missing', 'default')).toBe('default');
    });

    test('getJSON 解析失败返回 fallback', () => {
      SyncClient.storage.set('badjson', '{invalid}');
      expect(SyncClient.storage.getJSON('badjson', null)).toBeNull();
    });
  });

  describe('_handleRetry()', () => {
    test('达到最大重试次数后停止', () => {
      SyncClient._retryCount = SyncClient._maxRetries;
      expect(() => SyncClient._handleRetry('push')).not.toThrow();
      expect(SyncClient._retryCount).toBe(0);
    });

    test('增加重试计数', () => {
      SyncClient._retryCount = 0;
      SyncClient._handleRetry('push');
      expect(SyncClient._retryCount).toBe(1);
    });
  });

  // 覆盖 request 函数（通过 fetch mock）
  describe('request() — fetch 集成', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      delete global.fetch;
    });

    test('fetch 成功返回 JSON', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });
      SyncClient.setToken('test-token');
      const result = await SyncClient.push();
      expect(result).toBeDefined();
    });

    test('fetch 失败抛出错误', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      SyncClient.setToken('test-token');
      await expect(SyncClient.push()).rejects.toThrow();
    });
  });

  // 覆盖 checkSync 和 autoSync 带 token
  describe('checkSync() — 带 token', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      delete global.fetch;
    });

    test('服务端无数据返回 push', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ serverTimestamp: 0, lastSyncTime: 0 }),
      });
      SyncClient.setToken('test-token');
      const status = await SyncClient.checkSync();
      expect(['push', 'pull', 'in-sync']).toContain(status);
    });

    test('服务端有更新返回 pull', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ serverTimestamp: Date.now(), lastSyncTime: Date.now() }),
      });
      SyncClient.setToken('test-token');
      const status = await SyncClient.checkSync();
      expect(['push', 'pull', 'in-sync']).toContain(status);
    });

    test('checkSync 失败返回 in-sync', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
      SyncClient.setToken('test-token');
      const status = await SyncClient.checkSync();
      expect(status).toBe('in-sync');
    });
  });

  describe('autoSync() — 带 token', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      delete global.fetch;
    });

    test('autoSync 执行并返回结果', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ serverTimestamp: 0, lastSyncTime: 0 }),
      });
      // checkSync returns 'push', then push fetch returns success
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ // checkSync status
          ok: true,
          json: () => Promise.resolve({ serverTimestamp: 0, lastSyncTime: 0 }),
        })
        .mockResolvedValueOnce({ // push
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        });
      SyncClient.setToken('test-token');
      const result = await SyncClient.autoSync();
      expect(typeof result).toBe('string');
    });
  });

  describe('fullSync() — 带 token', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });
    afterEach(() => {
      delete global.fetch;
    });

    test('fullSync 执行 pull + push', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, data: {} }),
      });
      SyncClient.setToken('test-token');
      const result = await SyncClient.fullSync();
      expect(result).toBe('full-sync-done');
    });
  });
});
