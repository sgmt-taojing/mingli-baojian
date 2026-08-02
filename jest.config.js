// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Jest 配置
// ═══════════════════════════════════════════════════════════════

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: [
    'node_modules',
    // node:test runner files (not Jest-compatible)
    'tests/unit/r89-peripheral.test.js',
    'tests/unit/r89-paipan-input.test.js',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/api-server-v2.js',
    '!server/kb-store/**',
    // 历史上未覆盖且与当前 API 路径无关的文件
    '!server/api-server.js',
    '!server/luzong-ingest-v1.js',
    '!server/luzong2-ingest-v1.js',
    '!server/glass-stream.js',
    '!server/seed-data.js',
    '!server/middleware/auth.js',
    '!server/routes/__test.js',
    '!server/routes/yuanzhu-routes.js'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // SQLite 文件在并行 worker 下会 "database is locked"，强制串行
  maxWorkers: 1
};
