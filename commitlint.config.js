/**
 * commitlint 配置 · 命理宝鉴
 * 规范：Conventional Commits 1.0.0 + Angular 风格
 * 文档：https://commitlint.js.org
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举（命理宝jian定制）
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复
        'docs',     // 文档
        'style',    // 格式（不影响代码运行）
        'refactor', // 重构（非新功能非修复）
        'perf',     // 性能优化
        'test',     // 测试
        'build',    // 构建系统/外部依赖
        'ci',       // CI 配置文件和脚本
        'chore',    // 其他修改（构建过程或辅助工具）
        'revert',   // 回退
        'audit',    // 安全审计（命理宝jian定制）
        'sync',     // 同步上游/版本（命理宝jian定制）
        'deploy',   // 部署相关（命理宝jian定制）
      ],
    ],
    // subject 不允许为空
    'subject-empty': [2, 'never'],
    // subject 长度限制
    'subject-max-length': [2, 'always', 72],
    // subject 小写开头（英文）
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    // header 总长度
    'header-max-length': [2, 'always', 100],
  },
};