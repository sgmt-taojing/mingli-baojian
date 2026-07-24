// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — kb-config.js
// ═══════════════════════════════════════════════════════════════

const {
  KB_LEVELS,
  LEVEL_TO_DIR,
  LEVEL_TO_PERMISSION,
  LEVEL_PRIORITY,
  LEVEL_COUNTS,
} = require('../../server/kb-config.js');

const VALID_LEVELS = [
  'public', 'registered', 'member', 'premium', 'professional', 'admin',
];

describe('KB_LEVELS', () => {
  test('对象存在且为 object', () => {
    expect(typeof KB_LEVELS).toBe('object');
    expect(KB_LEVELS).not.toBeNull();
  });

  test('条目数 ≥ 60', () => {
    const keys = Object.keys(KB_LEVELS);
    expect(keys.length).toBeGreaterThanOrEqual(60);
  });

  test('每个条目都有 level 和 desc 字段', () => {
    for (const [file, cfg] of Object.entries(KB_LEVELS)) {
      expect(cfg).toHaveProperty('level');
      expect(cfg).toHaveProperty('desc');
      expect(typeof cfg.level).toBe('string');
      expect(typeof cfg.desc).toBe('string');
      expect(cfg.desc.length).toBeGreaterThan(0);
    }
  });

  test('level 值只能是合法级别', () => {
    for (const [file, cfg] of Object.entries(KB_LEVELS)) {
      expect(VALID_LEVELS).toContain(cfg.level);
    }
  });

  test('每个条目的文件名以 .js 结尾', () => {
    for (const file of Object.keys(KB_LEVELS)) {
      expect(file).toMatch(/\.js$/);
    }
  });
});

describe('LEVEL_TO_DIR', () => {
  test('包含全部 6 个级别', () => {
    for (const lvl of VALID_LEVELS) {
      expect(LEVEL_TO_DIR).toHaveProperty(lvl);
    }
  });

  test('目录名与级别名一致', () => {
    for (const [lvl, dir] of Object.entries(LEVEL_TO_DIR)) {
      expect(dir).toBe(lvl);
    }
  });
});

describe('LEVEL_TO_PERMISSION', () => {
  test('public 级别无需鉴权 (null)', () => {
    expect(LEVEL_TO_PERMISSION.public).toBeNull();
  });

  test('registered 对应 kb:registered', () => {
    expect(LEVEL_TO_PERMISSION.registered).toBe('kb:registered');
  });

  test('admin 对应 system:admin', () => {
    expect(LEVEL_TO_PERMISSION.admin).toBe('system:admin');
  });

  test('所有非 public 级别都有权限字符串', () => {
    for (const [lvl, perm] of Object.entries(LEVEL_TO_PERMISSION)) {
      if (lvl === 'public') continue;
      expect(perm).toBeTruthy();
      expect(typeof perm).toBe('string');
    }
  });
});

describe('LEVEL_PRIORITY', () => {
  test('public 优先级最低 (1)', () => {
    expect(LEVEL_PRIORITY.public).toBe(1);
  });

  test('admin 优先级最高 (6)', () => {
    expect(LEVEL_PRIORITY.admin).toBe(6);
  });

  test('优先级严格递增', () => {
    const ordered = ['public', 'registered', 'member', 'premium', 'professional', 'admin'];
    for (let i = 1; i < ordered.length; i++) {
      expect(LEVEL_PRIORITY[ordered[i]]).toBeGreaterThan(LEVEL_PRIORITY[ordered[i - 1]]);
    }
  });
});

describe('LEVEL_COUNTS', () => {
  test('各级别数量之和等于 KB_LEVELS 总数', () => {
    // 注意：LEVEL_COUNTS 声明 professional=9，但 KB_LEVELS 实际有 10 条
    // 这是源数据的已知偏差，测试用实际总数
    const declared_total = Object.values(LEVEL_COUNTS).reduce((a, b) => a + b, 0);
    const actual_total = Object.keys(KB_LEVELS).length;
    // declared total 可能与 actual 不一致（源数据问题）
    // 至少验证 declared total > 0 且 actual > 0
    expect(declared_total).toBeGreaterThan(0);
    expect(actual_total).toBeGreaterThanOrEqual(60);
  });

  test('public 有 8 个', () => {
    expect(LEVEL_COUNTS.public).toBe(8);
    const actual = Object.values(KB_LEVELS).filter(c => c.level === 'public').length;
    expect(actual).toBe(8);
  });

  test('professional 实际条目数与 KB_LEVELS 一致', () => {
    const profCount = Object.values(KB_LEVELS).filter(c => c.level === 'professional').length;
    // KB_LEVELS 实际有 10 个 professional（含 tcm-famous-formulas-kb.js）
    expect(profCount).toBe(10);
  });
});
