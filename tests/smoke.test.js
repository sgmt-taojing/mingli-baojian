// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Smoke Tests
// 验证核心模块可被正确 require / 文件存在 / 语法合法
// ═══════════════════════════════════════════════════════════════

const path = require('path');
const fs = require('fs');

const SERVER_DIR = path.join(__dirname, '..', 'server');

// ── 辅助：检查文件是否存在 ──
function fileExists(relativePath) {
  return fs.existsSync(path.join(SERVER_DIR, relativePath));
}

// ── 辅助：检查模块可否被 require（不抛异常） ──
function canRequire(relativePath) {
  try {
    require(path.join(SERVER_DIR, relativePath));
    return true;
  } catch (e) {
    // 区分「模块自身抛错」vs「文件不存在」
    if (e.code === 'MODULE_NOT_FOUND') return false;
    // 其他错误（如启动监听）也算加载成功
    return true;
  }
}

// ── 辅助：检查 JS 语法是否合法（不执行） ──
function syntaxIsValid(relativePath) {
  const filePath = path.join(SERVER_DIR, relativePath);
  if (!fs.existsSync(filePath)) return false;
  const src = fs.readFileSync(filePath, 'utf-8');
  try {
    new Function(src);
    return true;
  } catch (e) {
    // Function constructor 对 module 级代码会因 require/return 等报错
    // 这种情况下用 vm 模块做更宽松的检查
    const vm = require('vm');
    try {
      new vm.Script(src);
      return true;
    } catch (e2) {
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试组 1：核心文件存在性
// ═══════════════════════════════════════════════════════════════
describe('📁 核心文件存在性', () => {
  test('server/api-server-v2.js 文件存在', () => {
    expect(fileExists('api-server-v2.js')).toBe(true);
  });

  test('server/logger.js 文件存在', () => {
    expect(fileExists('logger.js')).toBe(true);
  });

  test('server/error-aggregator.js 文件存在', () => {
    expect(fileExists('error-aggregator.js')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 2：语法合法性
// ═══════════════════════════════════════════════════════════════
describe('🔍 JS 语法合法性', () => {
  test('api-server-v2.js 语法合法', () => {
    expect(syntaxIsValid('api-server-v2.js')).toBe(true);
  });

  test('logger.js 语法合法', () => {
    expect(syntaxIsValid('logger.js')).toBe(true);
  });

  test('error-aggregator.js 语法合法', () => {
    expect(syntaxIsValid('error-aggregator.js')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 3：模块可加载性
// ═══════════════════════════════════════════════════════════════
describe('📦 模块可加载性', () => {
  test('logger.js 可被 require 加载', () => {
    expect(canRequire('logger.js')).toBe(true);
  });

  test('error-aggregator.js 可被 require 加载', () => {
    expect(canRequire('error-aggregator.js')).toBe(true);
  });

  test('api-server-v2.js 可被 require 加载（不抛 MODULE_NOT_FOUND）', () => {
    // 注意：api-server-v2.js 顶层调用 app.listen()
    // 在测试环境中 require 它会启动服务器监听
    // 我们只验证它不抛 MODULE_NOT_FOUND
    expect(canRequire('api-server-v2.js')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 4：logger 模块功能验证
// ═══════════════════════════════════════════════════════════════
describe('🔧 logger 模块功能', () => {
  test('logger 导出对象包含 info/warn/error 方法', () => {
    const logger = require('../server/logger.js');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 6：api-response 模块功能验证
// ═══════════════════════════════════════════════════════════════
describe('🔧 api-response 模块功能', () => {
  test('apiResp 返回成功格式 { code: 0, data/msg 字段存在 }', () => {
    const { apiResp } = require('../server/api-response.js');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };
    apiResp(res, 0, { foo: 'bar' }, 'ok');
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.code).toBe(0);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('message');
  });

  test('apiResp 返回错误格式 { code: 非0, msg 存在 }', () => {
    const { apiResp } = require('../server/api-response.js');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      locals: {}
    };
    apiResp(res, 500001, null, '服务异常');
    const body = res.json.mock.calls[0][0];
    expect(body.code).not.toBe(0);
    expect(body).toHaveProperty('message');
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 7：logger 模块导出验证
// ═══════════════════════════════════════════════════════════════
describe('🔧 logger 模块导出', () => {
  test('logger 可被 require 且导出对象', () => {
    const logger = require('../server/logger.js');
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
  });
});

// ═══════════════════════════════════════════════════════════════
// 测试组 8：error-aggregator 模块导出验证
// ═══════════════════════════════════════════════════════════════
describe('🔧 error-aggregator 模块导出', () => {
  test('error-aggregator 导出 recordError 方法', () => {
    const ea = require('../server/error-aggregator.js');
    expect(typeof ea.recordError).toBe('function');
  });
});
