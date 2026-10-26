const { spawnSync } = require('node:child_process');
const path = require('node:path');

describe('知识库统一入库契约', () => {
  test('临时 SQLite 通过插入、更新、查重与域边界测试', () => {
    const root = path.resolve(__dirname, '../..');
    const script = path.join(__dirname, 'kb_ingest_contract.py');
    const result = spawnSync(process.env.PYTHON || 'python3', [script], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    });
    expect(result.stderr).toContain('OK');
    expect(result.status).toBe(0);
  });
});
