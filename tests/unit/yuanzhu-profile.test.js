// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — yuanzhu-profile.js
// ═══════════════════════════════════════════════════════════════

jest.mock('../../server/security-v2.js', () => ({
  encrypt: jest.fn((v) => 'enc:' + v),
  decrypt: jest.fn((v) => {
    if (!v || typeof v !== 'string') return '';
    if (v.startsWith('enc:')) return v.slice(4);
    return v;
  }),
  verifyToken: jest.fn(),
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

const {
  mergeProfile,
  generateYearlyPush,
  hasPushed,
  savePush,
  WUXING_META,
  DAY_MASTER_ELE,
} = require('../../server/yuanzhu-profile.js');

// === 辅助：创建 mock db ===
function createMockDb() {
  const stmtMap = {};
  const db = {
    prepare: jest.fn((sql) => {
      // Return a statement object that tracks calls
      const stmt = {
        get: jest.fn(() => null),
        all: jest.fn(() => []),
        run: jest.fn(),
      };
      stmtMap[sql] = stmt;
      return stmt;
    }),
    _stmtMap: stmtMap,
  };
  return db;
}

// Helper: configure db.prepare to return specific data for SELECT
function setupGetProfile(db, profile) {
  db.prepare.mockImplementation((sql) => {
    const stmt = {
      get: jest.fn(() => profile),
      all: jest.fn(() => []),
      run: jest.fn(),
    };
    return stmt;
  });
}

// Helper: configure db.prepare with per-SQL returns
function setupPrepareSeq(db, returns) {
  let idx = 0;
  db.prepare.mockImplementation((sql) => {
    const config = returns[idx] || {};
    idx++;
    return {
      get: jest.fn(() => config.get !== undefined ? config.get : null),
      all: jest.fn(() => config.all || []),
      run: jest.fn(() => config.run || {}),
    };
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// mergeProfile
// ─────────────────────────────────────────────
describe('mergeProfile(db, userId, type, inputData, resultData, rawQuery)', () => {
  test('新用户首次排盘 → INSERT', () => {
    const db = createMockDb();
    // SELECT returns null (no existing), INSERT returns lastInsertRowid
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn(() => ({ lastInsertRowid: 1 })) };
    });

    const result = mergeProfile(db, 'user-1', 'bazi', {}, { dayMaster: '甲木' }, '我的事业');
    expect(result.ok).toBe(true);
    expect(result.focus).toContain('命格');
  });

  test('已有画像 → UPDATE（合并）', () => {
    const db = createMockDb();
    const existingProfile = {
      user_id: 'user-1',
      focus_areas: JSON.stringify(['命格']),
      concern_keywords: JSON.stringify(['工作']),
      mod_stats: JSON.stringify({ bazi: 1 }),
      push_priority: 'normal',
    };
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => existingProfile), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
    });

    const result = mergeProfile(db, 'user-1', 'yunshi', {}, {}, '今年运气怎么样');
    expect(result.ok).toBe(true);
    expect(result.focus).toContain('命格');
    expect(result.focus).toContain('运势');
  });

  test('从 rawQuery 推断关注领域', () => {
    const db = createMockDb();
    db.prepare.mockImplementation(() => ({
      get: jest.fn(() => null),
      all: jest.fn(() => []),
      run: jest.fn(() => ({ lastInsertRowid: 1 })),
    }));

    const result = mergeProfile(db, 'user-2', 'bazi', {}, {}, '我想问问工作和投资的事情');
    expect(result.ok).toBe(true);
    expect(result.focus).toContain('命格');
    // '工作' should map to 事业, '投资' to 财运
    expect(result.focus).toContain('事业');
    expect(result.focus).toContain('财运');
  });

  test('问事类高频 ≥3 → push_priority 升级为 high', () => {
    const db = createMockDb();
    const existing = {
      user_id: 'user-3',
      focus_areas: '[]',
      concern_keywords: '[]',
      mod_stats: JSON.stringify({ qimen: 2, liuyao: 1 }),
      push_priority: 'normal',
    };
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => existing), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
    });

    // This is the 4th ask-type (qimen 2+1=3, +1 more = 4 total ask-type)
    const result = mergeProfile(db, 'user-3', 'meihua', {}, {}, '');
    expect(result.ok).toBe(true);
    expect(result.priority).toBe('high');
  });

  test('关注领域 ≥4 → push_priority 升级为 high', () => {
    const db = createMockDb();
    const existing = {
      user_id: 'user-4',
      focus_areas: JSON.stringify(['命格', '运势', '健康', '财运']),
      concern_keywords: '[]',
      mod_stats: JSON.stringify({ bazi: 1 }),
      push_priority: 'normal',
    };
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => existing), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
    });

    const result = mergeProfile(db, 'user-4', 'fengshui', {}, {}, '');
    expect(result.ok).toBe(true);
    expect(result.priority).toBe('high');
  });

  test('resultData 提取 dayMaster 并推断五行', () => {
    const db = createMockDb();
    db.prepare.mockImplementation(() => ({
      get: jest.fn(() => null),
      all: jest.fn(() => []),
      run: jest.fn(() => ({ lastInsertRowid: 1 })),
    }));

    const result = mergeProfile(db, 'user-5', 'bazi', {}, { dayMaster: '丙火' }, '');
    expect(result.ok).toBe(true);
  });

  test('异常捕获 → { ok: false, error }', () => {
    const db = createMockDb();
    db.prepare.mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const result = mergeProfile(db, 'user-err', 'bazi', {}, {}, '');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('DB connection failed');
  });

  test('mod_stats 递增', () => {
    const db = createMockDb();
    const existing = {
      user_id: 'user-6',
      focus_areas: '[]',
      concern_keywords: '[]',
      mod_stats: JSON.stringify({ bazi: 5 }),
      push_priority: 'normal',
    };
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => existing), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
    });

    const result = mergeProfile(db, 'user-6', 'bazi', {}, {}, '');
    expect(result.ok).toBe(true);
    expect(result.topMod).toBe('bazi');
  });
});

// ─────────────────────────────────────────────
// generateYearlyPush
// ─────────────────────────────────────────────
describe('generateYearlyPush(profile, year)', () => {
  test('生成推送文案包含年份', () => {
    const profile = {
      xi_ele: '木',
      day_master: '甲木',
      zodiac: '龙',
      lack_wuxing: '',
      focus_areas: JSON.stringify(['事业']),
      concern_keywords: JSON.stringify(['工作']),
      mod_stats: JSON.stringify({ bazi: 3 }),
      display_name: '张三',
    };
    const result = generateYearlyPush(profile, 2025);
    expect(result).toContain('2025');
    expect(result).toContain('张三');
  });

  test('缺行补救段落生成', () => {
    const profile = {
      xi_ele: '金',
      day_master: '庚金',
      zodiac: '鼠',
      lack_wuxing: '木',
      focus_areas: JSON.stringify(['事业']),
      concern_keywords: '[]',
      mod_stats: '{}',
    };
    const result = generateYearlyPush(profile, 2025);
    expect(result).toContain('缺木');
  });

  test('无关注领域 → 综合建议', () => {
    const profile = {
      xi_ele: '',
      day_master: '',
      zodiac: '',
      lack_wuxing: '',
      focus_areas: '[]',
      concern_keywords: '[]',
      mod_stats: '{}',
    };
    const result = generateYearlyPush(profile, 2025);
    expect(result).toContain('综合建议');
  });

  test('包含健康关注 → 生成养生段落', () => {
    const profile = {
      xi_ele: '木',
      day_master: '甲木',
      zodiac: '虎',
      lack_wuxing: '',
      focus_areas: JSON.stringify(['健康']),
      concern_keywords: '[]',
      mod_stats: '{}',
    };
    const result = generateYearlyPush(profile, 2025);
    expect(result).toContain('健康养生');
  });

  test('关键词呼应段落', () => {
    const profile = {
      xi_ele: '火',
      day_master: '丙火',
      zodiac: '马',
      lack_wuxing: '',
      focus_areas: JSON.stringify(['财运']),
      concern_keywords: JSON.stringify(['投资', '股票', '理财']),
      mod_stats: '{}',
    };
    const result = generateYearlyPush(profile, 2025);
    expect(result).toContain('投资');
  });
});

// ─────────────────────────────────────────────
// hasPushed
// ─────────────────────────────────────────────
describe('hasPushed(db, userId, year)', () => {
  test('已推送 → 返回记录', () => {
    const db = createMockDb();
    const pushRecord = { id: 10, status: 'sent', content: '...', sent_at: '2025-01-01', profile_snapshot: '{}' };
    db.prepare.mockImplementation(() => ({
      get: jest.fn(() => pushRecord),
      all: jest.fn(() => []),
      run: jest.fn(),
    }));

    const result = hasPushed(db, 'user-1', 2025);
    expect(result).toEqual(pushRecord);
  });

  test('未推送 → 返回 undefined', () => {
    const db = createMockDb();
    db.prepare.mockImplementation(() => ({
      get: jest.fn(() => undefined),
      all: jest.fn(() => []),
      run: jest.fn(),
    }));

    const result = hasPushed(db, 'user-1', 2025);
    expect(result).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// savePush
// ─────────────────────────────────────────────
describe('savePush(db, userId, year, content, profileSnapshot)', () => {
  test('新推送 → INSERT', () => {
    const db = createMockDb();
    // First prepare (hasPushed SELECT) returns undefined, second (INSERT) returns lastInsertRowid
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => undefined), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn(() => ({ lastInsertRowid: 42 })) };
    });

    const result = savePush(db, 'user-1', 2025, '推送内容', '{}');
    expect(result.ok).toBe(true);
    expect(result.id).toBe(42);
    expect(result.updated).toBe(false);
  });

  test('已存在 → UPDATE', () => {
    const db = createMockDb();
    const existing = { id: 5, status: 'sent', content: 'old', sent_at: '2025-01-01', profile_snapshot: '{}' };
    db.prepare.mockImplementation((sql) => {
      if (sql.startsWith('SELECT')) {
        return { get: jest.fn(() => existing), all: jest.fn(() => []), run: jest.fn() };
      }
      return { get: jest.fn(() => null), all: jest.fn(() => []), run: jest.fn() };
    });

    const result = savePush(db, 'user-1', 2025, '新内容', '{}');
    expect(result.ok).toBe(true);
    expect(result.id).toBe(5);
    expect(result.updated).toBe(true);
  });

  test('异常 → { ok: false, error }', () => {
    const db = createMockDb();
    db.prepare.mockImplementation(() => {
      throw new Error('DB error');
    });

    const result = savePush(db, 'user-1', 2025, 'content', '{}');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

// ─────────────────────────────────────────────
// 导出常量
// ─────────────────────────────────────────────
describe('导出常量', () => {
  test('WUXING_META 包含五行', () => {
    expect(WUXING_META['金']).toBeDefined();
    expect(WUXING_META['木']).toBeDefined();
    expect(WUXING_META['水']).toBeDefined();
    expect(WUXING_META['火']).toBeDefined();
    expect(WUXING_META['土']).toBeDefined();
    expect(WUXING_META['金'].方).toBe('西');
  });

  test('DAY_MASTER_ELE 天干→五行映射正确', () => {
    expect(DAY_MASTER_ELE['甲']).toBe('木');
    expect(DAY_MASTER_ELE['乙']).toBe('木');
    expect(DAY_MASTER_ELE['丙']).toBe('火');
    expect(DAY_MASTER_ELE['壬']).toBe('水');
    expect(DAY_MASTER_ELE['戊']).toBe('土');
    expect(DAY_MASTER_ELE['庚']).toBe('金');
  });
});
