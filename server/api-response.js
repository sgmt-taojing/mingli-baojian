// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 统一 API 响应壳
// 标准文档: docs/API_STANDARD.md
// ═══════════════════════════════════════════════════════════════

// 错误码表 (节选，完整版见 docs/ERROR_CODE_TABLE.md)
const ERROR_CODES = {
  SUCCESS: 0,
  PARAM_INVALID: 400001,
  UNAUTHORIZED: 401001,
  TOKEN_EXPIRED: 401002,
  FORBIDDEN: 403001,
  NOT_FOUND: 404001,
  CONFLICT: 409001,
  RATE_LIMIT_GLOBAL: 429001,
  RATE_LIMIT_KB: 429002,
  SERVER_ERROR: 500001,
  AI_UNAVAILABLE: 503001,
  DB_UNAVAILABLE: 503002
};

// HTTP 状态码映射
function httpStatusFor(code) {
  if (code === 0) return 200;
  const prefix = Math.floor(code / 1000);
  const map = {
    400: 400, 401: 401, 403: 403, 404: 404,
    409: 409, 429: 429, 500: 500, 503: 503
  };
  return map[prefix] || 200;
}

/**
 * 统一响应函数
 * @param {Response} res Express response
 * @param {number} code 错误码（0=成功）
 * @param {*} data 业务数据
 * @param {string} message 提示信息
 */
function apiResp(res, code, data, message) {
  const httpCode = httpStatusFor(code);
  const body = {
    code,
    message: message || (code === 0 ? 'ok' : '未知错误'),
    data: data === undefined ? null : data,
    traceId: res.locals.traceId || null,
    timestamp: new Date().toISOString()
  };
  // 旧版兼容：code=0 时直接返回 data 字段（保留向下兼容窗口）
  if (code === 0 && data && typeof data === 'object' && !Array.isArray(data)) {
    // 新壳优先，但保留旧键兼容
    return res.status(httpCode).json({ ...body, ...data, _v1: true });
  }
  return res.status(httpCode).json(body);
}

// 便捷封装
const ok = (res, data, msg) => apiResp(res, 0, data, msg);
const fail = (res, code, msg) => apiResp(res, code, null, msg);
const bad = (res, msg) => apiResp(res, 400001, null, msg);
const unauth = (res, msg = '请先登录') => apiResp(res, 401001, null, msg);
const expired = (res) => apiResp(res, 401002, null, '登录已过期');
const forbid = (res, msg = '没有权限') => apiResp(res, 403001, null, msg);
const notFound = (res, msg = '资源不存在') => apiResp(res, 404001, null, msg);
const rateLimit = (res) => apiResp(res, 429001, null, '请求过于频繁，请稍后再试');
const serverErr = (res, e) => {
  console.error('[apiResp 500]', e);
  return apiResp(res, 500001, null, '服务异常，请稍后再试');
};
const aiFallback = (res, data) => apiResp(res, 503001, data, 'AI 暂时不可用，已为您切换知识库模式');

module.exports = {
  apiResp, ok, fail, bad, unauth, expired, forbid, notFound,
  rateLimit, serverErr, aiFallback,
  ERROR_CODES, httpStatusFor
};
