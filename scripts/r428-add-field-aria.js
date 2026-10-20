#!/usr/bin/env node
// 给全站 select/textarea 自动加 aria-label（按 id/placeholder/onchange 推断）
const fs = require('fs');
const path = require('path');

const APP_DIR = 'app';

// id → 中文 label 映射（业务域）
const ID_LABELS = {
  // admin
  filterStatus: '按状态筛选', filterCategory: '按分类筛选', filterPriority: '按优先级筛选',
  batchAction: '批量操作', adminReply: '管理员回复',
  ingestText: 'JSON 文本粘贴', ingestSource: '知识来源',
  recipientAddress: '收货地址', recipientName: '收件人姓名', recipientPhone: '收件人电话',
  diagnosis: '辨证诊断', prescription: '处方', tcmFeedback: '中医反馈',
  // ai-assistant
  feedbackText: '智能助手反馈',
  // divination-shop
  searchInput: '搜索',
  // divination-hub etc
  sel1201: '选择项',
};

const PLACEHOLDER_LABELS = {
  'JSON Lines': 'JSON 数据',
  '详细地址': '详细地址',
  '收件人': '收件人信息',
  '反馈内容': '反馈内容',
  '反馈建议': '反馈建议',
  '管理员回复': '管理员回复',
  '回复内容': '回复内容',
  '辨证': '辨证',
  '处方': '处方',
};

function inferLabel(tag, raw) {
  const idMatch = raw.match(/\bid\s*=\s*"([^"]+)"/);
  const phMatch = raw.match(/\bplaceholder\s*=\s*"([^"]+)"/);
  
  if (idMatch && ID_LABELS[idMatch[1]]) return ID_LABELS[idMatch[1]];
  if (phMatch) {
    for (const [k, v] of Object.entries(PLACEHOLDER_LABELS)) {
      if (phMatch[1].includes(k)) return v;
    }
    return phMatch[1].slice(0, 30);
  }
  if (idMatch) {
    // camelCase 转中文
    const id = idMatch[1];
    const map = {
      Page: '页码', Size: '大小', Type: '类型', Mode: '模式',
      Year: '年份', Month: '月份', Day: '日期', Hour: '小时',
      City: '城市', Province: '省份', Region: '地区',
      Sort: '排序', Order: '顺序', Limit: '数量',
      Lang: '语言', Theme: '主题', Color: '颜色',
    };
    for (const [k, v] of Object.entries(map)) {
      if (id.endsWith(k)) return v;
    }
    return id;
  }
  return tag === 'select' ? '选择项' : '文本框';
}

function process(html) {
  let count = 0;
  
  // 处理 select
  html = html.replace(/<select\b([^>]*)>/g, (full, attrs) => {
    if (/\baria-label\s*=/.test(full)) return full;
    const label = inferLabel('select', full);
    count++;
    return `<select${attrs} aria-label="${label}">`;
  });
  
  // 处理 textarea
  html = html.replace(/<textarea\b([^>]*)>/g, (full, attrs) => {
    if (/\baria-label\s*=/.test(full)) return full;
    const label = inferLabel('textarea', full);
    count++;
    return `<textarea${attrs} aria-label="${label}">`;
  });
  
  return { html, count };
}

const files = fs.readdirSync(APP_DIR).filter(f => f.endsWith('.html'));
let total = 0;
files.forEach(f => {
  const fp = path.join(APP_DIR, f);
  const html = fs.readFileSync(fp, 'utf8');
  const { html: next, count } = process(html);
  if (count > 0) {
    fs.writeFileSync(fp, next);
    console.log(`${f}: +${count}`);
    total += count;
  }
});
console.log(`Total: +${total}`);