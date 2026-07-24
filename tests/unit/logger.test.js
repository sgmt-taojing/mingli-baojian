// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — logger.js
// ═══════════════════════════════════════════════════════════════

const logger = require('../../server/logger.js');

describe('logger', () => {
  test('logger 是对象而非 undefined', () => {
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
  });

  test('logger.info 是函数', () => {
    expect(typeof logger.info).toBe('function');
  });

  test('logger.warn 是函数', () => {
    expect(typeof logger.warn).toBe('function');
  });

  test('logger.error 是函数', () => {
    expect(typeof logger.error).toBe('function');
  });

  test('logger.info 调用不抛异常', () => {
    expect(() => logger.info('test info message')).not.toThrow();
  });

  test('logger.warn 调用不抛异常', () => {
    expect(() => logger.warn('test warn message')).not.toThrow();
  });

  test('logger.error 调用不抛异常', () => {
    expect(() => logger.error('test error message')).not.toThrow();
  });
});
