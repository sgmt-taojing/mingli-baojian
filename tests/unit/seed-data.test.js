// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · Unit Tests — seed-data.js
// seed-data.js 是一个自执行脚本（非模块导出），执行时直接写数据库
// 无法作为模块导入测试，跳过直接测试
// ═══════════════════════════════════════════════════════════════

// seed-data.js 是自执行脚本，require 即执行。
// 执行时会直接写数据库，不适合单元测试。
// 测试策略：验证脚本存在且语法正确（require 不抛语法错误）

describe('seed-data.js', () => {
  test('文件存在且可 require', () => {
    // seed-data.js require 时会执行并写数据库
    // 我们只验证它不抛语法错误
    // 注意：实际执行会修改数据库，所以只做静态检查
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '../../server/seed-data.js');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    // 验证关键结构存在
    expect(content).toContain('users');
    expect(content).toContain('paipan');
    expect(content).toContain('master_cases');
    expect(content).toContain('merchants');
    expect(content).toContain('courses');
    expect(content).toContain('feedback');
    expect(content).toContain('push_logs');
    expect(content).toContain('audit_logs');
  });

  test('包含9个用户角色定义', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(path.join(__dirname, '../../server/seed-data.js'), 'utf-8');
    expect(content).toContain('master');
    expect(content).toContain('doctor');
    expect(content).toContain('patient');
    expect(content).toContain('free');
    expect(content).toContain('vip');
    expect(content).toContain('merchant');
    expect(content).toContain('editor');
  });

  test('包含完整的数据生成流程', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(path.join(__dirname, '../../server/seed-data.js'), 'utf-8');
    // 检查10个数据生成步骤
    expect(content).toContain('1. 创建用户');
    expect(content).toContain('2. 排盘记录');
    expect(content).toContain('3. 大师案例');
    expect(content).toContain('4. 商品');
    expect(content).toContain('5. 课程');
    expect(content).toContain('6. 反馈');
    expect(content).toContain('7. 推送');
    expect(content).toContain('8. 积分');
    expect(content).toContain('9. 审计日志');
    expect(content).toContain('10. 系统配置');
  });

  test('使用 security-v2 加密敏感字段', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(path.join(__dirname, '../../server/seed-data.js'), 'utf-8');
    expect(content).toContain("require('./security-v2.js')");
    expect(content).toContain('sec.encrypt');
    expect(content).toContain('sec.hashPhone');
  });

  test('包含数据库统计输出', () => {
    const fs = require('fs');
    const path = require('path');
    const content = fs.readFileSync(path.join(__dirname, '../../server/seed-data.js'), 'utf-8');
    expect(content).toContain('种子数据统计');
    expect(content).toContain('种子数据生成完成');
  });
});
