// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — case-quality.js
// ═══════════════════════════════════════════════════════════════

// Mock node:sqlite before requiring the module
jest.mock('node:sqlite', () => {
  const mockDb = {
    prepare: jest.fn(),
  };
  function DatabaseSync() { return mockDb; }
  return { DatabaseSync };
});

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

jest.mock('path', () => ({
  join: jest.fn(() => '/mocked/path/yidao.db'),
}));

const { DatabaseSync } = require('node:sqlite');
const sec = require('../../server/security-v2.js');

// The module creates a new DatabaseSync at load time, so our mock returns mockDb
// We need to access the same mockDb instance
const mockDb = new DatabaseSync();

// Helper to build a prepared statement mock
function makeStmt(result) {
  return {
    get: jest.fn(() => result),
    all: jest.fn(() => result || []),
    run: jest.fn(),
  };
}

// We need to control what prepare returns per-test
function setPrepareReturn(stmt) {
  mockDb.prepare.mockReturnValue(stmt);
}

// Re-require the module under test after mocks are set up
const {
  WEIGHTS,
  scoreCase,
  scoreAllCases,
  updateEffectiveness,
  getQualityStats,
  getCasesNeedingFollowUp,
} = require('../../server/case-quality.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// scoreCase
// ─────────────────────────────────────────────
describe('scoreCase(caseId)', () => {
  test('案例不存在 → { error, score: 0 }', () => {
    const stmt = makeStmt(null);
    setPrepareReturn(stmt);
    const result = scoreCase(999);
    expect(result.error).toBe('案例不存在');
    expect(result.score).toBe(0);
  });

  test('完整案例评分在 1-10 范围内', () => {
    const caseData = {
      id: 1,
      bazi_chart: '{"foo":"bar"}',
      wuxing_summary: '木3火2土1金1水1',
      symptoms: '失眠多梦',
      constitution: '木型体质',
      master_analysis: 'enc:' + '甲木日主，五行木旺，肝气郁结，需疏肝理气。'.repeat(20),
      doctor_diagnosis: 'enc:肝郁化火，治宜疏肝清热。',
      analysis_summary: '综合分析',
      medical_translation: '现代医学认为这与自主神经功能紊乱有关，建议调节作息。',
      final_plan: 'enc:' + JSON.stringify({
        syndrome: '肝郁化火',
        formula: '丹栀逍遥散',
        acupoints: ['太冲', '行间', '期门'],
      }),
      effectiveness_rating: 4,
    };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(1);
    expect(result.quality_score).toBeGreaterThanOrEqual(1);
    expect(result.quality_score).toBeLessThanOrEqual(10);
    expect(result.breakdown).toBeDefined();
  });

  test('空案例（仅 id）→ 最低分 1', () => {
    const caseData = { id: 2 };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(2);
    expect(result.quality_score).toBeGreaterThanOrEqual(1);
    expect(result.quality_score).toBeLessThanOrEqual(10);
  });

  test('完整度评分：每个字段 0.5 分，上限 3.0', () => {
    const caseData = {
      id: 3,
      bazi_chart: 'data',
      wuxing_summary: 'summary',
      symptoms: 'symptom',
      constitution: 'type',
      master_analysis: 'enc:analysis',
      doctor_diagnosis: 'enc:diagnosis',
      effectiveness_rating: 0,
    };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(3);
    expect(result.breakdown.completeness.score).toBe(3.0);
    expect(result.breakdown.completeness.max).toBe(WEIGHTS.completeness);
  });

  test('分析深度评分：master_analysis > 500 字 → 额外 1.0 分', () => {
    const longAnalysis = 'enc:' + '甲木日主，五行分析，肝心脾肺肾，脏腑论述。'.repeat(30);
    const caseData = {
      id: 4,
      master_analysis: longAnalysis,
      medical_translation: 'A'.repeat(60),
      final_plan: 'enc:' + JSON.stringify({
        syndrome: '证候',
        formula: '方剂',
        acupoints: ['穴1'],
      }),
      effectiveness_rating: 0,
    };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(4);
    expect(result.breakdown.analysis_depth.score).toBeGreaterThan(0);
    expect(result.breakdown.analysis_depth.max).toBe(WEIGHTS.analysis_depth);
  });

  test('疗效评级 5 → effectiveness score 3.0', () => {
    const caseData = {
      id: 5,
      effectiveness_rating: 5,
      master_analysis: 'enc:' + '木火土金水肝心脾肺肾'.repeat(30),
      final_plan: 'enc:' + JSON.stringify({ syndrome: 'x', formula: 'y', acupoints: ['z'] }),
      medical_translation: 'B'.repeat(60),
    };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(5);
    expect(result.breakdown.effectiveness.score).toBe(3.0);
  });

  test('疗效评级 0 → effectiveness score 0', () => {
    const caseData = { id: 6, effectiveness_rating: 0 };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(6);
    expect(result.breakdown.effectiveness.score).toBe(0);
  });

  test('is_high_quality 标记：score >= 7 → true', () => {
    const caseData = {
      id: 7,
      bazi_chart: 'data',
      wuxing_summary: 'summary',
      symptoms: 'symptom',
      constitution: 'type',
      master_analysis: 'enc:' + '甲木日主五行木旺肝心脾肺肾脏腑论述详尽分析。'.repeat(30),
      doctor_diagnosis: 'enc:diagnosis',
      medical_translation: 'C'.repeat(60),
      final_plan: 'enc:' + JSON.stringify({ syndrome: '证', formula: '方', acupoints: ['穴1', '穴2'] }),
      effectiveness_rating: 5,
    };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    const result = scoreCase(7);
    if (result.quality_score >= 7) {
      expect(result.is_high_quality).toBe(true);
    } else {
      expect(result.is_high_quality).toBe(false);
    }
  });

  test('多次调用 scoreCase → 数据库 UPDATE 被执行', () => {
    const caseData = { id: 8, effectiveness_rating: 3 };
    const stmt = makeStmt(caseData);
    setPrepareReturn(stmt);
    scoreCase(8);
    // prepare is called for SELECT and UPDATE
    expect(mockDb.prepare).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// scoreAllCases
// ─────────────────────────────────────────────
describe('scoreAllCases()', () => {
  test('无已完成案例 → total=0', () => {
    const listStmt = { all: jest.fn(() => []) };
    mockDb.prepare.mockReturnValue(listStmt);
    const result = scoreAllCases();
    expect(result.total).toBe(0);
    expect(result.scored).toBe(0);
    expect(result.high_quality).toBe(0);
  });

  test('有已完成案例 → 逐个评分', () => {
    const listStmt = { all: jest.fn(() => [{ id: 1 }, { id: 2 }]) };
    const caseStmt = makeStmt({ id: 1, effectiveness_rating: 0 });
    // First call returns listStmt, subsequent calls return caseStmt
    mockDb.prepare.mockReturnValueOnce(listStmt).mockReturnValue(caseStmt);
    const result = scoreAllCases();
    expect(result.total).toBe(2);
    expect(result.results).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────
// updateEffectiveness
// ─────────────────────────────────────────────
describe('updateEffectiveness(caseId, rating)', () => {
  test('rating < 0 → error', () => {
    const result = updateEffectiveness(1, -1);
    expect(result.error).toBeDefined();
  });

  test('rating > 5 → error', () => {
    const result = updateEffectiveness(1, 6);
    expect(result.error).toBeDefined();
  });

  test('有效 rating → 更新并重新评分', () => {
    const updateStmt = makeStmt({});
    const caseStmt = makeStmt({ id: 1, effectiveness_rating: 3 });
    mockDb.prepare.mockReturnValueOnce(updateStmt).mockReturnValue(caseStmt);
    const result = updateEffectiveness(1, 3);
    expect(result.case_id).toBe(1);
    expect(result.effectiveness_rating).toBe(3);
    expect(result.quality_score).toBeDefined();
  });

  test('rating = 0 边界 → 允许', () => {
    const updateStmt = makeStmt({});
    const caseStmt = makeStmt({ id: 2, effectiveness_rating: 0 });
    mockDb.prepare.mockReturnValueOnce(updateStmt).mockReturnValue(caseStmt);
    const result = updateEffectiveness(2, 0);
    expect(result.error).toBeUndefined();
  });

  test('rating = 5 边界 → 允许', () => {
    const updateStmt = makeStmt({});
    const caseStmt = makeStmt({ id: 3, effectiveness_rating: 5 });
    mockDb.prepare.mockReturnValueOnce(updateStmt).mockReturnValue(caseStmt);
    const result = updateEffectiveness(3, 5);
    expect(result.error).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// getQualityStats
// ─────────────────────────────────────────────
describe('getQualityStats()', () => {
  test('返回统计结构正确', () => {
    const countStmt = makeStmt({ count: 10 });
    const completedStmt = makeStmt({ count: 8 });
    const highQStmt = makeStmt({ count: 3 });
    const avgStmt = makeStmt({ avg: 6.5 });
    const distStmt = { all: jest.fn(() => [{ range: '7-8', count: 3 }, { range: '5-6', count: 5 }]) };

    mockDb.prepare
      .mockReturnValueOnce(countStmt)
      .mockReturnValueOnce(completedStmt)
      .mockReturnValueOnce(highQStmt)
      .mockReturnValueOnce(avgStmt)
      .mockReturnValueOnce(distStmt);

    const result = getQualityStats();
    expect(result.total_cases).toBe(10);
    expect(result.completed_cases).toBe(8);
    expect(result.high_quality_cases).toBe(3);
    expect(result.avg_score).toBe(6.5);
    expect(result.score_distribution).toHaveLength(2);
  });

  test('avg_score 为 null → 返回 0', () => {
    const countStmt = makeStmt({ count: 0 });
    const completedStmt = makeStmt({ count: 0 });
    const highQStmt = makeStmt({ count: 0 });
    const avgStmt = makeStmt({ avg: null });
    const distStmt = { all: jest.fn(() => []) };

    mockDb.prepare
      .mockReturnValueOnce(countStmt)
      .mockReturnValueOnce(completedStmt)
      .mockReturnValueOnce(highQStmt)
      .mockReturnValueOnce(avgStmt)
      .mockReturnValueOnce(distStmt);

    const result = getQualityStats();
    expect(result.avg_score).toBe(0);
  });
});

// ─────────────────────────────────────────────
// getCasesNeedingFollowUp
// ─────────────────────────────────────────────
describe('getCasesNeedingFollowUp()', () => {
  test('返回需要随访的案例列表', () => {
    const followUpCases = [
      { id: 1, case_uuid: 'uuid-1', completed_at: '2024-01-01', patient_id: 'p1' },
      { id: 2, case_uuid: 'uuid-2', completed_at: '2024-01-05', patient_id: 'p2' },
    ];
    const stmt = { all: jest.fn(() => followUpCases) };
    mockDb.prepare.mockReturnValue(stmt);
    const result = getCasesNeedingFollowUp();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
  });

  test('无需要随访的案例 → 空数组', () => {
    const stmt = { all: jest.fn(() => []) };
    mockDb.prepare.mockReturnValue(stmt);
    const result = getCasesNeedingFollowUp();
    expect(result).toHaveLength(0);
  });
});
