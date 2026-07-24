// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — error-aggregator.js
// ═══════════════════════════════════════════════════════════════

const { recordError, purgeExpired } = require('../../server/error-aggregator.js');

describe('errorAggregator', () => {
  test('recordError 方法存在', () => {
    expect(typeof recordError).toBe('function');
  });

  test('purgeExpired 方法存在', () => {
    expect(typeof purgeExpired).toBe('function');
  });

  test('recordError 调用不抛异常', () => {
    expect(() => recordError('500001', 'GET', '/api/test')).not.toThrow();
  });

  test('多次 recordError 同一 groupKey 不抛异常', () => {
    expect(() => {
      for (let i = 0; i < 12; i++) {
        recordError('500001', 'POST', '/api/ai/chat');
      }
    }).not.toThrow();
  });

  test('purgeExpired 调用不抛异常', () => {
    expect(() => purgeExpired()).not.toThrow();
  });
});
