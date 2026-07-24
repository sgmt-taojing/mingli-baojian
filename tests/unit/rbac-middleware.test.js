// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — rbac-middleware.js
// ═══════════════════════════════════════════════════════════════

jest.mock('../../server/security-v2.js', () => ({
  verifyToken: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  generateToken: jest.fn(),
  hasRole: jest.fn(),
  hasAnyRole: jest.fn(),
  maskPhone: jest.fn(),
  maskBirthDate: jest.fn(),
  hashPhone: jest.fn(),
  sanitizeInput: jest.fn(),
  sanitizeXSS: jest.fn(),
  rateLimit: jest.fn(),
}));

jest.mock('../../server/logger.js', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  child: jest.fn(() => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() })),
}));

const sec = require('../../server/security-v2.js');
const logger = require('../../server/logger.js');
const {
  ROLES,
  PERMISSIONS,
  requirePermission,
  auth,
  optionalAuth,
  adminAuth,
  filterZhouyiTerms,
} = require('../../server/rbac-middleware.js');

// === 辅助工厂 ===
function mockReq(token) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  return { headers };
}
function mockRes() {
  const res = {
    _status: null,
    _json: null,
    status(code) { this._status = code; return this; },
    json(data) { this._json = data; return this; },
  };
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// requirePermission
// ─────────────────────────────────────────────
describe('requirePermission(permission)', () => {
  test('无 token → 401 AUTH_TOKEN_MISSING', () => {
    const mw = requirePermission('paipan:basic');
    const req = mockReq(null);
    const res = mockRes();
    mw(req, res, jest.fn());
    expect(res._status).toBe(401);
    expect(res._json.error).toBe('AUTH_TOKEN_MISSING');
  });

  test('无效 token → 401 AUTH_TOKEN_INVALID', () => {
    sec.verifyToken.mockReturnValue(null);
    const mw = requirePermission('paipan:basic');
    const req = mockReq('bad-token');
    const res = mockRes();
    mw(req, res, jest.fn());
    expect(res._status).toBe(401);
    expect(res._json.error).toBe('AUTH_TOKEN_INVALID');
  });

  test('有效 token 但角色不匹配 → 403 RBAC_FORBIDDEN', () => {
    sec.verifyToken.mockReturnValue({ uid: 1, roles: ['guest'] });
    const mw = requirePermission('paipan:advanced');
    const req = mockReq('good-token');
    const res = mockRes();
    mw(req, res, jest.fn());
    expect(res._status).toBe(403);
    expect(res._json.error).toBe('RBAC_FORBIDDEN');
    expect(res._json.required).toBe('paipan:advanced');
  });

  test('super_admin 角色直通 next()', () => {
    sec.verifyToken.mockReturnValue({ uid: 1, roles: ['super_admin'] });
    const mw = requirePermission('system:super');
    const req = mockReq('admin-token');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res._status).toBeNull();
  });

  test('有效 token 且角色匹配 → next()', () => {
    sec.verifyToken.mockReturnValue({ uid: 5, roles: ['vip'] });
    const mw = requirePermission('paipan:premium');
    const req = mockReq('vip-token');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(5);
    expect(req.userRoles).toEqual(['vip']);
  });

  test('未知权限 → 500 SERVER_ERROR 并记日志', () => {
    sec.verifyToken.mockReturnValue({ uid: 1, roles: ['vip'] });
    const mw = requirePermission('nonexistent:perm');
    const req = mockReq('good-token');
    const res = mockRes();
    mw(req, res, jest.fn());
    expect(res._status).toBe(500);
    expect(res._json.error).toBe('SERVER_ERROR');
    expect(logger.error).toHaveBeenCalled();
  });

  test('默认 roles 为 free', () => {
    sec.verifyToken.mockReturnValue({ uid: 10 });
    const mw = requirePermission('paipan:basic');
    const req = mockReq('token-no-roles');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userRoles).toEqual(['free']);
  });

  test('多角色用户只要有一个匹配即可通过', () => {
    sec.verifyToken.mockReturnValue({ uid: 7, roles: ['free', 'master'] });
    const mw = requirePermission('clinic:submit_analysis');
    const req = mockReq('multi-role-token');
    const res = mockRes();
    const next = jest.fn();
    mw(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// optionalAuth
// ─────────────────────────────────────────────
describe('optionalAuth(req, res, next)', () => {
  test('无 token → guest 角色', () => {
    const req = mockReq(null);
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBeNull();
    expect(req.userRoles).toEqual(['guest']);
    expect(req.userPayload).toBeNull();
  });

  test('有有效 token → 解析并设置用户信息', () => {
    sec.verifyToken.mockReturnValue({ uid: 42, roles: ['vip'] });
    const req = mockReq('valid-token');
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(42);
    expect(req.userRoles).toEqual(['vip']);
  });

  test('有无效 token → 当 guest 处理', () => {
    sec.verifyToken.mockReturnValue(null);
    const req = mockReq('invalid-token');
    const res = mockRes();
    const next = jest.fn();
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBeNull();
    expect(req.userRoles).toEqual(['guest']);
  });
});

// ─────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────
describe('auth(req, res, next)', () => {
  test('无 token → 401', () => {
    const req = mockReq(null);
    const res = mockRes();
    auth(req, res, jest.fn());
    expect(res._status).toBe(401);
    expect(res._json.error).toBeDefined();
  });

  test('无效 token → 401 AUTH_TOKEN_EXPIRED', () => {
    sec.verifyToken.mockReturnValue(null);
    const req = mockReq('bad');
    const res = mockRes();
    auth(req, res, jest.fn());
    expect(res._status).toBe(401);
    expect(res._json.error).toBe('AUTH_TOKEN_EXPIRED');
  });

  test('有效 token → 设置用户信息并 next', () => {
    sec.verifyToken.mockReturnValue({ uid: 99, roles: ['free'] });
    const req = mockReq('good');
    const res = mockRes();
    const next = jest.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe(99);
    expect(req.userRoles).toEqual(['free']);
  });
});

// ─────────────────────────────────────────────
// adminAuth
// ─────────────────────────────────────────────
describe('adminAuth(req, res, next)', () => {
  test('无 token → 401（先走 auth）', () => {
    const req = mockReq(null);
    const res = mockRes();
    adminAuth(req, res, jest.fn());
    expect(res._status).toBe(401);
  });

  test('有效 token 但非管理员 → 403 RBAC_FORBIDDEN', () => {
    sec.verifyToken.mockReturnValue({ uid: 1, roles: ['free'] });
    const req = mockReq('user-token');
    const res = mockRes();
    adminAuth(req, res, jest.fn());
    expect(res._status).toBe(403);
    expect(res._json.error).toBe('RBAC_FORBIDDEN');
  });

  test('super_admin → next', () => {
    sec.verifyToken.mockReturnValue({ uid: 1, roles: ['super_admin'] });
    const req = mockReq('admin-token');
    const res = mockRes();
    const next = jest.fn();
    adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('admin_a → next', () => {
    sec.verifyToken.mockReturnValue({ uid: 2, roles: ['admin_a'] });
    const req = mockReq('admin-a-token');
    const res = mockRes();
    const next = jest.fn();
    adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('admin_b → next', () => {
    sec.verifyToken.mockReturnValue({ uid: 3, roles: ['admin_b'] });
    const req = mockReq('admin-b-token');
    const res = mockRes();
    const next = jest.fn();
    adminAuth(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// filterZhouyiTerms
// ─────────────────────────────────────────────
describe('filterZhouyiTerms(text)', () => {
  test('null 输入原样返回', () => {
    expect(filterZhouyiTerms(null)).toBeNull();
  });

  test('undefined 输入原样返回', () => {
    expect(filterZhouyiTerms(undefined)).toBeUndefined();
  });

  test('非字符串输入原样返回', () => {
    expect(filterZhouyiTerms(123)).toBe(123);
    expect(filterZhouyiTerms({})).toEqual({});
  });

  test('空字符串原样返回', () => {
    expect(filterZhouyiTerms('')).toBe('');
  });

  test('短语替换：八字木旺克土 → 体质偏木型，需注意脾胃调理', () => {
    const result = filterZhouyiTerms('你的八字木旺克土，需注意');
    expect(result).toContain('体质偏木型，需注意脾胃调理');
    expect(result).not.toContain('八字木旺克土');
  });

  test('短语替换：五行火旺 → 体质偏热型', () => {
    const result = filterZhouyiTerms('五行火旺的人容易着急');
    expect(result).toContain('体质偏热型，注意清热降火');
  });

  test('术语清除：天干地支等术语被移除', () => {
    const result = filterZhouyiTerms('甲木乙木丙火丁火');
    expect(result).not.toContain('甲木');
    expect(result).not.toContain('乙木');
    expect(result).not.toContain('丙火');
    expect(result).not.toContain('丁火');
  });

  test('术语清除：卦象术语被移除', () => {
    const result = filterZhouyiTerms('乾卦坤卦震卦');
    expect(result).not.toContain('乾卦');
    expect(result).not.toContain('坤卦');
    expect(result).not.toContain('震卦');
  });

  test('多余空格被清理', () => {
    const result = filterZhouyiTerms('甲木  乙木  丙火');
    expect(result).not.toMatch(/\s{2,}/);
  });

  test('正常文本（无术语）不受影响', () => {
    const text = '今天天气不错，适合散步';
    expect(filterZhouyiTerms(text)).toBe(text);
  });

  test('多个短语同时替换', () => {
    const result = filterZhouyiTerms('八字木旺克土和五行火旺都需要注意');
    expect(result).toContain('体质偏木型，需注意脾胃调理');
    expect(result).toContain('体质偏热型，注意清热降火');
  });

  test('日主类短语替换', () => {
    const result = filterZhouyiTerms('日主甲木的人');
    expect(result).toContain('个人体质属木型');
    expect(result).not.toContain('日主甲木');
  });
});

// ─────────────────────────────────────────────
// 导出常量
// ─────────────────────────────────────────────
describe('导出常量', () => {
  test('ROLES 包含所有角色', () => {
    expect(ROLES.GUEST).toBe('guest');
    expect(ROLES.SUPER_ADMIN).toBe('super_admin');
    expect(ROLES.MASTER).toBe('master');
    expect(ROLES.DOCTOR).toBe('doctor');
  });

  test('PERMISSIONS 是对象且包含多个权限', () => {
    expect(typeof PERMISSIONS).toBe('object');
    expect(PERMISSIONS['paipan:basic']).toBeDefined();
    expect(PERMISSIONS['system:super']).toEqual(['super_admin']);
  });
});
