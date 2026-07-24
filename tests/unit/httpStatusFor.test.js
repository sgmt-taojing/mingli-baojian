// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — api-response.js httpStatusFor
// ═══════════════════════════════════════════════════════════════

const { httpStatusFor, ERROR_CODES } = require('../../server/api-response.js');

describe('httpStatusFor', () => {
  test('SUCCESS (0) → 200', () => {
    expect(httpStatusFor(ERROR_CODES.SUCCESS)).toBe(200);
    expect(httpStatusFor(0)).toBe(200);
  });

  test('PARAM_INVALID (400001) → 400', () => {
    expect(httpStatusFor(ERROR_CODES.PARAM_INVALID)).toBe(400);
  });

  test('UNAUTHORIZED (401001) → 401', () => {
    expect(httpStatusFor(ERROR_CODES.UNAUTHORIZED)).toBe(401);
  });

  test('TOKEN_EXPIRED (401002) → 401', () => {
    expect(httpStatusFor(ERROR_CODES.TOKEN_EXPIRED)).toBe(401);
  });

  test('FORBIDDEN (403001) → 403', () => {
    expect(httpStatusFor(ERROR_CODES.FORBIDDEN)).toBe(403);
  });

  test('NOT_FOUND (404001) → 404', () => {
    expect(httpStatusFor(ERROR_CODES.NOT_FOUND)).toBe(404);
  });

  test('CONFLICT (409001) → 409', () => {
    expect(httpStatusFor(ERROR_CODES.CONFLICT)).toBe(409);
  });

  test('RATE_LIMIT_GLOBAL (429001) → 429', () => {
    expect(httpStatusFor(ERROR_CODES.RATE_LIMIT_GLOBAL)).toBe(429);
  });

  test('RATE_LIMIT_KB (429002) → 429', () => {
    expect(httpStatusFor(ERROR_CODES.RATE_LIMIT_KB)).toBe(429);
  });

  test('SERVER_ERROR (500001) → 500', () => {
    expect(httpStatusFor(ERROR_CODES.SERVER_ERROR)).toBe(500);
  });

  test('AI_UNAVAILABLE (503001) → 503', () => {
    expect(httpStatusFor(ERROR_CODES.AI_UNAVAILABLE)).toBe(503);
  });

  test('DB_UNAVAILABLE (503002) → 503', () => {
    expect(httpStatusFor(ERROR_CODES.DB_UNAVAILABLE)).toBe(503);
  });

  test('未知码 → 200', () => {
    expect(httpStatusFor(999)).toBe(200);
    expect(httpStatusFor(12345)).toBe(200);
    expect(httpStatusFor(-1)).toBe(200);
  });

  test('ERROR_CODES 对象包含所有预期键', () => {
    const expectedKeys = [
      'SUCCESS', 'PARAM_INVALID', 'UNAUTHORIZED', 'TOKEN_EXPIRED',
      'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'RATE_LIMIT_GLOBAL',
      'RATE_LIMIT_KB', 'SERVER_ERROR', 'AI_UNAVAILABLE', 'DB_UNAVAILABLE',
    ];
    for (const key of expectedKeys) {
      expect(ERROR_CODES).toHaveProperty(key);
      expect(typeof ERROR_CODES[key]).toBe('number');
    }
  });
});
