// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · 错误聚合器（OBSERVABILITY_STANDARD §5）
// ═══════════════════════════════════════════════════════════════
//
// 按 errorCode × endpoint 分组，5 分钟滚动窗口
//   ≤ 3 次   → 正常记录
//   4-10 次  → WARN  error.aggregate.warning
//   > 10 次  → ERROR error.aggregate.critical + 写 data/alerts/YYYY-MM-DD.jsonl
//
// groupKey = `${errorCode}::${method} ${path}`
// ═══════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');

const WINDOW_MS = 5 * 60 * 1000; // 5 分钟滚动窗口
const WARN_THRESHOLD = 4;
const CRITICAL_THRESHOLD = 11;

const windows = new Map();

/**
 * 记录一次错误发生，触发聚合告警
 * @param {string} errorCode - 错误码（如 '500001'）
 * @param {string} method    - HTTP 方法（如 'POST'）
 * @param {string} reqPath   - 请求路径（如 '/api/ai/chat'）
 */
function recordError(errorCode, method, reqPath) {
  const key = `${errorCode}::${method} ${reqPath}`;
  const now = Date.now();

  let entry = windows.get(key);
  if (!entry || (now - entry.firstAt) > WINDOW_MS) {
    entry = { count: 0, firstAt: now, warned: false, critical: false };
  }

  entry.count++;
  windows.set(key, entry);

  // 4 次 → WARN（仅首次触发）
  if (entry.count === WARN_THRESHOLD) {
    logger.warn({
      module: 'aggregator',
      event: 'error.aggregate.warning',
      groupKey: key,
      count: entry.count,
      windowMs: WINDOW_MS,
    }, 'freq rising');
  }

  // 11 次 → ERROR + 写 alerts 文件（仅首次触发）
  if (entry.count === CRITICAL_THRESHOLD) {
    logger.error({
      module: 'aggregator',
      event: 'error.aggregate.critical',
      groupKey: key,
      count: entry.count,
      windowMs: WINDOW_MS,
    }, 'freq critical');

    _writeAlert(key, entry.count, now);
  }
}

/**
 * 写入 data/alerts/YYYY-MM-DD.jsonl
 */
function _writeAlert(groupKey, count, ts) {
  try {
    const dir = path.join(__dirname, '..', 'data', 'alerts');
    fs.mkdirSync(dir, { recursive: true });
    const dateStr = new Date(ts).toISOString().slice(0, 10);
    const file = path.join(dir, dateStr + '.jsonl');
    const record = {
      ts: new Date(ts).toISOString(),
      event: 'error.aggregate.critical',
      groupKey,
      count,
      threshold: CRITICAL_THRESHOLD,
    };
    fs.appendFileSync(file, JSON.stringify(record) + '\n');
  } catch (e) {
    logger.error({ module: 'aggregator', err: e }, 'failed to write alert file');
  }
}

/**
 * 清理过期窗口（可在心跳/定时器中调用）
 */
function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of windows) {
    if (now - entry.firstAt > WINDOW_MS) {
      windows.delete(key);
    }
  }
}

module.exports = { recordError, purgeExpired };
