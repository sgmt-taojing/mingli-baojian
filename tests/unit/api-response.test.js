// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — api-response.js
// ═══════════════════════════════════════════════════════════════

const { apiResp, ok, fail, bad, ERROR_CODES } = require('../../server/api-response.js');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {}
  };
}

describe('apiResp', () => {
  test('成功格式：code=0, data 存在, message 存在', () => {
    const res = mockRes();
    apiResp(res, 0, { items: [] }, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(0);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('message');
  });

  test('错误格式：code 非0, message 存在', () => {
    const res = mockRes();
    apiResp(res, ERROR_CODES.SERVER_ERROR, null, '服务异常');
    const body = res.json.mock.calls[0][0];
    expect(body.code).not.toBe(0);
    expect(body.code).toBe(500001);
    expect(body.message).toBe('服务异常');
  });

  test('null data 边界：data 字段为 null', () => {
    const res = mockRes();
    apiResp(res, ERROR_CODES.NOT_FOUND, null, '资源不存在');
    const body = res.json.mock.calls[0][0];
    expect(body.data).toBeNull();
  });

  test('undefined data 边界：data 默认填充 null', () => {
    const res = mockRes();
    apiResp(res, 0, undefined, undefined);
    const body = res.json.mock.calls[0][0];
    expect(body.data).toBeNull();
  });

  test('默认 message：code=0 时为 "ok"', () => {
    const res = mockRes();
    apiResp(res, 0, { foo: 1 });
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('ok');
  });

  test('默认 message：code 非0 时为 "未知错误"', () => {
    const res = mockRes();
    apiResp(res, 999, null);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('未知错误');
  });
});

describe('ok 封装', () => {
  test('ok 调用 apiResp with code=0', () => {
    const res = mockRes();
    ok(res, { id: 1 }, '成功');
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(0);
    expect(body.data).toEqual({ id: 1 });
  });
});

describe('fail 封装', () => {
  test('fail 调用 apiResp with 非0 code', () => {
    const res = mockRes();
    fail(res, ERROR_CODES.PARAM_INVALID, '参数错误');
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(400001);
    expect(body.message).toBe('参数错误');
  });
});

describe('bad 封装', () => {
  test('bad 默认 400001', () => {
    const res = mockRes();
    bad(res, '请求不合法');
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(400001);
  });
});
