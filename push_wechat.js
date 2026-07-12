#!/usr/bin/env node
/**
 * 易道智鉴 · 微信推送封装
 * 
 * 用法:
 *   node push_wechat.js full      # 早6点：推送当天内容
 *   node push_wechat.js tomorrow  # 晚6点：推送次日内容
 * 
 * 推送渠道: openclaw-weixin
 * 目标: o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat
 */

const { execSync } = require('child_process');
const path = require('path');

const TARGET = 'o9cq806By5E5wR-Z-C1Yp3YaUNn8@im.wechat';
const PROJECT_DIR = path.resolve(__dirname);

const format = process.argv[2] || 'full';

// 生成推送内容
try {
  const content = execSync(`node ${path.join(PROJECT_DIR, 'daily_push.js')} ${format}`, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    timeout: 30000
  }).trim();

  if (!content) {
    console.error('推送内容为空，跳过发送');
    process.exit(1);
  }

  // 输出推送指令（供 cron agent_task 使用）
  // 也可以直接调用 openclaw message send
  console.log('=== PUSH_CONTENT_START ===');
  console.log(content);
  console.log('=== PUSH_CONTENT_END ===');
  console.log(`TARGET: ${TARGET}`);
  console.log('ACTION: Send the content above to the target via WeChat (openclaw-weixin channel)');
} catch(err) {
  console.error('推送生成失败:', err.message);
  process.exit(1);
}
